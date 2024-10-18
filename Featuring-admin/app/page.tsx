'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { Session } from '@supabase/supabase-js'

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }

    fetchSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-3xl font-bold mb-8 text-primary-700">Bienvenido al Panel de Administración</h2>
      {session ? (
        <div className="text-center">
          <p className="text-xl mb-6 text-secondary-700">Hola, {session.user.email}</p>
          <nav className="space-y-4">
            <Link href="/content-moderation" className="block w-64 bg-primary-500 text-white py-2 px-4 rounded hover:bg-primary-600 transition duration-300">
              Moderación de Contenido
            </Link>
            <Link href="/user-management" className="block w-64 bg-secondary-500 text-white py-2 px-4 rounded hover:bg-secondary-600 transition duration-300">
              Gestión de Usuarios
            </Link>
            <Link href="/reports" className="block w-64 bg-warning-500 text-white py-2 px-4 rounded hover:bg-warning-600 transition duration-300">
              Reportes
            </Link>
          </nav>
        </div>
      ) : (
        <Link href="/login" className="bg-primary-500 text-white py-2 px-6 rounded hover:bg-primary-600 transition duration-300">
          Iniciar sesión
        </Link>
      )}
    </div>
  )
}
