'use client'

import { useState, useEffect, Fragment } from 'react'
import { supabaseAdmin } from '../../../lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Session } from '@supabase/supabase-js'
import { notificationService } from '../../../services/notificationService';

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

interface ResolutionForm {
  tipo: 'amonestacion' | 'suspension_temporal' | 'suspension_permanente';
  motivo: string;
  duracion?: number | undefined;
  eliminarContenido: boolean;
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
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null);
  const [resolutionForm, setResolutionForm] = useState<ResolutionForm>({
    tipo: 'amonestacion',
    motivo: '',
    duracion: undefined,
    eliminarContenido: false
  });
  const [session, setSession] = useState<Session | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchReportes()
  }, [currentPage])

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

    if (reporte.tipo_contenido === 'cancion' && reporte.contenido_id) {
      try {
        const { data, error } = await supabaseAdmin
          .from('cancion')
          .select(`
            *,
            perfil:usuario_id (username)
          `)
          .eq('id', reporte.contenido_id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        // Establecer contentDetails incluso si la canción no existe
        setContentDetails(data || {
          id: parseInt(reporte.contenido_id),
          titulo: '[Canción eliminada]',
          descripcion: 'Esta canción ha sido eliminada por un administrador.',
          caratula: '',
          archivo_audio: '',
          usuario_id: reporte.usuario_reportado_id,
          artista: reporte.usuario_reportado.username || 'Usuario desconocido'
        });
      } catch (error) {
        console.error('Error fetching song details:', error);
        // En caso de error, también mostrar un estado por defecto
        setContentDetails({
          id: parseInt(reporte.contenido_id || '0'),
          titulo: '[Error al cargar la canción]',
          descripcion: 'No se pudo cargar la información de la canción.',
          caratula: '',
          archivo_audio: '',
          usuario_id: reporte.usuario_reportado_id,
          artista: reporte.usuario_reportado.username || 'Usuario desconocido'
        });
      }
    }

    setSelectedReporte(reporte);
    setExpandedReporte(reporteId);
  };

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
    if (action === 'resolve') {
      const reporte = reportes.find(r => r.id === reporteId);
      if (!reporte) return;
      setSelectedReporte(reporte);
      setShowResolutionModal(true);
      return;
    }

    try {
      const newStatus = action === 'dismiss' ? 'desestimado' : 'abierto';
      
      await supabaseAdmin
        .from('reporte')
        .update({ estado: newStatus })
        .eq('id', reporteId);

      fetchReportes();
    } catch (error) {
      console.error(`Error actualizando el estado del reporte:`, error);
      setError(`No se pudo actualizar el estado del reporte. Por favor, intente de nuevo.`);
    }
  };

  const handleResolveReport = async () => {
    if (!selectedReporte || !resolutionForm.motivo || !session?.user?.id) {
      setError('No se puede resolver el reporte. Asegúrese de estar autenticado y proporcionar un motivo.');
      return;
    }

    try {
      const { error: sancionError } = await supabaseAdmin
        .from('sancion_administrativa')
        .insert({
          usuario_id: selectedReporte.usuario_reportado_id,
          admin_id: session.user.id,
          tipo_sancion: resolutionForm.tipo,
          motivo: resolutionForm.motivo,
          duracion_dias: resolutionForm.duracion,
          estado: 'activa',
          reporte_id: selectedReporte.id  // Vinculamos la sanción con el reporte
        });

      if (sancionError) throw sancionError;

      await notificationService.handleReportValidation({
        reporterId: selectedReporte.usuario_reportante_id,
        reportedUserId: selectedReporte.usuario_reportado_id,
        contentId: selectedReporte.contenido_id || undefined,
        adminId: session.user.id,
        motivo: resolutionForm.motivo,
        sanctionType: resolutionForm.tipo
      });

      if (resolutionForm.eliminarContenido && selectedReporte.contenido_id) {
        try {
          // 1. Primero eliminar todos los likes de la canción
          await supabaseAdmin
            .from('likes_cancion')
            .delete()
            .eq('cancion_id', selectedReporte.contenido_id);

          // 2. Eliminar todos los comentarios de la canción
          await supabaseAdmin
            .from('comentario_cancion')
            .delete()
            .eq('cancion_id', selectedReporte.contenido_id);

          // 3. Obtener la URL de la canción y la carátula para construir los paths correctos
          const { data: cancionData } = await supabaseAdmin
            .from('cancion')
            .select('archivo_audio, caratula, usuario_id')
            .eq('id', selectedReporte.contenido_id)
            .single();

          if (cancionData?.archivo_audio && cancionData?.usuario_id) {
            // Eliminar el archivo de audio
            const audioPath = `${cancionData.usuario_id}/${cancionData.archivo_audio.split('/').pop()}`;
            if (audioPath) {
              const { error: audioError } = await supabaseAdmin.storage
                .from('canciones')
                .remove([audioPath]);

              if (audioError) {
                console.error('Error eliminando archivo de audio:', audioError);
              }
            }

            // Eliminar la carátula si existe
            if (cancionData.caratula) {
              const caratulaPath = `${cancionData.usuario_id}/${cancionData.caratula.split('/').pop()}`;
              if (caratulaPath) {
                const { error: caratulaError } = await supabaseAdmin.storage
                  .from('caratulas')
                  .remove([caratulaPath]);

                if (caratulaError) {
                  console.error('Error eliminando carátula:', caratulaError);
                }
              }
            }
          }

          // 4. Finalmente eliminar el registro de la canción
          const { error: deleteError } = await supabaseAdmin
            .from('cancion')
            .delete()
            .eq('id', selectedReporte.contenido_id);

          if (deleteError) throw deleteError;

        } catch (error) {
          console.error('Error al eliminar la canción:', error);
          throw new Error('No se pudo eliminar la canción y sus registros relacionados');
        }
      }

      await supabaseAdmin
        .from('reporte')
        .update({ estado: 'resuelto' })
        .eq('id', selectedReporte.id);

      setShowResolutionModal(false);
      setSelectedReporte(null);
      setResolutionForm({
        tipo: 'amonestacion',
        motivo: '',
        duracion: undefined,
        eliminarContenido: false
      });

      fetchReportes();

    } catch (error) {
      console.error('Error al resolver el reporte:', error);
      setError('No se pudo resolver el reporte. Por favor, intente de nuevo.');
    }
  };

  const renderResolutionModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Resolver Reporte
          </h3>
          
          <div className="mt-2 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Sanción
              </label>
              <select
                value={resolutionForm.tipo}
                onChange={(e) => setResolutionForm({
                  ...resolutionForm,
                  tipo: e.target.value as 'amonestacion' | 'suspension_temporal' | 'suspension_permanente'
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="amonestacion">Amonestación</option>
                <option value="suspension_temporal">Suspensión Temporal</option>
                <option value="suspension_permanente">Suspensión Permanente</option>
              </select>
            </div>

            {resolutionForm.tipo === 'suspension_temporal' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Duración (días)
                </label>
                <input
                  type="number"
                  min="1"
                  value={resolutionForm.duracion || ''}
                  onChange={(e) => setResolutionForm({
                    ...resolutionForm,
                    duracion: e.target.value ? parseInt(e.target.value) : undefined
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Motivo de la Sanción
              </label>
              <textarea
                value={resolutionForm.motivo}
                onChange={(e) => setResolutionForm({
                  ...resolutionForm,
                  motivo: e.target.value
                })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Describa el motivo de la sanción..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="eliminarContenido"
                checked={resolutionForm.eliminarContenido}
                onChange={(e) => setResolutionForm({
                  ...resolutionForm,
                  eliminarContenido: e.target.checked
                })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="eliminarContenido" className="ml-2 block text-sm text-gray-900">
                Eliminar el contenido reportado
              </label>
            </div>
          </div>

          <div className="mt-5 sm:mt-6 space-y-2">
            <button
              type="button"
              onClick={handleResolveReport}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
            >
              Resolver Reporte
            </button>
            <button
              type="button"
              onClick={() => {
                setShowResolutionModal(false);
                setSelectedReporte(null);
                setResolutionForm({
                  tipo: 'amonestacion',
                  motivo: '',
                  duracion: undefined,
                  eliminarContenido: false
                });
              }}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const totalPages = Math.ceil(totalReportes / REPORTES_PER_PAGE)

  return (
    <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-4xl font-bold text-primary-700 mb-2 sm:mb-0">
          Reportes de Comunidad
        </h1>
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
                      <div className="mt-2">
                        <span className={`px-2 inline-flex text-lg leading-5 font-semibold rounded-full ${getReportStatusColor(reporte.estado)}`}>
                          {reporte.estado.charAt(0).toUpperCase() + reporte.estado.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleExpandReporte(reporte.id)}
                        className="mt-4 sm:mt-0 px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
                      >
                        Ver detalles
                      </button>
                      <Link
                        href={`/user-management?search=${reporte.usuario_reportado.username}#search`}
                        className="mt-4 sm:mt-0 px-3 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600 transition-colors flex items-center space-x-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Modal de detalles */}
          {expandedReporte && selectedReporte && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto">
              <div className="bg-white rounded-lg p-6 m-4 max-w-4xl w-full max-h-[80vh] flex flex-col">
                {/* Header del modal con título y estado */}
                <div className="flex justify-between items-center mb-4 pb-4 border-b">
                  <div>
                    <h3 className="text-2xl font-bold text-primary-700">Detalles del Reporte</h3>
                    <div className="mt-2">
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getReportStatusColor(selectedReporte.estado)}`}>
                        {selectedReporte.estado.charAt(0).toUpperCase() + selectedReporte.estado.slice(1)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setExpandedReporte(null);
                      setContentDetails(null);
                      setSelectedReporte(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Contenido del modal */}
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Información del reporte */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-lg mb-2">Información del Reporte</h4>
                        <div className="space-y-2">
                          <p><strong>Reportante:</strong> {selectedReporte.usuario_reportante.username}</p>
                          <p><strong>Reportado:</strong> {selectedReporte.usuario_reportado.username}</p>
                          <p><strong>Fecha:</strong> {new Date(selectedReporte.created_at).toLocaleString()}</p>
                          <p><strong>Razón:</strong> {selectedReporte.razon}</p>
                          <p><strong>Tipo de contenido:</strong> {selectedReporte.tipo_contenido}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contenido reportado */}
                    {contentDetails && (
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-semibold text-lg mb-2">Canción Reportada</h4>
                          {contentDetails.archivo_audio ? (
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
                                <p><strong>Artista:</strong> {selectedReporte?.usuario_reportado.username}</p>
                            </div>
                            <div className="mt-4 w-full">
                              <audio controls className="w-full mb-4">
                                  <source src={contentDetails.archivo_audio} type="audio/mpeg" />
                                Tu navegador no soporta el elemento de audio.
                              </audio>
                            </div>
                          </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-lg">
                              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                              <h5 className="text-lg font-medium text-gray-900 mb-2">Canción Eliminada</h5>
                              <p className="text-gray-500 text-center">Esta canción ha sido eliminada del sistema</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer con acciones */}
                <div className="mt-6 pt-4 border-t flex justify-end space-x-4">
                  <button
                    onClick={() => handleReporteAction(selectedReporte.id, 'open')}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                  >
                    Marcar como abierto
                  </button>
                  <button
                    onClick={() => handleReporteAction(selectedReporte.id, 'resolve')}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                  >
                    Resolver
                  </button>
                  <button
                    onClick={() => handleReporteAction(selectedReporte.id, 'dismiss')}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                  >
                    Desestimar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Paginación */}
          <div className="mt-6 flex justify-between items-center bg-white p-4 rounded-lg shadow">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-primary-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
            >
              Anterior
            </button>
            <span className="text-sm font-medium text-gray-700">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-primary-500 text-white px-4 py-2 rounded disabled:bg-gray-300"
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      {/* Modal de resolución */}
      {showResolutionModal && renderResolutionModal()}
    </div>
  )
}
