import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log('Session:', session)

  if (!session && req.nextUrl.pathname !== '/login') {
    console.log('No hay sesión activa')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (session && req.nextUrl.pathname !== '/login') {
    console.log('Usuario autenticado:', session.user.id)
    
    try {
      const { data: adminData, error } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      console.log('Consulta admin_roles:', {
        userId: session.user.id,
        result: adminData,
        error
      })

      if (!adminData) {
        console.log('No se encontró rol de admin')
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/login', req.url))
      }

      console.log('Rol encontrado:', adminData.role)
    } catch (error) {
      console.error('Error al verificar rol:', error)
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 