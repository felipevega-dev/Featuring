'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { FiUsers, FiAlertCircle, FiCheckCircle, FiLogOut, FiActivity, FiBarChart2 } from 'react-icons/fi'
import { useAdminStats } from '@/hooks/useAdminStats'

export default function Home() {
  const [session, setSession] = useState<Session | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const { totalUsers, pendingContent, activeReports, approvedContent, isLoading, error } = useAdminStats()

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
      <div className="w-full max-w-4xl space-y-6 sm:space-y-8">
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Panel de Administración</h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">Bienvenido, {session.user.email}</p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Usuarios Totales</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : totalUsers}
                </h3>
              </div>
              <FiUsers className="text-primary-500" size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Contenido Pendiente</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : pendingContent}
                </h3>
              </div>
              <FiActivity className="text-secondary-500" size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Reportes Pendientes</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : activeReports}
                </h3>
              </div>
              <FiAlertCircle className="text-warning-500" size={24} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Contenido Aprobado</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {isLoading ? '...' : approvedContent}
                </h3>
              </div>
              <FiBarChart2 className="text-success-500" size={24} />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4 sm:space-y-6">
          <Link href="/user-management" className="flex items-center justify-center px-6 sm:px-8 py-4 sm:py-6 border border-transparent rounded-lg shadow-md text-lg sm:text-xl font-medium text-white bg-primary-600 hover:bg-primary-700 transition duration-300 w-full">
            <FiUsers className="mr-4" size={24} />
            Gestión de Usuarios
          </Link>
          <Link href="/content-moderation" className="flex items-center justify-center px-6 sm:px-8 py-4 sm:py-6 border border-transparent rounded-lg shadow-md text-lg sm:text-xl font-medium text-white bg-secondary-600 hover:bg-secondary-700 transition duration-300 w-full">
            <FiCheckCircle className="mr-4" size={24} />
            Moderación de Contenido
          </Link>
          <Link href="/reports" className="flex items-center justify-center px-6 sm:px-8 py-4 sm:py-6 border border-transparent rounded-lg shadow-md text-lg sm:text-xl font-medium text-white bg-warning-600 hover:bg-warning-700 transition duration-300 w-full">
            <FiAlertCircle className="mr-4" size={24} />
            Reportes
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center justify-center px-6 sm:px-8 py-4 sm:py-6 border border-transparent rounded-lg shadow-md text-lg sm:text-xl font-medium text-white bg-red-600 hover:bg-red-700 transition duration-300 w-full mt-8 sm:mt-12"
          >
            <FiLogOut className="mr-4" size={24} />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}