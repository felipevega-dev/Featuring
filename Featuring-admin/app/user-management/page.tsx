'use client'

import { useState, useEffect, Fragment } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '../../lib/supabase'
import { User, Session } from '@supabase/supabase-js'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { FiAlertCircle, FiActivity } from 'react-icons/fi'

interface Perfil {
  usuario_id: string;
  username: string | null;
  foto_perfil: string | null;
  ubicacion: string | null;
  nacionalidad: string | null;
  sexo: string | null;
  edad: number | null;
  biografia: string | null;
  perfil_genero: { genero: string }[];
  perfil_habilidad: { habilidad: string }[];
  red_social: { nombre: string; url: string }[];
  numtelefono: string | null;
}

interface UserWithProfile extends User {
  perfil: (Perfil & {
    full_name: string;
    generos: string[];
    habilidades: string[];
  }) | null;
}

interface SancionForm {
  tipo: 'amonestacion' | 'suspension_temporal' | 'suspension_permanente';
  motivo: string;
  duracion?: number;
}

interface Sancion {
  id: number;
  tipo_sancion: 'amonestacion' | 'suspension_temporal' | 'suspension_permanente';
  motivo: string;
  duracion_dias?: number;
  fecha_inicio: string;
  fecha_fin?: string;
  estado: 'activa' | 'cumplida' | 'revocada';
  admin: {
    email: string;
  };
}

interface UserWithSanciones extends UserWithProfile {
  sanciones?: Sancion[];
  sancionActiva: boolean;
  suspensionActiva: boolean;
  amonestacionesActivas: number;
}

