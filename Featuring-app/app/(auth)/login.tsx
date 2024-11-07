import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { useSuspensionCheck } from '@/hooks/useSuspensionCheck'

export default function Login() {
  const { checkSuspension } = useSuspensionCheck()

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Verificar suspensión inmediatamente después del login
      const isSuspended = await checkSuspension()
      
      if (!isSuspended) {
        // Solo navegar al home si el usuario no está suspendido
        router.replace('/(root)/(tabs)')
      }
      // Si está suspendido, el hook se encargará de la redirección

    } catch (error) {
      // ... manejo de errores ...
    }
  }

  // ... resto del código ...
} 