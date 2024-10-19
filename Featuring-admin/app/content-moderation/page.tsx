'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import Image from 'next/image'

interface ContentItem {
  id: string;
  titulo: string;
  usuario_id: string;
  genero: string;
  caratula: string;
  archivo_audio: string;
}

export default function ContentModeration() {
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchContent()
  }, [])

  async function fetchContent() {
    setLoading(true)
    const { data, error } = await supabase
      .from('cancion')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching content:', error)
      setError('No se pudo cargar el contenido')
    } else {
      setContent(data || [])
    }
    setLoading(false)
  }

  async function handleModeration(id: string, action: 'approve' | 'reject') {
    try {
      const { error } = await supabase
        .from('cancion')
        .update({ estado: action === 'approve' ? 'aprobado' : 'rechazado' })
        .eq('id', id)

      if (error) throw error

      // Actualizar el estado local
      setContent(content.filter(item => item.id !== id))
    } catch (error) {
      console.error(`Error al ${action === 'approve' ? 'aprobar' : 'rechazar'} el contenido:`, error)
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

      {loading && <div className="text-center text-xl">Cargando contenido...</div>}
      {error && <div className="text-center text-xl text-danger-600">Error: {error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.map((item) => (
            <div key={item.id} className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="relative h-48">
                <Image
                  src={item.caratula || '/placeholder-image.jpg'}
                  alt={item.titulo}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold text-primary-600 mb-2">{item.titulo}</h2>
                <p className="text-secondary-700 mb-1">Género: {item.genero}</p>
                <audio controls className="w-full mb-4">
                  <source src={item.archivo_audio} type="audio/mpeg" />
                  Tu navegador no soporta el elemento de audio.
                </audio>
                <div className="flex justify-between">
                  <button
                    onClick={() => handleModeration(item.id, 'approve')}
                    className="bg-success-500 text-white px-4 py-2 rounded hover:bg-success-600 transition duration-300"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleModeration(item.id, 'reject')}
                    className="bg-danger-500 text-white px-4 py-2 rounded hover:bg-danger-600 transition duration-300"
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && content.length === 0 && (
        <div className="text-center text-xl text-secondary-700">
          No hay contenido pendiente de moderación.
        </div>
      )}
    </div>
  )
}
