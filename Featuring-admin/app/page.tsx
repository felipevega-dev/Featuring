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
  FiBarChart2,
  FiMusic,
  FiVideo,
  FiFlag,
  FiTrendingUp,
  FiDatabase,
  FiPieChart
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
    totalSongs,
    totalVideos,
    recentActivity,
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
    <div className="flex flex-col items-center justify-center bg-gray-100 py-8 px-4 sm:px-6">
      <div className="w-full max-w-7xl space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Panel de Administración</h2>
          <p className="text-lg sm:text-xl text-gray-600">
            Bienvenido, {session.user.email}
          </p>
        </div>

        {/* Estadísticas Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Usuarios Totales</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : totalUsers}
                </h3>
              </div>
              <FiUsers className="text-primary-500 w-8 h-8" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Contenido Pendiente</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : pendingContent}
                </h3>
              </div>
              <FiActivity className="text-secondary-500 w-8 h-8" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Reportes Activos</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : activeReports}
                </h3>
              </div>
              <FiFlag className="text-warning-500 w-8 h-8" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Contenido Aprobado</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : approvedContent}
                </h3>
              </div>
              <FiCheckCircle className="text-success-500 w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Accesos Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/user-management" 
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all hover:bg-primary-50 group">
            <div className="flex items-center space-x-4">
              <div className="bg-primary-100 p-3 rounded-lg group-hover:bg-primary-200 transition-colors">
                <FiUsers className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Gestión de Usuarios</h3>
                <p className="text-sm text-gray-500">Administrar usuarios y permisos</p>
              </div>
            </div>
          </Link>

          <Link href="/content-moderation" 
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all hover:bg-secondary-50 group">
            <div className="flex items-center space-x-4">
              <div className="bg-secondary-100 p-3 rounded-lg group-hover:bg-secondary-200 transition-colors">
                <FiCheckCircle className="w-6 h-6 text-secondary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Moderación de Contenido</h3>
                <p className="text-sm text-gray-500">Revisar y aprobar contenido</p>
              </div>
            </div>
          </Link>

          <Link href="/reports" 
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all hover:bg-warning-50 group">
            <div className="flex items-center space-x-4">
              <div className="bg-warning-100 p-3 rounded-lg group-hover:bg-warning-200 transition-colors">
                <FiAlertCircle className="w-6 h-6 text-warning-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Reportes</h3>
                <p className="text-sm text-gray-500">Gestionar reportes de usuarios</p>
              </div>
            </div>
          </Link>

          <Link href="/dashboard" 
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all hover:bg-primary-50 group">
            <div className="flex items-center space-x-4">
              <div className="bg-primary-100 p-3 rounded-lg group-hover:bg-primary-200 transition-colors">
                <FiPieChart className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Estadísticas Avanzadas</h3>
                <p className="text-sm text-gray-500">Métricas detalladas del sistema</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Botón de Cerrar Sesión */}
        <button 
          onClick={handleLogout}
          className="mt-8 flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 w-full sm:w-auto"
        >
          <FiLogOut className="mr-2" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}