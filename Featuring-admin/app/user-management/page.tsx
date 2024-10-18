'use client'

import { useState, useEffect, Fragment } from 'react'
import { supabaseAdmin } from '../../lib/supabase'
import { User } from '@supabase/supabase-js'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

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

export default function UserManagement() {
  const [users, setUsers] = useState<UserWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [currentPage])

  async function fetchUsers() {
    setLoading(true)
    setError(null)
    try {
      const { count } = await supabaseAdmin
        .from('perfil')
        .select('*', { count: 'exact', head: true })

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

      const usersWithProfiles: UserWithProfile[] = authUsers.users.map(authUser => {
        const perfil = perfiles.find(p => p.usuario_id === authUser.id)
        return {
          ...authUser,
          perfil: perfil ? {
            ...perfil,
            full_name: authUser.user_metadata?.full_name || "",
            generos: perfil.perfil_genero.map((g: { genero: string }) => g.genero),
            habilidades: perfil.perfil_habilidad.map((h: { habilidad: string }) => h.habilidad),
          } : null
        }
      })

      setUsers(usersWithProfiles)
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

  const handleUserAction = async (userId: string, action: 'suspend' | 'delete') => {
    try {
      if (action === 'suspend') {
        await supabaseAdmin.from('perfil').update({ suspended: true }).eq('usuario_id', userId)
      } else if (action === 'delete') {
        await supabaseAdmin.auth.admin.deleteUser(userId)
      }
      // Refresh the user list after action
      fetchUsers()
    } catch (error) {
      console.error(`Error ${action}ing user:`, error)
      setError(`No se pudo ${action === 'suspend' ? 'suspender' : 'eliminar'} al usuario. Por favor, intente de nuevo.`)
    }
  }

  const totalPages = Math.ceil(totalUsers / USERS_PER_PAGE)

  const getExpandedUserDetails = () => {
    if (!expandedUser) return null;
    return users.find(user => user.id === expandedUser);
  }

  return (
    <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-8">
        <h1 className="text-xl sm:text-4xl font-bold text-primary-700 mb-2 sm:mb-0">Gestión de Usuarios</h1>
        <Link href="/" className="bg-primary-500 text-white px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base">
          Volver al Menú Principal
        </Link>
      </div>

      {loading && <div className="text-center text-lg sm:text-xl">Cargando usuarios...</div>}
      {error && <div className="text-center text-lg sm:text-xl text-danger-600">Error: {error}</div>}
      
      {!loading && !error && users.length > 0 && (
        <>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {users.map((user) => (
                <li key={user.id} className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                    <div className="flex items-center mb-2 sm:mb-0">
                      {user.perfil?.foto_perfil && getValidImageUrl(user.perfil.foto_perfil) ? (
                        <Image
                          src={getValidImageUrl(user.perfil.foto_perfil) as string}
                          alt="Foto de perfil"
                          width={48}
                          height={48}
                          className="rounded-full object-cover mr-4"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-300 rounded-full mr-4 flex items-center justify-center">
                          <span className="text-xl text-gray-600">{user.perfil?.full_name?.[0] || user.email?.[0]}</span>
                        </div>
                      )}
                      <div>
                        <div className="text-base sm:text-lg font-medium text-gray-900">{user.perfil?.full_name || 'N/A'}</div>
                        <div className="text-sm sm:text-base text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-3 mt-2 sm:mt-0">
                      <button
                        onClick={() => handleExpandUser(user.id)}
                        className="text-primary-600 hover:text-primary-900 text-base sm:text-lg font-medium"
                      >
                        Ver detalles
                      </button>
                      <Menu as="div" className="relative inline-block text-left">
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
                                    onClick={() => handleUserAction(user.id, 'suspend')}
                                    className={`${
                                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                    } block w-full text-left px-4 py-2 text-sm sm:text-base`}
                                  >
                                    Suspender
                                  </button>
                                )}
                              </Menu.Item>
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    onClick={() => handleUserAction(user.id, 'delete')}
                                    className={`${
                                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                    } block w-full text-left px-4 py-2 text-sm sm:text-base`}
                                  >
                                    Eliminar
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

      {expandedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="my-modal">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
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
    </div>
  )
}
