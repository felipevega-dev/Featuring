'use client'

import Link from 'next/link'
import { FiVideo, FiMusic, FiMessageCircle } from 'react-icons/fi'

export default function ContentModerationMain() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary-700">Moderación de Contenido</h1>
        <Link href="/" className="bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 transition duration-300">
          Volver al Menú Principal
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Videos */}
        <Link href="/content-moderation/videos" 
          className="flex items-center justify-center p-6 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition duration-300">
          <FiVideo className="mr-3" size={24} />
          <span className="text-xl font-semibold">Videos de Watch</span>
        </Link>

        {/* Canciones y Carátulas */}
        <Link href="/content-moderation/canciones" 
          className="flex items-center justify-center p-6 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition duration-300">
          <FiMusic className="mr-3" size={24} />
          <span className="text-xl font-semibold">Canciones de Comunidad</span>
        </Link>

        {/* Contenido del Chat */}
        <Link href="/content-moderation/chat" 
          className="flex items-center justify-center p-6 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition duration-300">
          <FiMessageCircle className="mr-3" size={24} />
          <span className="text-xl font-semibold">Contenido del Chat</span>
        </Link>
      </div>
    </div>
  )
}
