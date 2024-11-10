'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { FiTrash2, FiCheck } from 'react-icons/fi'
import { Video, ResizeMode } from 'expo-av'

interface VideoItem {
  id: number;
  emisor_id: string;
  receptor_id: string;
  url_contenido: string;
  fecha_envio: string;
  emisor?: {
    username: string;
  };
  receptor?: {
    username: string;
  };
}

export default function ChatVideosModeration() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchVideos()
  }, [])

  async function fetchVideos() {
    try {
      setLoading(true)
      
      const { data: mensajes, error: mensajesError } = await supabase
        .from('mensaje')
        .select(`
          id,
          emisor_id,
          receptor_id,
          url_contenido,
          fecha_envio,
          emisor:perfil!emisor_id(username),
          receptor:perfil!receptor_id(username)
        `)
        .eq('tipo_contenido', 'video_chat')
        .order('fecha_envio', { ascending: false });

      if (mensajesError) throw mensajesError;

      setVideos(mensajes || []);
    } catch (error) {
      console.error('Error fetching videos:', error)
      setError('No se pudieron cargar los videos')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (videoId: number) => {
    try {
      const { error } = await supabase
        .from('mensaje')
        .update({ estado: 'aprobado' })
        .eq('id', videoId);

      if (error) throw error;

      setVideos(videos.filter(video => video.id !== videoId));
    } catch (error) {
      console.error('Error al aprobar el video:', error);
      alert('No se pudo aprobar el video');
    }
  };

  const handleReject = async (videoId: number, videoUrl: string) => {
    try {
      const confirmed = window.confirm('¿Estás seguro de que quieres rechazar este video? Se eliminará permanentemente.');
      if (!confirmed) return;

      // Extraer el path del video de la URL
      const videoPath = videoUrl.split('/').slice(-2).join('/');

      // Eliminar el archivo del storage
      const { error: storageError } = await supabase
        .storage
        .from('chat_videos')
        .remove([videoPath]);

      if (storageError) throw storageError;

      // Eliminar el mensaje
      const { error: dbError } = await supabase
        .from('mensaje')
        .delete()
        .eq('id', videoId);

      if (dbError) throw dbError;

      setVideos(videos.filter(video => video.id !== videoId));
    } catch (error) {
      console.error('Error al rechazar el video:', error);
      alert('No se pudo rechazar el video');
    }
  };

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
        <Link 
          href="/content-moderation/chat" 
          className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 transition duration-300"
        >
          Volver
        </Link>
      </div>

      {videos.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          <p>No hay videos para moderar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4">
                <video 
                  controls 
                  className="w-full rounded-lg mb-4 aspect-video"
                  src={video.url_contenido}
                />
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">De:</span> {video.emisor?.username || 'Desconocido'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Para:</span> {video.receptor?.username || 'Desconocido'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Fecha:</span> {new Date(video.fecha_envio).toLocaleString()}
                  </p>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    onClick={() => handleApprove(video.id)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors flex items-center"
                  >
                    <FiCheck className="mr-2" />
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleReject(video.id, video.url_contenido)}
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
  )
}
