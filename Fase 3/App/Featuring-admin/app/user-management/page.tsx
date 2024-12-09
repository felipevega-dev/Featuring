'use client'

import { useState, useEffect, Fragment } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { supabaseAdmin } from '../../lib/supabase'
import { User, Session } from '@supabase/supabase-js'
import Image from 'next/image'
import Link from 'next/link'
import { FiAlertCircle, FiActivity, FiUsers, FiFrown, FiCheckCircle } from 'react-icons/fi'
import { notificationService } from '../../services/notificationService'

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
    numtelefono: string | null;
    sexo: string | null;
    promedio_valoraciones: number;
    puntos_reputacion: number;
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
  
  // Si ya es una URL completa, la retornamos
  if (isValidHttpUrl(url)) return url;
  
  // Si es una ruta de storage, construimos la URL completa
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/fotoperfil/${url}`;
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
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    warnedUsers: 0,
    suspendedUsers: 0
  });

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

  useEffect(() => {
    // Obtener el parámetro de búsqueda de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, []);

  useEffect(() => {
    // Verificar sanciones cada 5 minutos
    const interval = setInterval(() => {
      fetchUsers();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchUserStats();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      // 1. Primero obtenemos todos los perfiles existentes
      const { data: perfiles, error: perfilError, count } = await supabaseAdmin
        .from('perfil')
        .select(`
          *,
          perfil_genero (genero),
          perfil_habilidad (habilidad),
          red_social (nombre, url)
        `)
        .order('created_at', { ascending: false });

      if (perfilError) throw perfilError;

      if (!perfiles) {
        setUsers([]);
        return;
      }

      // 2. Obtenemos los IDs de usuarios que tienen perfil
      const userIds = perfiles.map(perfil => perfil.usuario_id);

      // 3. Obtenemos los datos de auth.users solo para los usuarios con perfil
      const usersWithProfiles = await Promise.all(
        userIds.map(async (userId) => {
          try {
            const { data: { user }, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
            if (authError || !user) return null;

            const perfil = perfiles.find(p => p.usuario_id === userId);
            
            // Aplicar filtro de búsqueda si existe
            if (searchTerm && !perfil?.username?.toLowerCase().includes(searchTerm.toLowerCase())) {
              return null;
            }

            // 4. Obtener sanciones activas para el usuario
            const { data: userSanciones } = await supabaseAdmin
              .from('sancion_administrativa')
              .select('*')
              .eq('usuario_id', userId)
              .eq('estado', 'activa');

            const amonestacionesActivas = userSanciones?.filter(
              s => s.tipo_sancion === 'amonestacion'
            ).length || 0;

            const suspensionActiva = userSanciones?.some(
              s => ['suspension_temporal', 'suspension_permanente'].includes(s.tipo_sancion)
            ) || false;

            // 5. Construir objeto de usuario completo
            return {
              ...user,
              perfil: perfil ? {
                ...perfil,
                full_name: perfil.username || "",
                generos: perfil.perfil_genero.map((g: { genero: string }) => g.genero),
                habilidades: perfil.perfil_habilidad.map((h: { habilidad: string }) => h.habilidad),
              } : null,
              sancionActiva: (userSanciones?.length || 0) > 0,
              suspensionActiva,
              amonestacionesActivas
            };
          } catch (error) {
            console.error('Error fetching user:', error);
            return null;
          }
        })
      );

      // 6. Filtrar usuarios nulos y aplicar filtros adicionales
      let filteredUsers = usersWithProfiles.filter((user): user is UserWithSanciones => 
        user !== null && user.perfil !== null
      );

      // Aplicar filtros de estado
      if (filter === 'suspended') {
        filteredUsers = filteredUsers.filter(user => user.suspensionActiva);
      } else if (filter === 'warned') {
        filteredUsers = filteredUsers.filter(user => user.amonestacionesActivas > 0);
      }

      setUsers(filteredUsers);
      setTotalUsers(filteredUsers.length);

    } catch (error) {
      console.error('Error al obtener los usuarios:', error);
      setError('No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
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
    if (!selectedUser || !sancionForm.motivo || !session?.user?.id) {
      setError('No se puede aplicar la sanción. Asegúrese de estar autenticado y proporcionar un motivo.');
      return;
    }

    try {
      const now = new Date();
      let fecha_fin = null;

      // Calcular fecha_fin para suspensiones temporales
      if (sancionForm.tipo === 'suspension_temporal' && sancionForm.duracion) {
        fecha_fin = new Date(now);
        fecha_fin.setDate(fecha_fin.getDate() + sancionForm.duracion);
      }

      // 1. Aplicar la sanción
      await supabaseAdmin
        .from('sancion_administrativa')
        .insert({
          usuario_id: selectedUser,
          admin_id: session.user.id,
          tipo_sancion: sancionForm.tipo,
          motivo: sancionForm.motivo,
          duracion_dias: sancionForm.duracion,
          fecha_inicio: now.toISOString(),
          fecha_fin: fecha_fin?.toISOString(),
          estado: 'activa'
        });

      // 2. Crear notificación
      await notificationService.createSanctionNotification({
        userId: selectedUser,
        sanctionType: sancionForm.tipo,
        adminId: session.user.id,
        motivo: sancionForm.motivo
      });

      // 3. Cerrar modal y resetear form
      setShowSancionModal(false);
      setSelectedUser(null);
      setSancionForm({
        tipo: 'amonestacion',
        motivo: '',
        duracion: undefined
      });

      // 4. Refrescar lista de usuarios
      fetchUsers();

    } catch (error) {
      console.error('Error al aplicar sanción:', error);
      setError('No se pudo aplicar la sanción. Por favor, intente de nuevo.');
    }
  };

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
        const adminIds = Array.from(new Set(sanciones.map(s => s.admin_id)));
        const adminUsers = await Promise.all(
          adminIds.map(async (adminId) => {
            const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(adminId)
            return error ? null : user
          })
        )

        // Crear un mapa de adminId -> email para fácil acceso
        const adminMap = adminUsers.reduce((map, admin) => {
          if (admin?.email) {
            map[admin.id] = admin.email;
          }
          return map;
        }, {} as Record<string, string>);

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
    const confirmed = await confirmAction('Está seguro que desea revocar esta sanción?')
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
                  {user.perfil?.username?.[0] || user.email?.[0]}
                </span>
              </div>
            )}
          </div>

          {/* Información del usuario */}
          <div className="ml-2 xs:ml-3 flex flex-col justify-center">
            <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2">
              <div className="text-sm xs:text-base font-medium text-gray-900 truncate max-w-[150px] xs:max-w-none">
                {user.perfil?.username || 'N/A'}
              </div>
              {/* Badges */}
              {user.sancionActiva && (
                <div className="flex items-center">
                  {user.suspensionActiva ? (
                    <>
                      <span className="inline-flex xs:hidden items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800">
                        Sus.
                      </span>
                      <span className="hidden xs:inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                        <FiAlertCircle className="mr-1 w-4 h-4" />
                        Suspendido
                      </span>
                    </>
                  ) : user.amonestacionesActivas > 0 && (
                    <>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800">
                        {user.amonestacionesActivas} Sanciones
                      </span>
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

  const fetchUserStats = async () => {
    try {
      // Total de usuarios con perfil
      const { count: totalCount } = await supabase
        .from('perfil')
        .select('*', { count: 'exact', head: true });

      // Usuarios únicos con amonestaciones activas
      const { data: warnedUsersData } = await supabase
        .from('sancion_administrativa')
        .select(`
          usuario_id,
          tipo_sancion,
          estado
        `)
        .eq('tipo_sancion', 'amonestacion')
        .eq('estado', 'activa');

      // Contar usuarios únicos con amonestaciones
      const uniqueWarnedUsers = new Set(
        warnedUsersData?.map(sancion => sancion.usuario_id) || []
      );

      // Usuarios suspendidos
      const { data: suspendedUsersData } = await supabase
        .from('sancion_administrativa')
        .select(`
          usuario_id,
          tipo_sancion,
          estado
        `)
        .in('tipo_sancion', ['suspension_temporal', 'suspension_permanente'])
        .eq('estado', 'activa');

      const uniqueSuspendedUsers = new Set(
        suspendedUsersData?.map(sancion => sancion.usuario_id) || []
      );

      setUserStats({
        totalUsers: totalCount || 0,
        warnedUsers: uniqueWarnedUsers.size,
        suspendedUsers: uniqueSuspendedUsers.size
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
    }
  };

  // Agregar el renderizado del modal de detalles
  const renderDetailsModal = () => {
    const user = users.find(u => u.id === expandedUser);
    if (!user) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Detalles del Usuario
              </h3>
              <button
                onClick={() => setExpandedUser(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Cerrar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p><span className="font-medium">Nombre completo:</span> {user.user_metadata?.full_name || 'N/A'}</p>
                <p><span className="font-medium">Username:</span> {user.perfil?.username || 'N/A'}</p>
                <p><span className="font-medium">Email:</span> {user.email || 'N/A'}</p>
                <p><span className="font-medium">Teléfono:</span> {user.perfil?.numtelefono || 'N/A'}</p>
                <p><span className="font-medium">Sexo:</span> {user.perfil?.sexo || 'N/A'}</p>
                <p><span className="font-medium">Ubicación:</span> {user.perfil?.ubicacion || 'N/A'}</p>
                <p><span className="font-medium">Nacionalidad:</span> {user.perfil?.nacionalidad || 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <p><span className="font-medium">Edad:</span> {user.perfil?.edad || 'N/A'}</p>
                <p><span className="font-medium">Promedio valoraciones:</span> {user.perfil?.promedio_valoraciones?.toFixed(1) || 'N/A'}</p>
                <p><span className="font-medium">Puntos reputación:</span> {user.perfil?.puntos_reputacion || 'N/A'}</p>
                <p><span className="font-medium">Géneros:</span> {user.perfil?.generos?.join(', ') || 'N/A'}</p>
                <p><span className="font-medium">Habilidades:</span> {user.perfil?.habilidades?.join(', ') || 'N/A'}</p>
              </div>
            </div>

            <div className="mt-5">
              <button
                onClick={() => setExpandedUser(null)}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header con botón de volver */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary-700">Gestión de Usuarios</h1>
        <Link 
          href="/" 
          className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 transition duration-300"
        >
          Volver al Menú Principal
        </Link>
      </div>

      {/* Estadísticas de Usuarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <FiUsers className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
              <p className="text-2xl font-semibold text-gray-900">{userStats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <FiAlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Amonestados</p>
              <p className="text-2xl font-semibold text-gray-900">{userStats.warnedUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 bg-red-50 rounded-lg">
              <FiFrown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Suspendidos</p>
              <p className="text-2xl font-semibold text-gray-900">{userStats.suspendedUsers}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Buscar usuario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as 'all' | 'suspended' | 'warned');
            setCurrentPage(1); // Resetear a la primera página al cambiar el filtro
          }}
          className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="all">Todos los usuarios</option>
          <option value="suspended">Usuarios suspendidos</option>
          <option value="warned">Usuarios amonestados</option>
        </select>
      </div>

      {/* Lista de usuarios */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-8">{error}</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {users.map((user) => renderUserItem(user))}
          </ul>
        </div>
      )}

      {/* Paginación */}
      {!loading && !error && (
        <div className="mt-6 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md bg-primary-100 text-primary-700 disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="px-3 py-1">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md bg-primary-100 text-primary-700 disabled:opacity-50"
            >
              Siguiente
            </button>
          </nav>
        </div>
      )}

      {/* Modales */}
      {showSancionModal && renderSancionModal()}
      {showActivityModal && renderActivityModal()}
      {expandedUser && renderDetailsModal()}
    </div>
  )
}
