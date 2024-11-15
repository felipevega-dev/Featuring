'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { FiTrash2, FiCheck, FiUser, FiPlay, FiPause, FiAlertCircle } from 'react-icons/fi'
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

  // Agregar estado para el reproductor global
  const [globalAudioPlayer, setGlobalAudioPlayer] = useState<{
    currentSong: SongItem | null;
    progress: number;
    duration: number;
  }>({
    currentSong: null,
    progress: 0,
    duration: 0
  });

  // Función para actualizar el progreso del audio
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    const audio = e.target as HTMLAudioElement;
    setGlobalAudioPlayer(prev => ({
      ...prev,
      progress: audio.currentTime,
      duration: audio.duration
    }));
  };

  // Función para cambiar la posición del audio
  const handleSeek = (value: number) => {
    const audioElement = document.getElementById(globalAudioPlayer.currentSong?.id.toString() || '') as HTMLAudioElement;
    if (audioElement) {
      audioElement.currentTime = value;
      setGlobalAudioPlayer(prev => ({
        ...prev,
        progress: value
      }));
    }
  };

  // Modificar handlePlayAudio para usar el reproductor global
  const handlePlayAudio = (song: SongItem) => {
    if (globalAudioPlayer.currentSong?.id === song.id) {
      const audioElement = document.getElementById(song.id.toString()) as HTMLAudioElement;
      if (audioElement.paused) {
        audioElement.play();
        setIsPlaying(song.id);
      } else {
        audioElement.pause();
        setIsPlaying(null);
      }
    } else {
      // Pausar la canción anterior si existe
      if (globalAudioPlayer.currentSong) {
        const previousAudio = document.getElementById(globalAudioPlayer.currentSong.id.toString()) as HTMLAudioElement;
        if (previousAudio) previousAudio.pause();
      }
      // Reproducir la nueva canción
      const audioElement = document.getElementById(song.id.toString()) as HTMLAudioElement;
      if (audioElement) {
        audioElement.play();
        setIsPlaying(song.id);
        setGlobalAudioPlayer({
          currentSong: song,
          progress: 0,
          duration: audioElement.duration
        });
      }
    }
  };

  const handleAudioEnded = () => {
    setCurrentlyPlaying(null)
  }

  const handleApprove = async (song: SongItem) => {
    try {
      // 1. Actualizar el estado en la base de datos
      const { error } = await supabase
        .from('cancion')
        .update({ estado: 'aprobado' })
        .eq('id', song.id);

      if (error) throw error;

      // 2. Actualizar estados locales
      setPendingSongs(prev => prev.filter(s => s.id !== song.id));
      setApprovedSongs(prev => [...prev, { ...song, estado: 'aprobado' }]);
    } catch (error) {
      console.error('Error al aprobar la canción:', error);
      alert('No se pudo aprobar la canción');
    }
  };

  const handleRevertApproval = async (song: SongItem) => {
    try {
      // 1. Actualizar el estado en la base de datos
      const { error } = await supabase
        .from('cancion')
        .update({ estado: 'pendiente' })
        .eq('id', song.id);

      if (error) throw error;

      // 2. Actualizar estados locales
      setApprovedSongs(prev => prev.filter(s => s.id !== song.id));
      setPendingSongs(prev => [...prev, { ...song, estado: 'pendiente' }]);
    } catch (error) {
      console.error('Error al revertir aprobación:', error);
      alert('No se pudo revertir la aprobación');
    }
  };

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

      // 2. Si se seleccionó eliminar el contenido
      if (sancionForm.eliminarContenido) {
        // Eliminar de la tabla cancion primero
        const { error: deleteError } = await supabase
          .from('cancion')
          .delete()
          .eq('id', selectedSong.id)

        if (deleteError) throw deleteError

        // Luego eliminar archivos del storage
        const { error: audioError } = await supabase
          .storage
          .from('canciones')
          .remove([selectedSong.archivo_audio])

        if (audioError) throw audioError

        if (selectedSong.caratula) {
          const { error: coverError } = await supabase
            .storage
            .from('caratulas')
            .remove([selectedSong.caratula])

          if (coverError) throw coverError
        }
      }

      // 3. Actualizar la lista de canciones
      await fetchSongs() // Volver a cargar las canciones desde la base de datos

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

  async function fetchSongs() {
    try {
      setLoading(true)
      
      // Obtener canciones directamente de la tabla cancion
      const { data: songs, error: songsError } = await supabase
        .from('cancion')
        .select(`
          *,
          usuario:perfil!usuario_id(username)
        `)
        .order('created_at', { ascending: false });

      if (songsError) {
        console.error('Error fetching songs:', songsError);
        throw songsError;
      }

      // Separar canciones por estado
      setPendingSongs((songs || []).filter(song => song.estado === 'pendiente'));
      setApprovedSongs((songs || []).filter(song => song.estado === 'aprobado'));

    } catch (error) {
      console.error('Error fetching songs:', error)
      setError('No se pudieron cargar las canciones')
    } finally {
      setLoading(false)
    }
  }

  // Agregar useEffect para cargar las canciones
  useEffect(() => {
    fetchSongs()
  }, [])

  // Agregar useEffect para cargar la sesión
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    fetchSession()
  }, [])

  // Modificar el estado de reproducción
  const [isPlaying, setIsPlaying] = useState<number | null>(null);

  // Modificar renderizado de los botones de reproducción
  const renderPlayButton = (song: SongItem, isGlobal: boolean = false) => (
    <button
      onClick={() => handlePlayAudio(song)}
      className={`${isGlobal ? 'p-2 rounded-full hover:bg-gray-100' : 'w-full bg-gray-100 p-4 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center'}`}
    >
      {isPlaying === song.id ? (
        <FiPause className={`${isGlobal ? 'w-6 h-6' : 'w-4 h-4'} text-primary-600`} />
      ) : (
        <FiPlay className={`${isGlobal ? 'w-6 h-6' : 'w-4 h-4'} text-primary-600`} />
      )}
    </button>
  );

  // Agregar función para eliminar directamente
  const handleDeleteDirect = async (song: SongItem) => {
    const confirmed = window.confirm('¿Estás seguro de que quieres eliminar esta canción? Esta acción no puede deshacerse.');
    if (!confirmed) return;
  
    try {
      // 1. Eliminar el registro de la tabla cancion
      const { error: deleteError } = await supabase
        .from('cancion')
        .delete()
        .match({ id: song.id });  // Usar match en lugar de eq
  
      if (deleteError) {
        console.error('Error al eliminar registro de la tabla:', deleteError);
        // Verificar específicamente si es un error de permisos
        if (deleteError.code === 'PGRST301') {
          throw new Error('No tienes permisos suficientes para eliminar registros');
        }
        throw deleteError;
      }
  
      // 2. Si la eliminación del registro fue exitosa, procedemos con los archivos
      // Obtener los paths correctos de los archivos
      const audioPath = song.archivo_audio.split('/').pop();
      const coverPath = song.caratula ? song.caratula.split('/').pop() : null;
  
      // 3. Eliminar el archivo de audio
      if (audioPath) {
        const { error: audioError } = await supabase
          .storage
          .from('canciones')
          .remove([audioPath]);
  
        if (audioError) {
          console.error('Error al eliminar archivo de audio:', audioError);
        }
      }
  
      // 4. Eliminar la carátula si existe
      if (coverPath) {
        const { error: coverError } = await supabase
          .storage
          .from('caratulas')
          .remove([coverPath]);
  
        if (coverError) {
          console.error('Error al eliminar carátula:', coverError);
        }
      }
  
      // 5. Actualizar la lista de canciones en el estado
      setPendingSongs(prev => prev.filter(s => s.id !== song.id));
      setApprovedSongs(prev => prev.filter(s => s.id !== song.id));
      
      // 6. Actualizar el localStorage
      const savedApprovedSongs = JSON.parse(localStorage.getItem('approvedSongs') || '[]');
      const updatedApprovedSongs = savedApprovedSongs.filter((s: SongItem) => s.id !== song.id);
      localStorage.setItem('approvedSongs', JSON.stringify(updatedApprovedSongs));
  
    } catch (error) {
      console.error('Error al eliminar la canción:', error);
      alert(error instanceof Error ? error.message : 'No se pudo eliminar la canción');
    }
  };

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

      {/* Reproductor Global */}
      {globalAudioPlayer.currentSong && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4">
          <div className="max-w-7xl mx-auto flex items-center space-x-4">
            {globalAudioPlayer.currentSong.caratula && (
              <Image 
                src={globalAudioPlayer.currentSong.caratula}
                alt="Now playing"
                width={50}
                height={50}
                className="rounded-lg"
              />
            )}
            <div className="flex-1">
              <p className="font-semibold">{globalAudioPlayer.currentSong.titulo}</p>
              <p className="text-sm text-gray-600">{globalAudioPlayer.currentSong.usuario?.username}</p>
            </div>
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={globalAudioPlayer.duration || 100}
                value={globalAudioPlayer.progress}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatTime(globalAudioPlayer.progress)}</span>
                <span>{formatTime(globalAudioPlayer.duration)}</span>
              </div>
            </div>
            {renderPlayButton(globalAudioPlayer.currentSong, true)}
          </div>
        </div>
      )}

      {/* Sección de Canciones Pendientes */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-primary-700 mb-6">Canciones Pendientes</h2>
        {pendingSongs.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No hay canciones pendientes para moderar</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {pendingSongs.map((song) => (
              <div key={song.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-3"> {/* Reducir el padding */}
                  {song.caratula && (
                    <Image 
                      src={song.caratula}
                      alt="Song cover"
                      width={200} // Reducir el tamaño
                      height={200}
                      className="w-full rounded-lg mb-3 object-cover aspect-square"
                    />
                  )}
                  <audio 
                    id={song.id.toString()}
                    src={song.archivo_audio}
                    onEnded={handleAudioEnded}
                    onTimeUpdate={handleTimeUpdate}
                    className="hidden"
                  />
                  <div className="space-y-1"> {/* Reducir el espaciado */}
                    <p className="text-sm font-semibold truncate">{song.titulo}</p>
                    <p className="text-xs text-gray-600 truncate">
                      {song.usuario?.username || 'Desconocido'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(song.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-2 flex justify-end space-x-1"> {/* Reducir el espaciado */}
                    {renderPlayButton(song)}
                    <button
                      onClick={() => handleApprove(song)}
                      className="p-2 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                      title="Aprobar"
                    >
                      <FiCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReject(song)}
                      className="p-2 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                      title="Sancionar"
                    >
                      <FiAlertCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteDirect(song)}
                      className="p-2 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                      title="Eliminar"
                    >
                      <FiTrash2 className="w-4 h-4" />
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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
                    {renderPlayButton(song)}
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

// Función auxiliar para formatear el tiempo
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};
