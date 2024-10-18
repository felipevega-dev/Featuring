'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import Image from 'next/image'

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

interface ContentDetails {
  id: number;
  usuario_id: string;
  titulo: string;
  archivo_audio: string | null;
  caratula: string | null;
  contenido: string;
  genero: string;
  created_at: string;
}

const REPORTS_PER_PAGE = 10

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [contentDetails, setContentDetails] = useState<ContentDetails | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalReports, setTotalReports] = useState(0)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchReports()
  }, [currentPage])

  async function fetchReports() {
    setLoading(true)
    try {
      const { count } = await supabase
        .from('reporte')
        .select('*', { count: 'exact', head: true })

      setTotalReports(count || 0)

      const { data, error } = await supabase
        .from('reporte')
        .select('*')
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * REPORTS_PER_PAGE, currentPage * REPORTS_PER_PAGE - 1)

      if (error) throw error

      console.log('Fetched reports:', data)

      if (data) {
        setReports(data)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      setError('No se pudieron cargar los reportes')
    } finally {
      setLoading(false)
    }
  }

  async function fetchContentDetails(reportId: number, contentId: number, contentType: string) {
    try {
      let { data, error } = await supabase
        .from(contentType === 'cancion' ? 'cancion' : 'otro_tipo_contenido')
        .select('*')
        .eq('id', contentId)
        .single()

      if (error) throw error

      console.log('Fetched content details:', data)
      setContentDetails(data)
      setSelectedReport(reports.find(r => r.id === reportId) || null)
      setIsModalOpen(true)
    } catch (error) {
      console.error('Error fetching content details:', error)
    }
  }

  async function handleReportAction(action: 'delete' | 'safe') {
    if (!selectedReport || !contentDetails) return

    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from(selectedReport.tipo_contenido === 'cancion' ? 'cancion' : 'otro_tipo_contenido')
          .delete()
          .eq('id', contentDetails.id)
        
        if (error) throw error
      }

      const { error } = await supabase
        .from('reporte')
        .update({ estado: action === 'delete' ? 'resuelto' : 'descartado' })
        .eq('id', selectedReport.id)

      if (error) throw error

      setIsModalOpen(false)
      fetchReports()
    } catch (error) {
      console.error(`Error updating report:`, error)
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const totalPages = Math.ceil(totalReports / REPORTS_PER_PAGE)

  const ContentModal = () => {
    if (!selectedReport || !contentDetails) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">Contenido Reportado</h2>
          {selectedReport.tipo_contenido === 'cancion' && (
            <>
              <Image 
                src={contentDetails.caratula || "https://via.placeholder.com/200"}
                alt="Caratula" 
                width={200} 
                height={200} 
                className="mb-4 mx-auto"
              />
              <h3 className="text-xl font-semibold">{contentDetails.titulo}</h3>
              <p className="text-gray-600 mb-4">{contentDetails.genero}</p>
              <audio controls className="w-full mb-4">
                <source src={contentDetails.archivo_audio || ""} type="audio/mpeg" />
                Tu navegador no soporta el elemento de audio.
              </audio>
            </>
          )}
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => handleReportAction('safe')}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-300"
            >
              Contenido Seguro
            </button>
            <button
              onClick={() => handleReportAction('delete')}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-300"
            >
              Eliminar Contenido
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition duration-300"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-4xl font-bold text-primary-700 mb-2 sm:mb-0">Gestión de Reportes</h1>
        <Link href="/" className="bg-primary-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base">
          Volver al Menú Principal
        </Link>
      </div>

      {loading && <div className="text-center text-lg sm:text-xl">Cargando reportes...</div>}
      {error && <div className="text-center text-lg sm:text-xl text-danger-600">Error: {error}</div>}

      {!loading && !error && reports.length > 0 && (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reportante ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reportado ID</th>
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
                          onClick={() => fetchContentDetails(report.id, report.contenido_id, report.tipo_contenido)}
                          className="text-primary-600 hover:text-primary-900"
                          disabled={report.estado !== 'pendiente'}
                        >
                          Ver Contenido
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center bg-white p-4 rounded-lg shadow">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-primary-500 text-white px-4 py-2 rounded disabled:bg-gray-300 text-sm font-medium transition-colors duration-200 ease-in-out hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
            >
              Anterior
            </button>
            <span className="text-sm font-medium text-gray-700">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-primary-500 text-white px-4 py-2 rounded disabled:bg-gray-300 text-sm font-medium transition-colors duration-200 ease-in-out hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
            >
              Siguiente
            </button>
          </div>
        </>
      )}
      {isModalOpen && <ContentModal />}
    </div>
  )
}
