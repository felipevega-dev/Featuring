'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { FiTrash2, FiCheck, FiUser } from 'react-icons/fi'
import { Session } from '@supabase/supabase-js'

interface VideoItem {
  name: string;
  id: string;
  created_at: string;
  publicUrl: string;
  userId: string;
}

interface SancionForm {
  tipo: 'amonestacion' | 'suspension_temporal' | 'suspension_permanente';
  motivo: string;
  duracion?: number;
  eliminarContenido: boolean;
}

export default function ChatVideosModeration() {
  const [pendingVideos, setPendingVideos] = useState<VideoItem[]>([])
  const [approvedVideos, setApprovedVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSancionModal, setShowSancionModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [sancionForm, setSancionForm] = useState<SancionForm>({
    tipo: 'amonestacion',
    motivo: '',
    duracion: undefined,
    eliminarContenido: true
  })
  const supabase = createClientComponentClient()
  const supabaseAdmin = createClientComponentClient()

  // Cargar videos aprobados del localStorage al iniciar
  useEffect(() => {
    const savedApprovedVideos = localStorage.getItem('approvedVideos')
    if (savedApprovedVideos) {
      setApprovedVideos(JSON.parse(savedApprovedVideos))
    }
  }, [])

  useEffect(() => {
    fetchVideos()
  }, [])

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    fetchSession()
  }, [])

  async function fetchVideos() {
    try {
      setLoading(true)
      
      const { data: folders, error: foldersError } = await supabase
        .storage
        .from('chat_videos')
        .list()

      if (foldersError) throw foldersError

      const allVideos = await Promise.all(
        folders.map(async (folder) => {
          if (!folder.name) return []

          const { data: userVideos, error: videosError } = await supabase
            .storage
            .from('chat_videos')
            .list(folder.name)

          if (videosError) {
            console.error(`Error fetching videos for user ${folder.name}:`, videosError)
            return []
          }

          return userVideos.map(video => {
            const fullPath = `${folder.name}/${video.name}`
            const { data: { publicUrl } } = supabase
              .storage
              .from('chat_videos')
              .getPublicUrl(fullPath)

            return {
              ...video,
              name: fullPath,
              publicUrl,
              userId: folder.name
            }
          })
        })
      )

      const processedVideos = allVideos.flat().filter(video => video.publicUrl)
      
      // Obtener IDs de videos aprobados del localStorage
      const savedApprovedVideos = JSON.parse(localStorage.getItem('approvedVideos') || '[]')
      const approvedIds = new Set(savedApprovedVideos.map((v: VideoItem) => v.id))
      
      // Filtrar videos pendientes excluyendo los aprobados
      setPendingVideos(processedVideos.filter(video => !approvedIds.has(video.id)))
      
      // Mantener solo los videos aprobados que aún existen
      const currentApprovedVideos = savedApprovedVideos.filter((video: VideoItem) => 
        processedVideos.some(v => v.id === video.id)
      )
      setApprovedVideos(currentApprovedVideos)
      localStorage.setItem('approvedVideos', JSON.stringify(currentApprovedVideos))

    } catch (error) {
      console.error('Error fetching videos:', error)
      setError('No se pudieron cargar los videos')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = (video: VideoItem) => {
    setPendingVideos(prev => prev.filter(v => v.id !== video.id))
    const newApprovedVideos = [...approvedVideos, video]
    setApprovedVideos(newApprovedVideos)
    // Guardar en localStorage
    localStorage.setItem('approvedVideos', JSON.stringify(newApprovedVideos))
  }

  const handleRevertApproval = (video: VideoItem) => {
    setApprovedVideos(prev => {
      const newApprovedVideos = prev.filter(v => v.id !== video.id)
      // Actualizar localStorage
      localStorage.setItem('approvedVideos', JSON.stringify(newApprovedVideos))
      return newApprovedVideos
    })
    setPendingVideos(prev => [...prev, video])
  }

  const handleReject = async (video: VideoItem) => {
    setSelectedVideo(video)
    setShowSancionModal(true)
  }

  const handleSubmitSancion = async () => {
    if (!selectedVideo || !sancionForm.motivo || !session?.user?.id) {
      alert('No se puede aplicar la sanción. Asegúrese de estar autenticado y proporcionar un motivo.')
      return
    }

    try {
      // 1. Aplicar la sanción
      const now = new Date()
      let fecha_fin = null

      if (sancionForm.tipo === 'suspension_temporal' && sancionForm.duracion) {
        fecha_fin = new Date(now)
        fecha_fin.setDate(fecha_fin.getDate() + sancionForm.duracion)
      }

      const { error: sancionError } = await supabaseAdmin
        .from('sancion_administrativa')
        .insert({
          usuario_id: selectedVideo.userId,
          admin_id: session.user.id,
          tipo_sancion: sancionForm.tipo,
          motivo: sancionForm.motivo,
          duracion_dias: sancionForm.duracion,
          fecha_inicio: now.toISOString(),
          fecha_fin: fecha_fin?.toISOString(),
          estado: 'activa'
        })

      if (sancionError) throw sancionError

      // 2. Si se seleccionó eliminar el contenido, eliminar el video
      if (sancionForm.eliminarContenido) {
        const { error: storageError } = await supabase
          .storage
          .from('chat_videos')
          .remove([selectedVideo.name])

        if (storageError) throw storageError
      }

      // 3. Actualizar la lista de videos
      setPendingVideos(pendingVideos.filter(v => v.id !== selectedVideo.id))
      setApprovedVideos(approvedVideos.filter(v => v.id !== selectedVideo.id))

      // 4. Limpiar el estado y cerrar el modal
      setShowSancionModal(false)
      setSelectedVideo(null)
      setSancionForm({
        tipo: 'amonestacion',
        motivo: '',
        duracion: undefined,
        eliminarContenido: true
      })

    } catch (error) {
      console.error('Error al aplicar sanción:', error)
      alert('No se pudo aplicar la sanción')
    }
  }

  const renderSancionModal = () => (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Sancionar Usuario
          </h3>
          
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

            <div className="flex items-center">
              <input
                type="checkbox"
                id="eliminarContenido"
                checked={sancionForm.eliminarContenido}
                onChange={(e) => setSancionForm({
                  ...sancionForm,
                  eliminarContenido: e.target.checked
                })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="eliminarContenido" className="ml-2 block text-sm text-gray-900">
                Eliminar el video
              </label>
            </div>
          </div>

          <div className="mt-5 sm:mt-6 space-y-2">
            <button
              onClick={handleSubmitSancion}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm"
            >
              Aplicar Sanción
            </button>
            <button
              onClick={() => {
                setShowSancionModal(false)
                setSelectedVideo(null)
                setSancionForm({
                  tipo: 'amonestacion',
                  motivo: '',
                  duracion: undefined,
                  eliminarContenido: true
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary-700">Videos del Chat</h1>
        <div className="flex space-x-4">
          <Link 
            href="/user-management" 
            className="bg-secondary-500 text-white px-4 py-2 rounded hover:bg-secondary-600 transition duration-300 flex items-center"
          >
            <FiUser className="mr-2" />
            Gestión de Usuarios
          </Link>
          <Link 
            href="/content-moderation/chat" 
            className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 transition duration-300"
          >
            Volver
          </Link>
        </div>
      </div>

      {/* Sección de Videos Pendientes */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-primary-700 mb-6">Videos Pendientes</h2>
        {pendingVideos.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No hay videos pendientes para moderar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingVideos.map((video) => (
              <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  <video 
                    controls 
                    className="w-full rounded-lg mb-4 aspect-video"
                    src={video.publicUrl}
                  />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Usuario ID:</span> {video.userId}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Fecha:</span> {new Date(video.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handleApprove(video)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors flex items-center"
                    >
                      <FiCheck className="mr-2" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleReject(video)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors flex items-center"
                    >
                      <FiTrash2 className="mr-2" />
                      Rechazar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección de Videos Aprobados */}
      <div>
        <h2 className="text-2xl font-bold text-primary-700 mb-6">Videos Aprobados</h2>
        {approvedVideos.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No hay videos aprobados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedVideos.map((video) => (
              <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  <video 
                    controls 
                    className="w-full rounded-lg mb-4 aspect-video"
                    src={video.publicUrl}
                  />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Usuario ID:</span> {video.userId}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Fecha:</span> {new Date(video.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleRevertApproval(video)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors flex items-center"
                    >
                      <FiCheck className="mr-2" />
                      Revertir Aprobación
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSancionModal && renderSancionModal()}
    </div>
  )
}
