'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { 
  FiUsers, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiLogOut, 
  FiActivity,
  FiPieChart,
  FiSettings,
  FiMail
} from 'react-icons/fi'
import { useAdminStats } from '@/hooks/useAdminStats'

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { 
    totalUsers, 
    pendingContent, 
    activeReports, 
    approvedContent,
    isLoading, 
    error 
  } = useAdminStats()

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 py-8">
        <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-primary-700 text-center">Panel de Administración</h2>
        <Link href="/login" className="bg-primary-500 text-white py-4 px-8 rounded-lg text-xl hover:bg-primary-600 transition duration-300 shadow-md w-full max-w-xs text-center">
          Iniciar sesión
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header Principal */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
              {session && (
                <p className="mt-1 text-sm text-gray-500">
                  Bienvenido, {session.user.email}
                </p>
              )}
            </div>
            <button 
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <FiLogOut className="mr-2 -ml-1 h-5 w-5" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Menú Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Gestión de Usuarios */}
          <Link href="/user-management" className="group">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:border-primary-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                  <FiUsers className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Gestión de Usuarios</h3>
                  <p className="text-sm text-gray-500 mt-1">Administrar usuarios y permisos</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Moderación de Contenido */}
          <Link href="/content-moderation" className="group">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:border-primary-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
                  <FiCheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Moderación</h3>
                  <p className="text-sm text-gray-500 mt-1">Revisar y aprobar contenido</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Reportes */}
          <Link href="/reports" className="group">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:border-primary-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-red-50 rounded-xl group-hover:bg-red-100 transition-colors">
                  <FiAlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Reportes</h3>
                  <p className="text-sm text-gray-500 mt-1">Gestionar reportes de usuarios</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Estadísticas */}
          <Link href="/dashboard" className="group">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:border-primary-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
                  <FiPieChart className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Estadísticas</h3>
                  <p className="text-sm text-gray-500 mt-1">Métricas y análisis detallados</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Configuración del Sistema */}
          <Link href="/system-config" className="group">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:border-primary-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-gray-50 rounded-xl group-hover:bg-gray-100 transition-colors">
                  <FiSettings className="h-8 w-8 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Configuración</h3>
                  <p className="text-sm text-gray-500 mt-1">Ajustes del sistema</p>
                </div>
              </div>
            </div>
          </Link>

          {/* Soporte */}
          <Link href="/soporte" className="group">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:border-primary-100 hover:shadow-md transition-all duration-200">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
                  <FiMail className="h-8 w-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Soporte</h3>
                  <p className="text-sm text-gray-500 mt-1">Chat con usuarios</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}