'use client'

import Link from 'next/link'
import { 
  FiVideo, 
  FiMusic, 
  FiMessageCircle, 
  FiImage, 
  FiMic, 
  FiFilm,
  FiAlertCircle,
  FiActivity,
  FiCheckCircle
} from 'react-icons/fi'
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface ContentStats {
  pendingVideos: number;
  pendingSongs: number;
  pendingChatContent: {
    images: number;
    videos: number;
    audios: number;
  };
  approvedContent: number;
}

export default function ContentModerationMain() {
  const [stats, setStats] = useState<ContentStats>({
    pendingVideos: 0,
    pendingSongs: 0,
    pendingChatContent: {
      images: 0,
      videos: 0,
      audios: 0
    },
    approvedContent: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Obtener estadísticas de videos pendientes y aprobados
      const [{ data: pendingVideos }, { data: approvedVideos }] = await Promise.all([
        supabase.from('video').select('id').eq('estado', 'pendiente'),
        supabase.from('video').select('id').eq('estado', 'aprobado')
      ]);

      // Obtener estadísticas de canciones pendientes y aprobadas
      const [{ data: pendingSongs }, { data: approvedSongs }] = await Promise.all([
        supabase.from('cancion').select('id').eq('estado', 'pendiente'),
        supabase.from('cancion').select('id').eq('estado', 'aprobado')
      ]);

      // Obtener estadísticas de contenido del chat
      const { data: chatImages } = await supabase.storage.from('chat_images').list()
      const { data: chatVideos } = await supabase.storage.from('chat_videos').list()
      const { data: chatAudios } = await supabase.storage.from('audio_messages').list()

      setStats({
        pendingVideos: pendingVideos?.length || 0,
        pendingSongs: pendingSongs?.length || 0,
        pendingChatContent: {
          images: chatImages?.length || 0,
          videos: chatVideos?.length || 0,
          audios: chatAudios?.length || 0
        },
        approvedContent: (approvedVideos?.length || 0) + (approvedSongs?.length || 0)
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold text-primary-700">Moderación de Contenido</h1>
      <Link href="/" className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 transition duration-300">
        Volver al Menú Principal
      </Link>
    </div>

    {/* Estadísticas de Contenido */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center">
          <div className="p-3 bg-yellow-50 rounded-lg">
            <FiActivity className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Pendientes</p>
            <p className="text-2xl font-semibold text-gray-900">
              {!loading ? stats.pendingChatContent.images + stats.pendingChatContent.videos + stats.pendingChatContent.audios : '...'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center">
          <div className="p-3 bg-green-50 rounded-lg">
            <FiCheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">Aprobados</p>
            <p className="text-2xl font-semibold text-gray-900">
              {!loading ? stats.approvedContent : '...'}
            </p>
          </div>
        </div>
      </div>
    </div>

      {/* Secciones Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Videos de Watch */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 bg-blue-500">
            <FiVideo className="text-white w-8 h-8 mb-4" />
            <h2 className="text-xl font-bold text-white">Videos de Watch</h2>
            {!loading && (
              <p className="text-white mt-2">
                {stats.pendingVideos} videos pendientes
              </p>
            )}
          </div>
          <div className="p-4 bg-white">
            <p className="text-gray-600 mb-4">
              Modera los videos subidos por usuarios a la sección Watch
            </p>
            <Link 
              href="/content-moderation/videos"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-300"
            >
              Gestionar Videos
            </Link>
          </div>
        </div>

        {/* Canciones */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 bg-green-500">
            <FiMusic className="text-white w-8 h-8 mb-4" />
            <h2 className="text-xl font-bold text-white">Canciones de Comunidad</h2>
            {!loading && (
              <p className="text-white mt-2">
                {stats.pendingSongs} canciones pendientes
              </p>
            )}
          </div>
          <div className="p-4 bg-white">
            <p className="text-gray-600 mb-4">
              Modera las canciones y carátulas subidas por los usuarios
            </p>
            <Link 
              href="/content-moderation/canciones"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-300"
            >
              Gestionar Canciones
            </Link>
          </div>
        </div>

        {/* Contenido del Chat */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 bg-yellow-500">
            <FiMessageCircle className="text-white w-8 h-8 mb-4" />
            <h2 className="text-xl font-bold text-white">Contenido del Chat</h2>
            {!loading && (
              <div className="text-white mt-2 space-y-1">
                <p>{stats.pendingChatContent.images + stats.pendingChatContent.videos + stats.pendingChatContent.audios} contenidos pendientes</p>
              </div>
            )}
          </div>
          <div className="p-4 bg-white">
            <p className="text-gray-600 mb-4">
              Modera el contenido multimedia compartido en chats
            </p>
            <Link 
              href="/content-moderation/chat"
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition duration-300"
            >
              Gestionar Contenido del Chat
            </Link>
          </div>
        </div>
      </div>

      {/* Accesos Directos del Chat */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Accesos Directos - Contenido del Chat</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/content-moderation/chat/chat_images"
            className="flex items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <FiImage className="w-6 h-6 text-purple-500 mr-3" />
            <div>
              <h4 className="font-semibold">Imágenes</h4>
              {!loading && <p className="text-sm text-gray-500">{stats.pendingChatContent.images} pendientes</p>}
            </div>
          </Link>

          <Link 
            href="/content-moderation/chat/chat_videos"
            className="flex items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <FiFilm className="w-6 h-6 text-indigo-500 mr-3" />
            <div>
              <h4 className="font-semibold">Videos</h4>
              {!loading && <p className="text-sm text-gray-500">{stats.pendingChatContent.videos} pendientes</p>}
            </div>
          </Link>

          <Link 
            href="/content-moderation/chat/audio_messages"
            className="flex items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <FiMic className="w-6 h-6 text-pink-500 mr-3" />
            <div>
              <h4 className="font-semibold">Mensajes de Audio</h4>
              {!loading && <p className="text-sm text-gray-500">{stats.pendingChatContent.audios} pendientes</p>}
            </div>
          </Link>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
        </div>
      )}
    </div>

  )

}
