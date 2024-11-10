'use client'

import { useState, useEffect, Fragment } from 'react'
import { supabaseAdmin } from '../../../lib/supabase'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Session } from '@supabase/supabase-js'
import { notificationService } from '../../../services/notificationService'

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
}

interface ProfileDetails {
  usuario_id: string;
  username: string;
  foto_perfil: string | null;
  biografia: string;
  nacionalidad: string;
  edad: number;
  sexo: string;
  ubicacion: string;
  perfil_genero: { genero: string }[];
  perfil_habilidad: { habilidad: string }[];
  red_social: { nombre: string; url: string }[];
}

interface ResolutionForm {
  tipo: 'amonestacion' | 'suspension_temporal' | 'suspension_permanente';
  motivo: string;
  duracion?: number | undefined;
  eliminarFotoPerfil: boolean;
}

interface Sancion {
  id: number;
  tipo_sancion: 'amonestacion' | 'suspension_temporal' | 'suspension_permanente';
  motivo: string;
  duracion_dias?: number;
  created_at: string;
  admin: { username: string };
}

const REPORTES_PER_PAGE = 20

export default function ProfileReports() {
  const [reportes, setReportes] = useState<Reporte[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalReportes, setTotalReportes] = useState(0)
  const [expandedReporte, setExpandedReporte] = useState<string | null>(null)
  const [profileDetails, setProfileDetails] = useState<ProfileDetails | null>(null)
  const [showResolutionModal, setShowResolutionModal] = useState(false)
  const [selectedReporte, setSelectedReporte] = useState<Reporte | null>(null)
  const [resolutionForm, setResolutionForm] = useState<ResolutionForm>({
    tipo: 'amonestacion',
    motivo: '',
    duracion: undefined,
    eliminarFotoPerfil: false
  })
  const [session, setSession] = useState<Session | null>(null)
  const supabase = createClientComponentClient()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const [showSancionesModal, setShowSancionesModal] = useState(false);
  const [sanciones, setSanciones] = useState<Sancion[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

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
        .eq('tipo_contenido', 'perfil')

      setTotalReportes(count || 0)

      const { data: reportes, error: reportesError } = await supabaseAdmin
        .from("reporte")
        .select(`
          *,
          usuario_reportante:perfil!usuario_reportante_id (username),
          usuario_reportado:perfil!usuario_reportado_id (username)
        `)
        .eq('tipo_contenido', 'perfil')
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

    try {
      const { data, error } = await supabaseAdmin
        .from('perfil')
        .select(`
          *,
          perfil_genero (genero),
          perfil_habilidad (habilidad),
          red_social (nombre, url)
        `)
        .eq('usuario_id', reporte.usuario_reportado_id)
        .single();

      if (error) throw error;

      if (data) {
        setProfileDetails(data);
      }
    } catch (error) {
      console.error('Error fetching profile details:', error);
    }

    setExpandedReporte(expandedReporte === reporteId ? null : reporteId);
  }

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
      // 1. Aplicar sanción
      const { error: sancionError } = await supabaseAdmin
        .from('sancion_administrativa')
        .insert({
          usuario_id: selectedReporte.usuario_reportado_id,
          admin_id: session.user.id,
          tipo_sancion: resolutionForm.tipo,
          motivo: resolutionForm.motivo,
          duracion_dias: resolutionForm.duracion,
          estado: 'activa',
          reporte_id: selectedReporte.id
        });

      if (sancionError) throw sancionError;

      // 2. Manejar notificaciones y puntos
      await notificationService.handleReportValidation({
        reporterId: selectedReporte.usuario_reportante_id,
        reportedUserId: selectedReporte.usuario_reportado_id,
        adminId: session.user.id,
        motivo: resolutionForm.motivo,
        sanctionType: resolutionForm.tipo
      });

      // 3. Eliminar foto de perfil si se seleccionó esa opción
      if (resolutionForm.eliminarFotoPerfil && profileDetails?.foto_perfil) {
        try {
          // Obtener el path de la foto de perfil
          const fotoPath = profileDetails.foto_perfil.split('/').pop();
          if (fotoPath) {
            // Eliminar el archivo del storage
            const { error: storageError } = await supabaseAdmin.storage
              .from('fotoperfil')
              .remove([fotoPath]);

            if (storageError) {
              console.error('Error eliminando foto de perfil:', storageError);
            }

            // Actualizar el perfil para quitar la referencia a la foto
            await supabaseAdmin
              .from('perfil')
              .update({ foto_perfil: null })
              .eq('usuario_id', selectedReporte.usuario_reportado_id);
          }
        } catch (error) {
          console.error('Error al eliminar la foto de perfil:', error);
        }
      }

      // 4. Marcar reporte como resuelto
      await supabaseAdmin
        .from('reporte')
        .update({ estado: 'resuelto' })
        .eq('id', selectedReporte.id);

      // 5. Limpiar estado y refrescar
      setShowResolutionModal(false);
      setSelectedReporte(null);
      setResolutionForm({
        tipo: 'amonestacion',
        motivo: '',
        duracion: undefined,
        eliminarFotoPerfil: false
      });

      fetchReportes();

    } catch (error) {
      console.error('Error al resolver el reporte:', error);
      setError('No se pudo resolver el reporte. Por favor, intente de nuevo.');
    }
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

  const totalPages = Math.ceil(totalReportes / REPORTES_PER_PAGE)

  const ResolutionModal = () => (
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
              tipo: e.target.value as ResolutionForm['tipo']
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
                duracion: parseInt(e.target.value)
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
            id="eliminarFotoPerfil"
            checked={resolutionForm.eliminarFotoPerfil}
            onChange={(e) => setResolutionForm({
              ...resolutionForm,
              eliminarFotoPerfil: e.target.checked
            })}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="eliminarFotoPerfil" className="ml-2 block text-sm text-gray-900">
            Eliminar foto de perfil del usuario
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
          onClick={() => setShowResolutionModal(false)}
          className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
        >
          Cancelar
        </button>
      </div>
    </div>
  );

  const fetchSanciones = async (userId: string) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('sancion_administrativa')
        .select(`
          *,
          admin:admin_id (username)
        `)
        .eq('usuario_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSanciones(data || []);
    } catch (error) {
      console.error('Error al obtener sanciones:', error);
    }
  };

  const SancionesHistorialModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Historial de Sanciones</h3>
          <button
            onClick={() => setShowSancionesModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {sanciones.length > 0 ? (
          <div className="space-y-4">
            {sanciones.map((sancion) => (
              <div key={sancion.id} className="border-b pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
                      sancion.tipo_sancion === 'amonestacion' ? 'bg-yellow-100 text-yellow-800' :
                      sancion.tipo_sancion === 'suspension_temporal' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {sancion.tipo_sancion.replace('_', ' ').charAt(0).toUpperCase() + 
                       sancion.tipo_sancion.slice(1).replace('_', ' ')}
                    </span>
                    {sancion.duracion_dias && (
                      <span className="ml-2 text-sm text-gray-600">
                        ({sancion.duracion_dias} días)
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(sancion.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 text-gray-700">{sancion.motivo}</p>
                <p className="mt-1 text-sm text-gray-500">
                  Aplicada por: {sancion.admin.username}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No hay sanciones registradas</p>
        )}
      </div>
    </div>
  );

  // Añadir esta función helper
  const getProfileImageUrl = (fotoPerfilPath: string | null) => {
    if (!fotoPerfilPath) {
      return null;
    }
    return `${supabaseUrl}/storage/v1/object/public/fotoperfil/${fotoPerfilPath}`;
  };

  return (
    <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-4xl font-bold text-primary-700 mb-2 sm:mb-0">
          Reportes de Perfiles
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
                        className="mt-4 sm:mt-0 px-4 py-2 bg-secondary-500 text-white rounded-md hover:bg-secondary-600 transition-colors"
                      >
                        Ver gestión de usuario
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Modal para detalles del perfil */}
          {expandedReporte && profileDetails && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto">
              <div className="bg-white rounded-lg p-6 m-4 max-w-4xl w-full max-h-[80vh] flex flex-col">
                {/* Header del modal con título y estado */}
                <div className="flex justify-between items-center mb-4 pb-4 border-b">
                  <div>
                    <h3 className="text-2xl font-bold text-primary-700">Detalles del Perfil Reportado</h3>
                    <div className="mt-2">
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getReportStatusColor(reportes.find(r => r.id === expandedReporte)?.estado || 'abierto')}`}>
                        {(reportes.find(r => r.id === expandedReporte)?.estado || 'abierto').charAt(0).toUpperCase() + 
                         (reportes.find(r => r.id === expandedReporte)?.estado || 'abierto').slice(1)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedReporte(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Contenido del modal en grid de 2 columnas */}
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Columna izquierda: Foto e info básica */}
                    <div className="space-y-4">
                      {profileDetails.foto_perfil && (
                        <div>
                          <Image
                            src={getProfileImageUrl(profileDetails.foto_perfil) || ''}
                            alt="Foto de perfil"
                            width={200}
                            height={200}
                            className="rounded-lg"
                          />
                        </div>
                      )}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-lg mb-2">Información básica</h4>
                        <div className="space-y-2">
                          <p><strong>Username:</strong> {profileDetails.username}</p>
                          <p><strong>Edad:</strong> {profileDetails.edad}</p>
                          <p><strong>Sexo:</strong> {profileDetails.sexo}</p>
                          <p><strong>Ubicación:</strong> {profileDetails.ubicacion}</p>
                          <p><strong>Nacionalidad:</strong> {profileDetails.nacionalidad}</p>
                        </div>
                      </div>
                    </div>

                    {/* Columna derecha: Biografía, géneros y habilidades */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-lg mb-2">Biografía</h4>
                        <p className="text-gray-700">{profileDetails.biografia}</p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-lg mb-2">Géneros musicales</h4>
                        <div className="flex flex-wrap gap-2">
                          {profileDetails.perfil_genero.map((g, i) => (
                            <span key={i} className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                              {g.genero}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-lg mb-2">Habilidades</h4>
                        <div className="flex flex-wrap gap-2">
                          {profileDetails.perfil_habilidad.map((h, i) => (
                            <span key={i} className="bg-secondary-100 text-secondary-800 px-3 py-1 rounded-full text-sm">
                              {h.habilidad}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-lg mb-2">Redes sociales</h4>
                        <ul className="space-y-2">
                          {profileDetails.red_social.map((red, i) => (
                            <li key={i}>
                              <span className="font-medium">{red.nombre}:</span>{' '}
                              <a href={red.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                                {red.url}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer con acciones */}
                <div className="mt-6 pt-4 border-t flex justify-end space-x-4">
                  <button
                    onClick={() => handleReporteAction(expandedReporte, 'open')}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                  >
                    Marcar como abierto
                  </button>
                  <button
                    onClick={() => handleReporteAction(expandedReporte, 'resolve')}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                  >
                    Resolver
                  </button>
                  <button
                    onClick={() => handleReporteAction(expandedReporte, 'dismiss')}
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
      {showResolutionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <ResolutionModal />
          </div>
        </div>
      )}

      {showSancionesModal && <SancionesHistorialModal />}
    </div>
  );
}
