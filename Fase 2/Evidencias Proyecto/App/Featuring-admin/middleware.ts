import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { metricsMiddleware } from './middleware/metrics'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session && req.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (session && req.nextUrl.pathname !== '/login') {
    
    try {
      const { data: adminData, error } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!adminData) {
        await supabase.auth.signOut()
        return NextResponse.redirect(new URL('/login', req.url))
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  // Primero aplicar el middleware de métricas
  const metricsRes = await metricsMiddleware(req)
  if (metricsRes) return metricsRes

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 