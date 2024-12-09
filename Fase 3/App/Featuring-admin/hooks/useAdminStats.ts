import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface AdminStats {
  totalUsers: number
  pendingContent: number
  activeReports: number
  approvedContent: number
  isLoading: boolean
  error: string | null
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingContent: 0,
    activeReports: 0,
    approvedContent: 0,
    isLoading: true,
    error: null
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        
        const { count: usersCount, error: usersError } = await supabase
          .from('perfil')
          .select('*', { count: 'exact' })
        
        if (usersError) console.error('Error fetching users:', usersError)

        const { count: pendingSongsCount, error: pendingSongsError } = await supabase
          .from('cancion')
          .select('*', { count: 'exact' })
          .eq('estado', 'pendiente')
        
        if (pendingSongsError) console.error('Error fetching pending songs:', pendingSongsError)

        // Obtener contenido pendiente de videos
        const { count: pendingVideosCount } = await supabase
          .from('video')
          .select('*', { count: 'exact' })
          .eq('estado', 'pendiente')

        // Obtener reportes activos
        const { count: reportsCount } = await supabase
          .from('reporte')
          .select('*', { count: 'exact' })
          .eq('estado', 'pendiente')

        // Obtener contenido aprobado de canciones
        const { count: approvedSongsCount } = await supabase
          .from('cancion')
          .select('*', { count: 'exact' })
          .eq('estado', 'aprobado')

        // Obtener contenido aprobado de videos
        const { count: approvedVideosCount } = await supabase
          .from('video')
          .select('*', { count: 'exact' })
          .eq('estado', 'aprobado')

        setStats({
          totalUsers: usersCount || 0,
          pendingContent: (pendingSongsCount || 0) + (pendingVideosCount || 0),
          activeReports: reportsCount || 0,
          approvedContent: (approvedSongsCount || 0) + (approvedVideosCount || 0),
          isLoading: false,
          error: null
        })
      } catch (error) {
        console.error('Error in fetchStats:', error)
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: 'Error al cargar estadísticas'
        }))
      }
    }

    fetchStats()
  }, [supabase])

  return stats
} 