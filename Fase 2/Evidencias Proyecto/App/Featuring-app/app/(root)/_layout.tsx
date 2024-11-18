import React, { useEffect, useState } from 'react';
import { Stack } from "expo-router";
import { supabase } from '@/lib/supabase';
import OnboardingTutorial from '@/components/OnboardingTutorial';
import { registerForPushNotificationsAsync } from '@/utils/pushNotifications';

export default function RootLayout() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Iniciando verificación de usuario y tutorial...');
        await checkUserAndTutorialStatus();
        
        console.log('Iniciando registro de notificaciones...');
        await registerForPushNotificationsAsync();
      } catch (error) {
        console.error('Error en la inicialización:', error);
      }
    };

    initializeApp();
  }, []);

  const checkUserAndTutorialStatus = async () => {
    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);

      // Verificar si el perfil está completo y si el tutorial no se ha mostrado
      const { data: perfil, error } = await supabase
        .from('perfil')
        .select('tutorial_completado, username, biografia, nacionalidad')
        .eq('usuario_id', user.id)
        .single();

      if (error) throw error;

      // Verificar si el perfil está completo (tiene los campos básicos llenos)
      const isProfileComplete = perfil.username && perfil.biografia && perfil.nacionalidad;

      // Mostrar tutorial si:
      // 1. El perfil está completo
      // 2. tutorial_completado es explícitamente false (no null)
      if (isProfileComplete && perfil.tutorial_completado === false) {
        setShowTutorial(true);
      }

      // Si tutorial_completado es null, actualizarlo a false
      if (perfil.tutorial_completado === null) {
        await supabase
          .from('perfil')
          .update({ tutorial_completado: false })
          .eq('usuario_id', user.id);
      }
    } catch (error) {
      console.error('Error al verificar estado del tutorial:', error);
    }
  };

  // Suscribirse a cambios en el perfil
  useEffect(() => {
    if (!userId) return;

    const subscription = supabase
      .channel('perfil_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'perfil',
          filter: `usuario_id=eq.${userId}`
        },
        (payload) => {
          // Verificar si el perfil se actualizó y mostrar el tutorial si es necesario
          const perfil = payload.new;
          const isProfileComplete = perfil.username && perfil.biografia && perfil.nacionalidad;
          if (isProfileComplete && !perfil.tutorial_completado) {
            setShowTutorial(true);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="public-profile/[id]" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen
          name="(edit)/editar_perfil"
          options={{ headerShown: false, presentation: "modal" }}
        />
      </Stack>

      {userId && (
        <OnboardingTutorial
          isVisible={showTutorial}
          onClose={() => setShowTutorial(false)}
          userId={userId}
        />
      )}
    </>
  );
}