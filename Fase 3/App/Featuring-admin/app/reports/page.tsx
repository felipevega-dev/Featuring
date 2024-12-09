'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { FiUsers, FiFlag, FiCheckCircle, FiXCircle, FiUserCheck, FiMessageCircle, FiFilm, FiMusic } from 'react-icons/fi'

interface ReportStats {
  openReports: number;
  resolvedReports: number;
  dismissedReports: number;
}

export default function ReportsMain() {
  const [stats, setStats] = useState<ReportStats>({
    openReports: 0,
    resolvedReports: 0,
    dismissedReports: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchReportStats();
  }, []);

  const fetchReportStats = async () => {
    try {
      const [
        { count: openCount }, 
        { count: resolvedCount }, 
        { count: dismissedCount }
      ] = await Promise.all([
        supabase
          .from('reporte')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'abierto'),
        supabase
          .from('reporte')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'resuelto'),
        supabase
          .from('reporte')
          .select('*', { count: 'exact', head: true })
          .eq('estado', 'desestimado')
      ]);

      setStats({
        openReports: openCount || 0,
        resolvedReports: resolvedCount || 0,
        dismissedReports: dismissedCount || 0
      });
    } catch (error) {
      console.error('Error fetching report stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary-700">Reportes</h1>
        <Link href="/" className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 transition duration-300">
          Volver al Menú Principal
        </Link>
      </div>

      {/* Estadísticas de Reportes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <FiFlag className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pendientes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {!loading ? stats.openReports : '...'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <FiCheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Resueltos</p>
              <p className="text-2xl font-semibold text-gray-900">
                {!loading ? stats.resolvedReports : '...'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-red-50 rounded-lg">
              <FiXCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Desestimados</p>
              <p className="text-2xl font-semibold text-gray-900">
                {!loading ? stats.dismissedReports : '...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Secciones de Reportes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/reports/community" className="group">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:border-primary-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                <FiMusic className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Comunidad</h3>
                <p className="text-sm text-gray-500 mt-1">Reportes de canciones</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/reports/watch" className="group">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:border-primary-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-green-50 rounded-xl group-hover:bg-green-100 transition-colors">
                <FiFilm className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Watch</h3>
                <p className="text-sm text-gray-500 mt-1">Reportes de videos</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/reports/chat" className="group">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:border-primary-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-yellow-50 rounded-xl group-hover:bg-yellow-100 transition-colors">
                <FiMessageCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Chat</h3>
                <p className="text-sm text-gray-500 mt-1">Reportes de chat</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/reports/profiles" className="group">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 hover:border-primary-100 hover:shadow-md transition-all duration-200">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
                <FiUserCheck className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Perfiles</h3>
                <p className="text-sm text-gray-500 mt-1">Reportes de perfiles</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
