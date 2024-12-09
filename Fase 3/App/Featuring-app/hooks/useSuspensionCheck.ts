import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export const useSuspensionCheck = () => {
  const [isSuspended, setIsSuspended] = useState(false)
  const [suspensionDetails, setSuspensionDetails] = useState<any>(null)

  const checkSuspension = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return false

      const { data: perfil } = await supabase
        .from('perfil')
        .select('suspended')
        .eq('usuario_id', session.user.id)
        .single()

      if (perfil?.suspended) {
        const { data: suspensiones } = await supabase
          .from('sancion_administrativa')
          .select('*')
          .eq('usuario_id', session.user.id)
          .eq('estado', 'activa')
          .or('tipo_sancion.eq.suspension_temporal,tipo_sancion.eq.suspension_permanente')
          .maybeSingle()

        if (suspensiones) {
          setIsSuspended(true)
          setSuspensionDetails(suspensiones)
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Error checking suspension:', error)
      return false
    }
  }

  useEffect(() => {
    checkSuspension()
  }, [])

  return { isSuspended, suspensionDetails, checkSuspension }
} 