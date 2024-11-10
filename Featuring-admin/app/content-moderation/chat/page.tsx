'use client'

import Link from 'next/link'
import { FiVideo, FiImage, FiMusic } from 'react-icons/fi'

export default function ChatContentModeration() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary-700">Moderación de Contenido del Chat</h1>
        <Link href="/content-moderation" className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 transition duration-300">
          Volver a Moderación
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Videos del Chat */}
        <Link href="/content-moderation/chat/chat_videos" 
          className="flex items-center justify-center p-6 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition duration-300">
          <FiVideo className="mr-3" size={24} />
          <span className="text-xl font-semibold">Videos del Chat</span>
        </Link>

        {/* Imágenes del Chat */}
        <Link href="/content-moderation/chat/chat_images" 
          className="flex items-center justify-center p-6 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition duration-300">
          <FiImage className="mr-3" size={24} />
          <span className="text-xl font-semibold">Imágenes del Chat</span>
        </Link>

        {/* Mensajes de Audio */}
        <Link href="/content-moderation/chat/audio_messages" 
          className="flex items-center justify-center p-6 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition duration-300">
          <FiMusic className="mr-3" size={24} />
          <span className="text-xl font-semibold">Mensajes de Audio</span>
        </Link>
      </div>
    </div>
  )
} 