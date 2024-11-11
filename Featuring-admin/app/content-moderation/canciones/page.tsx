'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { FiTrash2, FiCheck, FiUser, FiPlay, FiPause } from 'react-icons/fi'
import { Session } from '@supabase/supabase-js'
import Image from 'next/image'

interface SongItem {
  id: number;
  titulo: string;
  archivo_audio: string;
  caratula: string;
  created_at: string;
  usuario_id: string;
  usuario?: {
    username: string;
  };
}

interface SancionForm {
  tipo: 'amonestacion' | 'suspension_temporal' | 'suspension_permanente';
  motivo: string;
  duracion?: number;
  eliminarContenido: boolean;
}

export default function SongsModeration() {
  const [pendingSongs, setPendingSongs] = useState<SongItem[]>([])
  const [approvedSongs, setApprovedSongs] = useState<SongItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSancionModal, setShowSancionModal] = useState(false)
  const [selectedSong, setSelectedSong] = useState<SongItem | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [sancionForm, setSancionForm] = useState<SancionForm>({
    tipo: 'amonestacion',
    motivo: '',
    duracion: undefined,
    eliminarContenido: true
  })
  const supabase = createClientComponentClient()
  const supabaseAdmin = createClientComponentClient()

  // Cargar canciones aprobadas del localStorage al iniciar
  useEffect(() => {
    const savedApprovedSongs = localStorage.getItem('approvedSongs')
    if (savedApprovedSongs) {
      setApprovedSongs(JSON.parse(savedApprovedSongs))
    }
  }, [])

  useEffect(() => {
    fetchSongs()
  }, [])

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    fetchSession()
  }, [])

  async function fetchSongs() {
    try {
      setLoading(true)
      
      // Obtener canciones directamente de la tabla cancion
      const { data: songs, error: songsError } = await supabase
        .from('cancion')
        .select(`
          *,
          usuario:usuario_id(username)
        `)
        .order('created_at', { ascending: false });

      if (songsError) throw songsError;

      // Obtener IDs de canciones aprobadas del localStorage
      const savedApprovedSongs = JSON.parse(localStorage.getItem('approvedSongs') || '[]')
      const approvedIds = new Set(savedApprovedSongs.map((v: SongItem) => v.id))
      
      // Filtrar canciones pendientes excluyendo las aprobadas
      setPendingSongs((songs || []).filter(song => !approvedIds.has(song.id)))
      
      // Mantener solo las canciones aprobadas que aún existen
      const currentApprovedSongs = savedApprovedSongs.filter((song: SongItem) => 
        songs?.some(v => v.id === song.id)
      )
      setApprovedSongs(currentApprovedSongs)
      localStorage.setItem('approvedSongs', JSON.stringify(currentApprovedSongs))

    } catch (error) {
      console.error('Error fetching songs:', error)
      setError('No se pudieron cargar las canciones')
    } finally {
      setLoading(false)
    }
  }

  const handlePlayAudio = (audioId: string) => {
    if (currentlyPlaying === audioId) {
      setCurrentlyPlaying(null)
      // Pausar el audio actual
      const audioElement = document.getElementById(audioId) as HTMLAudioElement
      if (audioElement) audioElement.pause()
    } else {
      // Pausar el audio anterior si existe
      if (currentlyPlaying) {
        const previousAudio = document.getElementById(currentlyPlaying) as HTMLAudioElement
        if (previousAudio) previousAudio.pause()
      }
      setCurrentlyPlaying(audioId)
      // Reproducir el nuevo audio
      const audioElement = document.getElementById(audioId) as HTMLAudioElement
      if (audioElement) audioElement.play()
    }
  }

  const handleAudioEnded = () => {
    setCurrentlyPlaying(null)
  }

  const handleApprove = (song: SongItem) => {
    setPendingSongs(prev => prev.filter(v => v.id !== song.id))
    const newApprovedSongs = [...approvedSongs, song]
    setApprovedSongs(newApprovedSongs)
    localStorage.setItem('approvedSongs', JSON.stringify(newApprovedSongs))
  }

  const handleRevertApproval = (song: SongItem) => {
    setApprovedSongs(prev => {
      const newApprovedSongs = prev.filter(v => v.id !== song.id)
      localStorage.setItem('approvedSongs', JSON.stringify(newApprovedSongs))
      return newApprovedSongs
    })
    setPendingSongs(prev => [...prev, song])
  }

  const handleReject = async (song: SongItem) => {
    setSelectedSong(song)
    setShowSancionModal(true)
  }

  const handleSubmitSancion = async () => {
    if (!selectedSong || !sancionForm.motivo || !session?.user?.id) {
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
          usuario_id: selectedSong.usuario_id,
          admin_id: session.user.id,
          tipo_sancion: sancionForm.tipo,
          motivo: sancionForm.motivo,
          duracion_dias: sancionForm.duracion,
          fecha_inicio: now.toISOString(),
          fecha_fin: fecha_fin?.toISOString(),
          estado: 'activa'
        })

      if (sancionError) throw sancionError

      // 2. Si se seleccionó eliminar el contenido, eliminar la canción y su carátula
      if (sancionForm.eliminarContenido) {
        // Eliminar archivo de audio
        const { error: audioError } = await supabase
          .storage
          .from('canciones')
          .remove([selectedSong.archivo_audio])

        if (audioError) throw audioError

        // Eliminar carátula si existe
        if (selectedSong.caratula) {
          const coverPath = selectedSong.archivo_audio.replace('canciones', 'caratulas')
          const { error: coverError } = await supabase
            .storage
            .from('caratulas')
            .remove([coverPath])

          if (coverError) throw coverError
        }
      }

      // 3. Actualizar la lista de canciones
      setPendingSongs(pendingSongs.filter(v => v.id !== selectedSong.id))
      setApprovedSongs(approvedSongs.filter(v => v.id !== selectedSong.id))

      // 4. Limpiar el estado y cerrar el modal
      setShowSancionModal(false)
      setSelectedSong(null)
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
                Eliminar la canción
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
                setSelectedSong(null)
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary-700">Canciones de Comunidad</h1>
        <div className="flex space-x-4">
          <Link 
            href="/user-management" 
            className="bg-secondary-500 text-white px-4 py-2 rounded hover:bg-secondary-600 transition duration-300 flex items-center"
          >
            <FiUser className="mr-2" />
            Gestión de Usuarios
          </Link>
          <Link 
            href="/content-moderation" 
            className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 transition duration-300"
          >
            Volver
          </Link>
        </div>
      </div>

      {/* Sección de Canciones Pendientes */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-primary-700 mb-6">Canciones Pendientes</h2>
        {pendingSongs.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No hay canciones pendientes para moderar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingSongs.map((song) => (
              <div key={song.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  {song.caratula && (
                    <Image 
                      src={song.caratula}
                      alt="Song cover"
                      width={400}
                      height={400}
                      className="w-full rounded-lg mb-4 object-cover aspect-square"
                    />
                  )}
                  <div className="mb-4">
                    <audio 
                      id={song.id.toString()}
                      src={song.archivo_audio}
                      onEnded={handleAudioEnded}
                      className="hidden"
                    />
                    <button
                      onClick={() => handlePlayAudio(song.id.toString())}
                      className="w-full bg-gray-100 p-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                    >
                      {currentlyPlaying === song.id.toString() ? (
                        <FiPause className="w-8 h-8 text-primary-600" />
                      ) : (
                        <FiPlay className="w-8 h-8 text-primary-600" />
                      )}
                    </button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Título:</span> {song.titulo}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Usuario:</span> {song.usuario?.username || 'Desconocido'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Fecha:</span> {new Date(song.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handleApprove(song)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors flex items-center"
                    >
                      <FiCheck className="mr-2" />
                      Aprobar
                    </button>
                    <button
                      onClick={() => handleReject(song)}
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

      {/* Sección de Canciones Aprobadas */}
      <div>
        <h2 className="text-2xl font-bold text-primary-700 mb-6">Canciones Aprobadas</h2>
        {approvedSongs.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No hay canciones aprobadas</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {approvedSongs.map((song) => (
              <div key={song.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  {song.caratula && (
                    <Image 
                      src={song.caratula}
                      alt="Song cover"
                      width={400}
                      height={400}
                      className="w-full rounded-lg mb-4 object-cover aspect-square"
                    />
                  )}
                  <div className="mb-4">
                    <audio 
                      id={song.id.toString()}
                      src={song.archivo_audio}
                      onEnded={handleAudioEnded}
                      className="hidden"
                    />
                    <button
                      onClick={() => handlePlayAudio(song.id.toString())}
                      className="w-full bg-gray-100 p-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                    >
                      {currentlyPlaying === song.id.toString() ? (
                        <FiPause className="w-8 h-8 text-primary-600" />
                      ) : (
                        <FiPlay className="w-8 h-8 text-primary-600" />
                      )}
                    </button>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Título:</span> {song.titulo}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Usuario:</span> {song.usuario?.username || 'Desconocido'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Fecha:</span> {new Date(song.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleRevertApproval(song)}
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
