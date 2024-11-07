import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'

export const useSuspensionCheck = () => {
  const [isSuspended, setIsSuspended] = useState(false)
  const [suspensionDetails, setSuspensionDetails] = useState<any>(null)

  const checkSuspension = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return false

      // Verificar si el usuario está suspendido
      const { data: perfil } = await supabase
        .from('perfil')
        .select('suspended')
        .eq('usuario_id', session.user.id)
        .single()

      if (perfil?.suspended) {
        // Obtener detalles de la suspensión
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
          router.replace('/(auth)/suspended')
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

    // Suscribirse a cambios de autenticación
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await checkSuspension()
        }
      }
    )

    // Suscribirse a cambios en la tabla perfil
    const channel = supabase
      .channel('suspension-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'perfil',
          filter: `usuario_id=eq.${supabase.auth.getSession()?.data?.session?.user.id}`
        },
        async (payload) => {
          if (payload.new.suspended) {
            await checkSuspension()
          }
        }
      )
      .subscribe()

    return () => {
      authSubscription.unsubscribe()
      channel.unsubscribe()
    }
  }, [])

  return { isSuspended, suspensionDetails, checkSuspension }
} 