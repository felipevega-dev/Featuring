'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface ContentItem {
  id: string;
  titulo: string;
  usuario_id: string;
  genero: string;
}

export default function ContentModeration() {
  const [content, setContent] = useState<ContentItem[]>([])
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchContent()
  }, [])

  async function fetchContent() {
    const { data, error } = await supabase
      .from('cancion')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching content:', error)
    } else {
      setContent(data || [])
    }
  }

  async function handleModeration(id: string, action: string) {
    // Implementar lógica de moderación (aprobar, rechazar, etc.)
    console.log(`Acción ${action} para el contenido ${id}`)
  }

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8 text-primary-700">Moderación de Contenido</h1>
      <ul className="w-full max-w-2xl space-y-4">
        {content.map((item) => (
          <li key={item.id} className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-xl font-semibold text-primary-600 mb-2">{item.titulo}</h2>
            <p className="text-secondary-700 mb-1">Usuario: {item.usuario_id}</p>
            <p className="text-secondary-700 mb-4">Género: {item.genero}</p>
            <div className="flex justify-end space-x-2">
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
          </li>
        ))}
      </ul>
    </div>
  )
}
