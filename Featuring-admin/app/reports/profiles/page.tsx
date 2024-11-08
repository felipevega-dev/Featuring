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

      {/* Modal para mostrar detalles del perfil */}
      {expandedReporte && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-2xl leading-6 font-bold text-primary-700 text-center mb-6">
                Detalles del Reporte
              </h3>
              <div className="mt-2 px-4 py-5 max-h-[70vh] overflow-y-auto">
                {/* ... detalles del reporte ... */}
                
                {/* Información del perfil reportado */}
                {profileDetails && (
                  <div className="mt-4">
                    <h4 className="text-lg font-semibold mb-2 text-secondary-600">
                      Información del Perfil Reportado
                    </h4>
                    {/* Mostrar foto de perfil si existe */}
                    {profileDetails.foto_perfil && (
                      <div className="mb-4">
                        <Image
                          src={profileDetails.foto_perfil}
                          alt="Foto de perfil"
                          width={200}
                          height={200}
                          className="rounded-lg"
                        />
                      </div>
                    )}
                    {/* Información básica */}
                    <div className="grid grid-cols-2 gap-4">
                      <p><strong>Username:</strong> {profileDetails.username}</p>
                      <p><strong>Edad:</strong> {profileDetails.edad}</p>
                      <p><strong>Sexo:</strong> {profileDetails.sexo}</p>
                      <p><strong>Ubicación:</strong> {profileDetails.ubicacion}</p>
                      <p><strong>Nacionalidad:</strong> {profileDetails.nacionalidad}</p>
                    </div>
                    {/* Biografía */}
                    <div className="mt-4">
                      <p><strong>Biografía:</strong></p>
                      <p className="text-gray-600">{profileDetails.biografia}</p>
                    </div>
                    {/* Géneros musicales */}
                    <div className="mt-4">
                      <p><strong>Géneros musicales:</strong></p>
                      <div className="flex flex-wrap gap-2">
                        {profileDetails.perfil_genero.map((g, i) => (
                          <span key={i} className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-sm">
                            {g.genero}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Habilidades */}
                    <div className="mt-4">
                      <p><strong>Habilidades:</strong></p>
                      <div className="flex flex-wrap gap-2">
                        {profileDetails.perfil_habilidad.map((h, i) => (
                          <span key={i} className="bg-secondary-100 text-secondary-800 px-2 py-1 rounded-full text-sm">
                            {h.habilidad}
                          </span>
                        ))}
                      </div>
                    </div>
                    {/* Redes sociales */}
                    <div className="mt-4">
                      <p><strong>Redes sociales:</strong></p>
                      <ul className="list-disc list-inside">
                        {profileDetails.red_social.map((red, i) => (
                          <li key={i}>
                            {red.nombre}: <a href={red.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                              {red.url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              {/* ... botones de acción ... */}
            </div>
          </div>
        </div>
      )}

      {/* Modal de resolución */}
      {showResolutionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            {/* ... contenido del modal de resolución ... */}
            <div className="flex items-center mt-4">
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
            {/* ... resto del modal ... */}
          </div>
        </div>
      )}
    </div>
  );
}
