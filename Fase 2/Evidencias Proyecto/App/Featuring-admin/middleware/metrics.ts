import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function metricsMiddleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Registrar el inicio de la request
  const startTime = Date.now()
  
  // Configurar variables para el trigger
  await supabase.rpc('set_request_vars', {
    method: req.method,
    path: req.nextUrl.pathname,
    start_time: new Date(startTime).toISOString()
  })

  // Continuar con la request
  const response = await res

  // Registrar el fin de la request
  const endTime = Date.now()
  const duration = endTime - startTime

  // Actualizar el estado de la response
  await supabase.rpc('set_response_vars', {
    status: response.status,
    duration
  })

  return response
} 