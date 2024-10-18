'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'

interface Report {
  id: number;
  usuario_reportante_id: string;
  usuario_reportado_id: string;
  contenido_id: number;
  tipo_contenido: string;
  razon: string;
  estado: string;
  created_at: string;
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchReports()
  }, [])

  async function fetchReports() {
    setLoading(true)
    const { data, error } = await supabase
      .from('reporte')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reports:', error)
      setError('No se pudieron cargar los reportes')
    } else {
      setReports(data || [])
    }
    setLoading(false)
  }

  async function handleReportAction(reportId: number, action: 'resolve' | 'dismiss') {
    try {
      await supabase
        .from('reporte')
        .update({ estado: action === 'resolve' ? 'resuelto' : 'descartado' })
        .eq('id', reportId)
      fetchReports() // Refresh the report list
    } catch (error) {
      console.error(`Error updating report:`, error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary-700">Reportes</h1>
        <Link href="/" className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 transition duration-300">
          Volver al Menú Principal
        </Link>
      </div>

      {loading && <div className="text-center text-xl">Cargando reportes...</div>}
      {error && <div className="text-center text-xl text-danger-600">Error: {error}</div>}

      {!loading && !error && (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reportante</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reportado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contenido</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.usuario_reportante_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.usuario_reportado_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.tipo_contenido} (ID: {report.contenido_id})
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{report.razon}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      report.estado === 'resuelto' ? 'bg-green-100 text-green-800' :
                      report.estado === 'descartado' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {report.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(report.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleReportAction(report.id, 'resolve')}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                      disabled={report.estado !== 'pendiente'}
                    >
                      Resolver
                    </button>
                    <button
                      onClick={() => handleReportAction(report.id, 'dismiss')}
                      className="text-secondary-600 hover:text-secondary-900"
                      disabled={report.estado !== 'pendiente'}
                    >
                      Descartar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
