'use client'

import { useState, useEffect, Fragment } from 'react'
import { supabaseAdmin } from '../../../lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

interface Reporte {
  id: string;
  contenido: string;
  created_at: string;
  estado: 'abierto' | 'resuelto' | 'desestimado';
  usuario_reportante_id: string;
  usuario_reportado_id: string;
  usuario_reportante: { username: string | null };
  usuario_reportado: { username: string | null };
  razon: string;
  tipo_contenido: string;
  contenido_id: string | null;
}

interface ContentDetails {
  id: number;
  titulo: string;
  artista: string;
  caratula: string;
  archivo_audio: string;
  usuario_id: string;
}

const REPORTES_PER_PAGE = 20

export default function CommunityReports() {
  const [reportes, setReportes] = useState<Reporte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalReportes, setTotalReportes] = useState(0)
  const [expandedReporte, setExpandedReporte] = useState<string | null>(null)
  const [contentDetails, setContentDetails] = useState<ContentDetails | null>(null)

  useEffect(() => {
    fetchReportes()
  }, [currentPage])

  async function fetchReportes() {
    setLoading(true)
    setError(null)
    try {
      const { count } = await supabaseAdmin
        .from('reporte')
        .select('*', { count: 'exact', head: true })
        .eq('tipo_contenido', 'cancion')

      setTotalReportes(count || 0)

      const { data: reportes, error: reportesError } = await supabaseAdmin
        .from("reporte")
        .select(`
          *,
          usuario_reportante:perfil!usuario_reportante_id (username),
          usuario_reportado:perfil!usuario_reportado_id (username)
        `)
        .eq('tipo_contenido', 'cancion')
        .range((currentPage - 1) * REPORTES_PER_PAGE, currentPage * REPORTES_PER_PAGE - 1)
        .order('created_at', { ascending: false })

      if (reportesError) throw reportesError

      setReportes(reportes)
    } catch (error) {
      console.error('Error al obtener los reportes:', error)
      setError('No se pudieron cargar los reportes')
    } finally {
      setLoading(false)
    }
  }

  const handleExpandReporte = async (reporteId: string) => {
    const reporte = reportes.find(r => r.id === reporteId);
    if (!reporte) return;

    if (reporte.tipo_contenido === 'cancion') {
      try {
        const { data, error } = await supabaseAdmin
          .from('cancion')
          .select('*')
          .eq('id', reporte.contenido_id)
          .single();

        if (error) throw error;

        if (data) {
          setContentDetails({
            ...data,
            caratula: data.caratula || "",
            archivo_audio: data.archivo_audio || "",
          });
        }
      } catch (error) {
        console.error('Error fetching song details:', error);
      }
    }

    setExpandedReporte(expandedReporte === reporteId ? null : reporteId);
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const getReportStatusColor = (estado: string) => {
    switch (estado) {
      case 'abierto':
        return 'bg-yellow-100 text-yellow-800';
      case 'resuelto':
        return 'bg-green-100 text-green-800';
      case 'desestimado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleReporteAction = async (reporteId: string, action: 'resolve' | 'dismiss' | 'open') => {
    try {
      let newStatus;
      switch (action) {
        case 'resolve':
          newStatus = 'resuelto';
          break;
        case 'dismiss':
          newStatus = 'desestimado';
          break;
        case 'open':
          newStatus = 'abierto';
          break;
      }

      await supabaseAdmin
        .from('reporte')
        .update({ estado: newStatus })
        .eq('id', reporteId);

      // Refresh the report list after action
      fetchReportes();
    } catch (error) {
      console.error(`Error actualizando el estado del reporte:`, error);
      setError(`No se pudo actualizar el estado del reporte. Por favor, intente de nuevo.`);
    }
  };

  const totalPages = Math.ceil(totalReportes / REPORTES_PER_PAGE)

  return (
    <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-4xl font-bold text-primary-700 mb-2 sm:mb-0">Reportes de Comunidad</h1>
        <Link href="/reports" className="bg-primary-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base">
          Volver a Reportes
        </Link>
      </div>

      {loading && <div className="text-center text-lg sm:text-xl">Cargando reportes...</div>}
      {error && <div className="text-center text-lg sm:text-xl text-danger-600">Error: {error}</div>}
      
      {!loading && !error && reportes.length > 0 && (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {reportes.map((reporte) => (
                <li key={reporte.id} className={`p-4 sm:p-6 ${reporte.estado === 'abierto' ? 'bg-white' : 'bg-gray-50'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div>
                      <div className="text-base sm:text-lg font-medium text-gray-900">
                        Reporte de {reporte.usuario_reportante.username || 'Usuario desconocido'}
                      </div>
                      <div className="text-sm sm:text-base text-gray-500">
                        Contra {reporte.usuario_reportado.username || 'Usuario desconocido'}
                      </div>
                      <div className="text-sm text-gray-500">
                        Fecha: {new Date(reporte.created_at).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="text-sm text-red-500">Razón: {reporte.razon}</div>
                      <div className="text-sm text-gray-500">Tipo de contenido: {reporte.tipo_contenido}</div>
                      <div className="mt-6">
                        <span className={`px-2 inline-flex text-lg leading-5 font-semibold rounded-full ${getReportStatusColor(reporte.estado)}`}>
                          {reporte.estado.charAt(0).toUpperCase() + reporte.estado.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-3 mt-2 sm:mt-0">
                      <button
                        onClick={() => handleExpandReporte(reporte.id)}
                        className="text-primary-600 hover:text-secondary-500 text-base sm:text-lg font-medium mb-32"
                      >
                         {'->'} Ver detalles
                      </button>
                      <Menu as="div" className="relative inline-block text-left mb-32">
                        <div>
                          <Menu.Button className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white text-sm sm:text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-primary-500">
                            Acciones
                            <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
                          </Menu.Button>
                        </div>
                        <Transition
                          as={Fragment}
                          enter="transition ease-out duration-100"
                          enterFrom="transform opacity-0 scale-95"
                          enterTo="transform opacity-100 scale-100"
                          leave="transition ease-in duration-75"
                          leaveFrom="transform opacity-100 scale-100"
                          leaveTo="transform opacity-0 scale-95"
                        >
                          <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="py-1">
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleReporteAction(reporte.id, 'open')}
                                    className={`${
                                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                    } block w-full text-left px-4 py-2 text-sm sm:text-base`}
                                  >
                                    Marcar como abierto
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleReporteAction(reporte.id, 'resolve')}
                                    className={`${
                                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                    } block w-full text-left px-4 py-2 text-sm sm:text-base`}
                                  >
                                    Resolver
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleReporteAction(reporte.id, 'dismiss')}
                                    className={`${
                                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                    } block w-full text-left px-4 py-2 text-sm sm:text-base`}
                                  >
                                    Desestimar
                                  </button>
                                )}
                              </Menu.Item>
                            </div>
                          </Menu.Items>
                        </Transition>
                      </Menu>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Controles de paginación */}
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

      {/* Modal for expanded report details */}
      {expandedReporte && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="my-modal">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-2xl leading-6 font-bold text-primary-700 text-center mb-6">Detalles del Reporte</h3>
              <div className="mt-2 px-4 py-5 max-h-[70vh] overflow-y-auto">
                {(() => {
                  const reporte = reportes.find(r => r.id === expandedReporte);
                  if (!reporte) return <p className="text-lg">No se encontraron detalles del reporte.</p>;
                  return (
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/2 space-y-4 text-base">
                        <p><strong>Reportante:</strong> {reporte.usuario_reportante.username || 'Usuario desconocido'}</p>
                        <p><strong>Reportado:</strong> {reporte.usuario_reportado.username || 'Usuario desconocido'}</p>
                        <p><strong>Fecha:</strong> {new Date(reporte.created_at).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                        <p><strong>Estado:</strong> {reporte.estado}</p>
                        <p><strong>Razón:</strong> {reporte.razon}</p>
                        <p><strong>Tipo de contenido:</strong> {reporte.tipo_contenido}</p>
                        <p><strong>ID del contenido:</strong> {reporte.contenido_id || 'No especificado'}</p>
                        <p><strong>Contenido del reporte:</strong></p>
                        <p className="whitespace-pre-wrap">{reporte.contenido}</p>
                      </div>
                      
                      {contentDetails && reporte.tipo_contenido === 'cancion' && (
                        <div className="md:w-1/2 mt-6 md:mt-0 md:ml-6">
                          <h4 className="text-xl font-semibold mb-4">Detalles de la Canción</h4>
                          <div className="flex flex-col items-center">
                            <Image 
                              src={contentDetails.caratula || "https://via.placeholder.com/200"}
                              alt="Carátula"
                              width={200}
                              height={200}
                              className="rounded-md mb-4"
                            />
                            <div className="text-center">
                              <p><strong>Título:</strong> {contentDetails.titulo}</p>
                              <p><strong>Artista:</strong> {reporte.usuario_reportado.username}</p>
                            </div>
                            <div className="mt-4 w-full">
                              <audio controls className="w-full mb-4">
                                <source src={contentDetails.archivo_audio || ""} type="audio/mpeg" />
                                Tu navegador no soporta el elemento de audio.
                              </audio>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div className="items-center px-4 py-3 mt-6">
                <button
                  className="px-6 py-3 bg-primary-500 text-white text-lg font-medium rounded-md w-full shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-300 transition duration-300"
                  onClick={() => {
                    setExpandedReporte(null);
                    setContentDetails(null);
                  }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