const isValidHttpUrl = (string: string) => {
  let url;
  try {
    url = new URL(string);
  } catch (_) {
    return false;  
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

const getValidImageUrl = (url: string | null) => {
  if (!url) return null;
  if (isValidHttpUrl(url)) return url;
  // Si no es una URL válida, podríamos devolver una imagen por defecto o null
  return null;
}

const USERS_PER_PAGE = 20

// Añadir función de confirmación
const confirmAction = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.confirm(message)) {
      resolve(true)
    } else {
      resolve(false)
    }
  })
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithSanciones[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [showSancionModal, setShowSancionModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [sancionForm, setSancionForm] = useState<SancionForm>({
    tipo: 'amonestacion',
    motivo: '',
    duracion: undefined
  })
  const [session, setSession] = useState<Session | null>(null)
  const [userSanciones, setUserSanciones] = useState<Sancion[]>([])
  const supabase = createClientComponentClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'suspended' | 'warned'>('all')
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [userActivity, setUserActivity] = useState<any>(null)

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

  useEffect(() => {
    fetchUsers()
  }, [currentPage])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm, filter, currentPage])

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    try {
      let query = supabaseAdmin.from('perfil').select('*', { count: 'exact' })

      // Aplicar búsqueda si existe
      if (searchTerm) {
        query = query.or(`username.ilike.%${searchTerm}%,usuario_id.in.(${
          supabaseAdmin.auth.admin.listUsers().then(({ data }) => 
            data?.users.filter(u => 
              u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              u.user_metadata?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
            ).map(u => u.id).join(',')
          )
        })`)
      }

      const { count } = await query

      setTotalUsers(count || 0)

      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page: currentPage,
        perPage: USERS_PER_PAGE,
      })
      if (authError) throw authError

      const { data: perfiles, error: perfilError } = await supabaseAdmin
        .from("perfil")
        .select(`
          *,
          perfil_genero (genero),
          perfil_habilidad (habilidad),
          red_social (nombre, url)
        `)
        .range((currentPage - 1) * USERS_PER_PAGE, currentPage * USERS_PER_PAGE - 1)

      if (perfilError) throw perfilError

      const usersWithProfiles: UserWithSanciones[] = await Promise.all(
        authUsers.users.map(async (authUser) => {
          const perfil = perfiles.find(p => p.usuario_id === authUser.id)
          
          const { data: sanciones } = await supabaseAdmin
            .from('sancion_administrativa')
            .select('*')
            .eq('usuario_id', authUser.id)
            .eq('estado', 'activa')
          
          const amonestacionesActivas = sanciones?.filter(
            s => s.tipo_sancion === 'amonestacion'
          ).length || 0

          const suspensionActiva = sanciones?.some(
            s => ['suspension_temporal', 'suspension_permanente'].includes(s.tipo_sancion)
          ) || false

          const user = {
            ...authUser,
            perfil: perfil ? {
              ...perfil,
              full_name: authUser.user_metadata?.full_name || "",
              generos: perfil.perfil_genero.map((g: { genero: string }) => g.genero),
              habilidades: perfil.perfil_habilidad.map((h: { habilidad: string }) => h.habilidad),
            } : null,
            sancionActiva: (sanciones && sanciones.length > 0) || false,
            suspensionActiva,
            amonestacionesActivas
          }

          // Aplicar filtros
          if (filter === 'suspended' && !suspensionActiva) return null
          if (filter === 'warned' && !amonestacionesActivas) return null

          return user
        })
      )

      setUsers(usersWithProfiles.filter(Boolean) as UserWithSanciones[])
    } catch (error) {
      console.error('Error al obtener los usuarios:', error)
      setError('No se pudieron cargar los usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleExpandUser = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId)
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  const handleSancion = async (userId: string) => {
    setSelectedUser(userId)
    const sanciones = await fetchUserSanciones(userId)
    setUserSanciones(sanciones)
    setShowSancionModal(true)
  }

  const handleSubmitSancion = async () => {
    if (!selectedUser || !sancionForm.motivo || !session?.user?.id) return

    // Confirmar antes de aplicar suspensión permanente
    if (sancionForm.tipo === 'suspension_permanente') {
      const confirmed = await confirmAction('¿Está seguro que desea aplicar una suspensión permanente? Esta es una acción grave.')
      if (!confirmed) return
    }

    try {
      // Primero verificamos si es una amonestación
      if (sancionForm.tipo === 'amonestacion') {
        // Obtener el número de amonestaciones activas del usuario
        const { data: sanciones } = await supabaseAdmin
          .from('sancion_administrativa')
          .select('*')
          .eq('usuario_id', selectedUser)
          .eq('tipo_sancion', 'amonestacion')
          .eq('estado', 'activa')

        const amonestacionesActivas = sanciones?.length || 0

        // Si tiene 2 o más amonestaciones activas, aplicamos suspensión permanente
        if (amonestacionesActivas >= 2) {
          const { error } = await supabaseAdmin
            .from('sancion_administrativa')
            .insert({
              usuario_id: selectedUser,
              admin_id: session.user.id,
              tipo_sancion: 'suspension_permanente',
              motivo: `Suspensión permanente por acumular 3 amonestaciones. Motivo de última amonestación: ${sancionForm.motivo}`,
              estado: 'activa'
            })

          if (error) throw error

          // Marcar las amonestaciones previas como cumplidas
          await supabaseAdmin
            .from('sancion_administrativa')
            .update({ estado: 'cumplida' })
            .eq('usuario_id', selectedUser)
            .eq('tipo_sancion', 'amonestacion')
            .eq('estado', 'activa')

        } else {
          // Si no ha acumulado suficientes amonestaciones, registramos la nueva
          const { error } = await supabaseAdmin
            .from('sancion_administrativa')
            .insert({
              usuario_id: selectedUser,
              admin_id: session.user.id,
              tipo_sancion: sancionForm.tipo,
              motivo: sancionForm.motivo,
              estado: 'activa'
            })

          if (error) throw error
        }
      } else {
        // Si es una suspensión directa
        const { error } = await supabaseAdmin
          .from('sancion_administrativa')
          .insert({
            usuario_id: selectedUser,
            admin_id: session.user.id,
            tipo_sancion: sancionForm.tipo,
            motivo: sancionForm.motivo,
            duracion_dias: sancionForm.duracion,
            fecha_fin: sancionForm.duracion 
              ? new Date(Date.now() + sancionForm.duracion * 24 * 60 * 60 * 1000).toISOString()
              : null,
            estado: 'activa'
          })

        if (error) throw error
      }

      // Cerrar modal y resetear form
      setShowSancionModal(false)
      setSelectedUser(null)
      setSancionForm({
        tipo: 'amonestacion',
        motivo: '',
        duracion: undefined
      })

      // Refrescar lista de usuarios
      fetchUsers()

    } catch (error) {
      console.error('Error al aplicar sanción:', error)
      setError('No se pudo aplicar la sanción. Por favor, intente de nuevo.')
    }
  }

  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE)

  const getExpandedUserDetails = () => {
    if (!expandedUser) return null;
    return users.find(user => user.id === expandedUser);
  }

  // Función para manejar la vista de actividad
  const handleViewActivity = async (userId: string) => {
    setSelectedUser(userId)
    const activity = await fetchUserActivity(userId)
    setUserActivity(activity)
    setShowActivityModal(true)
  }

  // Función para obtener la actividad del usuario
  const fetchUserActivity = async (userId: string) => {
    try {
      const [
        { data: canciones },
        { data: videos },
        { data: colaboraciones },
        { data: reportesRecibidos }
      ] = await Promise.all([
        // Canciones subidas
        supabaseAdmin
          .from('cancion')
          .select('*')
          .eq('usuario_id', userId)
          .order('created_at', { ascending: false }),
        // Videos subidos
        supabaseAdmin
          .from('video')
          .select('*')
          .eq('usuario_id', userId)
          .order('created_at', { ascending: false }),
        // Colaboraciones
        supabaseAdmin
          .from('colaboracion')
          .select('*, cancion:cancion_id(*)')
          .or(`usuario_id.eq.${userId},usuario_id2.eq.${userId}`)
          .order('created_at', { ascending: false }),
        // Reportes recibidos
        supabaseAdmin
          .from('reporte')
          .select('*')
          .eq('usuario_reportado_id', userId)
          .order('created_at', { ascending: false })
      ])

      return {
        canciones: canciones || [],
        videos: videos || [],
        colaboraciones: colaboraciones || [],
        reportesRecibidos: reportesRecibidos || []
      }
    } catch (error) {
      console.error('Error fetching user activity:', error)
      return null
    }
  }

  // Modal de actividad
  const renderActivityModal = () => {
    const selectedUserDetails = users.find(user => user.id === selectedUser)

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative mx-auto p-3 xs:p-4 sm:p-5 border w-[95%] xs:w-[90%] sm:w-[85%] md:w-[800px] shadow-lg rounded-md bg-white mt-2 xs:mt-4 sm:mt-6">
          <button
            onClick={() => setShowActivityModal(false)}
            className="absolute top-2 right-2 xs:top-4 xs:right-4 text-gray-400 hover:text-gray-500"
          >
            <svg className="h-5 w-5 xs:h-6 xs:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="max-h-[80vh] overflow-y-auto px-2 xs:px-4">
            <h3 className="text-base xs:text-lg font-medium leading-6 text-gray-900 mb-2 xs:mb-4">
              Actividad del Usuario
            </h3>
            <p className="text-xs xs:text-sm text-gray-500 mb-4">
              {selectedUserDetails?.perfil?.full_name || selectedUserDetails?.email}
            </p>

            <div className="space-y-4 xs:space-y-6">
              {/* Contenido */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Contenido Subido</h4>
                <div className="space-y-2">
                  <p>Canciones: {userActivity?.canciones.length}</p>
                  <p>Videos: {userActivity?.videos.length}</p>
                </div>
              </div>

              {/* Colaboraciones */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Colaboraciones</h4>
                <p>Total: {userActivity?.colaboraciones.length}</p>
              </div>

              {/* Reportes */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Reportes Recibidos</h4>
                <p>Total: {userActivity?.reportesRecibidos.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const fetchUserSanciones = async (userId: string) => {
    try {
      // Primero obtenemos las sanciones con el id del admin
      const { data: sanciones, error } = await supabaseAdmin
        .from('sancion_administrativa')
        .select(`
          id,
          tipo_sancion,
          motivo,
          duracion_dias,
          fecha_inicio,
          fecha_fin,
          estado,
          admin_id
        `)
        .eq('usuario_id', userId)
        .order('fecha_inicio', { ascending: false })

      if (error) throw error

      // Si tenemos sanciones, obtenemos los datos de los admins
      if (sanciones && sanciones.length > 0) {
        // Obtener los datos de los admins usando auth.admin.listUsers
        const adminIds = [...new Set(sanciones.map(s => s.admin_id))]
        const adminUsers = await Promise.all(
          adminIds.map(async (adminId) => {
            const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(adminId)
            return error ? null : user
          })
        )

        // Crear un mapa de adminId -> email para fácil acceso
        const adminMap = adminUsers.reduce((map, admin) => {
          if (admin) {
            map[admin.id] = admin.email
          }
          return map
        }, {} as Record<string, string>)

        // Combinar los datos
        const sancionesConAdmin = sanciones.map(sancion => ({
          ...sancion,
          admin: {
            email: adminMap[sancion.admin_id] || 'Admin desconocido'
          }
        }))

        return sancionesConAdmin
      }

      return []
    } catch (error) {
      console.error('Error al obtener sanciones:', error)
      return []
    }
  }

  const handleRevocarSancion = async (sancionId: number) => {
    const confirmed = await confirmAction('¿Está seguro que desea revocar esta sanción?')
    if (!confirmed) return

    try {
      const { error } = await supabaseAdmin
        .from('sancion_administrativa')
        .update({ estado: 'revocada' })
        .eq('id', sancionId)

      if (error) throw error

      // Actualizar la lista de sanciones
      if (selectedUser) {
        const sanciones = await fetchUserSanciones(selectedUser)
        setUserSanciones(sanciones)
      }
    } catch (error) {
      console.error('Error al revocar sanción:', error)
      setError('No se pudo revocar la sanción')
    }
  }

  const handleEliminarSancion = async (sancionId: number) => {
    const confirmed = await confirmAction('¿Está seguro que desea eliminar permanentemente esta sanción? Esta acción no se puede deshacer.')
    if (!confirmed) return

    try {
      const { error } = await supabaseAdmin
        .from('sancion_administrativa')
        .delete()
        .eq('id', sancionId)

      if (error) throw error

      // Actualizar la lista de sanciones
      if (selectedUser) {
        const sanciones = await fetchUserSanciones(selectedUser)
        setUserSanciones(sanciones)
      }
    } catch (error) {
      console.error('Error al eliminar sanción:', error)
      setError('No se pudo eliminar la sanción')
    }
  }

  const renderSancionModal = () => {
    const selectedUserDetails = users.find(user => user.id === selectedUser)

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative mx-auto p-3 xs:p-4 sm:p-5 border w-[95%] xs:w-[90%] sm:w-[85%] md:w-[800px] lg:w-[1000px] shadow-lg rounded-md bg-white mt-2 xs:mt-4 sm:mt-6">
          {/* Botón de cerrar */}
          <button
            onClick={() => {
              setShowSancionModal(false)
              setSelectedUser(null)
              setSancionForm({
                tipo: 'amonestacion',
                motivo: '',
                duracion: undefined
              })
            }}
            className="absolute top-2 right-2 xs:top-4 xs:right-4 text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <svg className="h-5 w-5 xs:h-6 xs:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="mt-2 xs:mt-3">
            <div className="flex flex-col items-start mb-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Aplicar Sanción
              </h3>
              <p className="mt-1 text-sm text-primary-500">
                Usuario: {selectedUserDetails?.perfil?.full_name || selectedUserDetails?.email || 'Usuario desconocido'}
              </p>
            </div>

            {/* Historial de sanciones */}
            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-700 mb-2">Historial de Sanciones</h4>
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                {userSanciones.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userSanciones.map((sancion) => (
                        <tr key={sancion.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {sancion.tipo_sancion.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 ">
                            <span className="text-sm text-gray-500">{sancion.motivo}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              sancion.estado === 'activa' ? 'bg-red-100 text-red-800' :
                              sancion.estado === 'cumplida' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {sancion.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(sancion.fecha_inicio).toLocaleDateString()}
                            {sancion.fecha_fin && (
                              <><br />hasta: {new Date(sancion.fecha_fin).toLocaleDateString()}</>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {sancion.admin?.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {sancion.estado === 'activa' && (
                                <button
                                  onClick={() => handleRevocarSancion(sancion.id)}
                                  className="text-yellow-600 hover:text-yellow-900"
                                >
                                  Revocar
                                </button>
                              )}
                              <button
                                onClick={() => handleEliminarSancion(sancion.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No hay sanciones registradas
                  </div>
                )}
              </div>
            </div>

            {/* Formulario existente */}
            <div className="mt-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tipo de Sanción
                </label>
                <select
                  value={sancionForm.tipo}
                  onChange={(e) => setSancionForm({
                    ...sancionForm,
                    tipo: e.target.value as SancionForm['tipo']
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="amonestacion">Amonestación</option>
                  <option value="suspension_temporal">Suspensión Temporal</option>
                  <option value="suspension_permanente">Suspensión Permanente</option>
                </select>
              </div>

              {sancionForm.tipo === 'suspension_temporal' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Duración (días)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={sancionForm.duracion || ''}
                    onChange={(e) => setSancionForm({
                      ...sancionForm,
                      duracion: parseInt(e.target.value)
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Motivo
                </label>
                <textarea
                  value={sancionForm.motivo}
                  onChange={(e) => setSancionForm({
                    ...sancionForm,
                    motivo: e.target.value
                  })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Describa el motivo de la sanción..."
                />
              </div>
            </div>

            <div className="mt-5 sm:mt-6 space-y-2">
              <button
                type="button"
                onClick={handleSubmitSancion}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
              >
                Aplicar Sanción
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSancionModal(false)
                  setSelectedUser(null)
                  setSancionForm({
                    tipo: 'amonestacion',
                    motivo: '',
                    duracion: undefined
                  })
                }}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderUserItem = (user: UserWithSanciones) => (
    <li key={user.id} className="p-2 xs:p-3 sm:p-4 md:p-6">
      <div className="flex flex-col xs:flex-row xs:items-center justify-between w-full">
        {/* Contenedor de información del usuario */}
        <div className="flex items-center w-full xs:w-auto">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {user.perfil?.foto_perfil && getValidImageUrl(user.perfil.foto_perfil) ? (
              <Image
                src={getValidImageUrl(user.perfil.foto_perfil) as string}
                alt="Foto de perfil"
                width={36}
                height={36}
                className="rounded-full object-cover xs:w-12 xs:h-12"
              />
            ) : (
              <div className="w-9 h-9 xs:w-12 xs:h-12 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-base xs:text-xl text-gray-600">
                  {user.perfil?.full_name?.[0] || user.email?.[0]}
                </span>
              </div>
            )}
          </div>

          {/* Información del usuario */}
          <div className="ml-2 xs:ml-3 flex flex-col justify-center">
            <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
              <div className="text-sm xs:text-base font-medium text-gray-900 truncate max-w-[150px] xs:max-w-none">
                {/* Solo primer nombre en xs, nombre completo en sm+ */}
                <span className="xs:hidden">
                  {user.perfil?.full_name?.split(' ')[0] || 'N/A'}
                </span>
                <span className="hidden xs:inline">
                  {user.perfil?.full_name || 'N/A'}
                </span>
              </div>
              {/* Badges */}
              {user.sancionActiva && (
                <div className="flex items-center">
                  {user.suspensionActiva ? (
                    <>
                      {/* Badge para xs */}
                      <span className="inline-flex xs:hidden items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800">
                        Sus.
                      </span>
                      {/* Badge para sm+ */}
                      <span className="hidden xs:inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                        <FiAlertCircle className="mr-1 w-4 h-4" />
                        Suspendido
                      </span>
                    </>
                  ) : user.amonestacionesActivas > 0 && (
                    <>
                      {/* Badge para xs */}
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800">
                        {user.amonestacionesActivas} Sanciones
                      </span>
                      {/* Badge para sm+ */}
                      <span className="hidden items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        {user.amonestacionesActivas} {user.amonestacionesActivas === 1 ? 'Amonestación' : 'Amonestaciones'}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            {/* Email */}
            <div className="text-xs xs:text-sm text-gray-500 truncate max-w-[200px] xs:max-w-none">
              {user.email || ''}
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className={`
          flex gap-2 mt-2 xs:mt-0 ml-11 xs:ml-4
          flex-col xs:flex-col md:flex-row md:items-center
        `}>
          <button
            onClick={() => handleExpandUser(user.id)}
            className="text-[10px] xs:text-xs sm:text-sm md:text-base
              text-white font-medium
              px-1.5 py-1 xs:px-2
              bg-secondary-500 hover:bg-secondary-600
              md:px-4 md:py-2
              transition-colors duration-200"
          >
            <span className="xs:hidden">Det.</span>
            <span className="hidden xs:inline">Detalles</span>
          </button>
          <button
            onClick={() => handleSancion(user.id)}
            className="text-[10px] xs:text-xs sm:text-sm md:text-base
              text-white font-medium
              flex items-center px-1.5 py-1 xs:px-2
              bg-warning-500 hover:bg-warning-600
              md:px-4 md:py-2
              transition-colors duration-200"
          >
            <FiAlertCircle className="mr-1 w-3 h-3 xs:w-4 xs:h-4" />
            <span className="xs:hidden">San.</span>
            <span className="hidden xs:inline">Sanciones</span>
          </button>
          <button
            onClick={() => handleViewActivity(user.id)}
            className="text-[10px] xs:text-xs sm:text-sm md:text-base
              text-white font-medium
              flex items-center px-1.5 py-1 xs:px-2
              bg-primary-500 hover:bg-primary-600
              md:px-4 md:py-2
              transition-colors duration-200"
          >
            <FiActivity className="mr-1 w-3 h-3 xs:w-4 xs:h-4" />
            <span className="xs:hidden">Act.</span>
            <span className="hidden xs:inline">Actividad</span>
          </button>
        </div>
      </div>
    </li>
  );

  return (
    <div className="container mx-auto px-1 xs:px-2 sm:px-4 md:px-6 lg:px-8 py-2 xs:py-4 sm:py-6">
      {/* Header más compacto en móvil */}
      <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center mb-3 xs:mb-4 sm:mb-6">
        <h1 className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-primary-700 mb-2 xs:mb-0">
          Gestión de Usuarios
        </h1>
        <Link 
          href="/" 
          className="w-full xs:w-auto bg-primary-500 text-white px-2 py-1 xs:px-3 sm:px-4 xs:py-1.5 rounded text-xs xs:text-sm transition-all duration-300 hover:bg-primary-600 text-center"
        >
          Volver al Menú Principal
        </Link>
      </div>

      {/* Búsqueda y Filtros más compactos */}
      <div className="mb-4 xs:mb-6 space-y-2 xs:space-y-0">
        <div className="flex flex-col xs:flex-row gap-2 xs:gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-1.5 xs:py-2 border border-gray-300 rounded-md text-xs xs:text-sm focus:ring-primary-500 focus:border-primary-500"
          />
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'suspended' | 'warned')}
            className="w-full xs:w-auto px-3 py-1.5 xs:py-2 border border-gray-300 rounded-md text-xs xs:text-sm focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">Todos los usuarios</option>
            <option value="suspended">Suspendidos</option>
            <option value="warned">Amonestados</option>
          </select>
        </div>
      </div>

      {/* Lista de usuarios más compacta */}
      {loading && (
        <div className="text-center text-xs xs:text-sm sm:text-base">
          Cargando usuarios...
        </div>
      )}
      
      {error && (
        <div className="text-center text-xs xs:text-sm sm:text-base text-danger-600">
          Error: {error}
        </div>
      )}
      
      {!loading && !error && users.length > 0 && (
        <>
          <div className="bg-white shadow-sm xs:shadow-md rounded-lg overflow-hidden w-[98%] xs:w-[350px] sm:w-[96%] mx-auto">
            <ul className="divide-y divide-gray-100 xs:divide-gray-200">
              {users.map((user) => renderUserItem(user))}
            </ul>
          </div>

          {/* Paginación más compacta */}
          <div className="mt-4 xs:mt-6 flex justify-between items-center bg-white p-2 xs:p-3 rounded-lg shadow-sm xs:shadow-md">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-primary-500 text-white px-2 xs:px-3 py-1 xs:py-1.5 rounded disabled:bg-gray-300 text-xs xs:text-sm font-medium transition-colors duration-200 ease-in-out hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
            >
              Anterior
            </button>
            <span className="text-xs xs:text-sm font-medium text-gray-700">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="bg-primary-500 text-white px-2 xs:px-3 py-1 xs:py-1.5 rounded disabled:bg-gray-300 text-xs xs:text-sm font-medium transition-colors duration-200 ease-in-out hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50"
            >
              Siguiente
            </button>
          </div>
        </>
      )}

      {expandedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="my-modal">
          <div className="relative top-4 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-2">
              <h3 className="text-2xl leading-6 font-bold text-primary-700 text-center mb-6">Detalles del Usuario</h3>
              <div className="mt-2 px-4 py-5 max-h-[70vh] overflow-y-auto">
                {(() => {
                  const user = getExpandedUserDetails();
                  if (!user) return <p className="text-lg">No se encontraron detalles del usuario.</p>;
                  return (
                    <div className="space-y-6 text-base">
                      <div className="flex items-center justify-center mb-6">
                        {user.perfil?.foto_perfil && getValidImageUrl(user.perfil.foto_perfil) ? (
                          <Image
                            src={getValidImageUrl(user.perfil.foto_perfil) as string}
                            alt="Foto de perfil"
                            width={120}
                            height={120}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-4xl text-gray-600">{user.perfil?.full_name?.[0] || user.email?.[0]}</span>
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-lg"><span className="font-semibold">Nombre:</span> {user.perfil?.full_name || 'No especificado'}</p>
                          <p className="text-lg"><span className="font-semibold">Username:</span> {user.perfil?.username || 'No especificado'}</p>
                          <p className="text-lg"><span className="font-semibold">Email:</span> {user.email}</p>
                          <p className="text-lg"><span className="font-semibold">Teléfono:</span> {user.perfil?.numtelefono || 'No especificado'}</p>
                          <p className="text-lg"><span className="font-semibold">Edad:</span> {user.perfil?.edad || 'No especificada'}</p>
                          <p className="text-lg"><span className="font-semibold">Sexo:</span> {user.perfil?.sexo || 'No especificado'}</p>
                        </div>
                        <div>
                          <p className="text-lg"><span className="font-semibold">Ubicación:</span> {user.perfil?.ubicacion || 'No especificada'}</p>
                          <p className="text-lg"><span className="font-semibold">Nacionalidad:</span> {user.perfil?.nacionalidad || 'No especificada'}</p>
                          <div className="mt-4">
                            <p className="text-lg font-semibold">Biografía:</p>
                            <p className="text-base mt-1">{user.perfil?.biografia || 'No especificada'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6">
                        <p className="text-lg font-semibold mb-2">Géneros musicales:</p>
                        <ul className="list-disc list-inside grid grid-cols-2 gap-2">
                          {user.perfil?.generos.map((genero, index) => (
                            <li key={index} className="text-base">{genero}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-6">
                        <p className="text-lg font-semibold mb-2">Habilidades:</p>
                        <ul className="list-disc list-inside grid grid-cols-2 gap-2">
                          {user.perfil?.habilidades.map((habilidad, index) => (
                            <li key={index} className="text-base">{habilidad}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-6">
                        <p className="text-lg font-semibold mb-2">Redes sociales:</p>
                        <ul className="list-disc list-inside">
                          {user.perfil?.red_social.map((red, index) => (
                            <li key={index} className="text-base">{red.nombre}: <a href={red.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{red.url}</a></li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="items-center px-4 py-3 mt-6">
                <button
                  id="ok-btn"
                  className="px-6 py-3 bg-primary-500 text-white text-lg font-medium rounded-md w-full shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-300 transition duration-300"
                  onClick={() => setExpandedUser(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSancionModal && renderSancionModal()}
      {showActivityModal && renderActivityModal()}
    </div>
  )
}
