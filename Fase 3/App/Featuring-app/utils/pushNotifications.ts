import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

// Configurar el comportamiento de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Registrar el dispositivo para notificaciones push
export async function registerForPushNotificationsAsync() {
  let token;

  try {
    // Log inicial
    console.log('Iniciando registro de push notifications...');

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      console.log('❌ No hay sesión activa:', sessionError);
      return null;
    }
    console.log('✅ Sesión activa encontrada:', session.user.id);

    if (!Device.isDevice) {
      console.log('❌ No es un dispositivo físico');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    console.log('Estado de permisos actual:', existingStatus);

    if (existingStatus !== 'granted') {
      console.log('Solicitando permisos...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('Nuevo estado de permisos:', status);
    }

    if (finalStatus !== 'granted') {
      console.log('❌ No se obtuvieron permisos');
      return null;
    }

    console.log('✅ Permisos obtenidos, obteniendo token...');
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '3c032550-ab89-4b62-aadf-92576aa5ee1d'
    });
    
    token = tokenData.data;
    console.log('✅ Token obtenido:', token);

    if (session.user) {
      console.log('Verificando perfil existente...');
      const { data: existingProfile, error: profileError } = await supabase
        .from('perfil')
        .select('push_token')
        .eq('usuario_id', session.user.id)
        .single();

      console.log('Resultado de búsqueda de perfil:', { existingProfile, profileError });

      if (profileError) {
        console.log('Creando nuevo perfil con token...');
        const { error: insertError } = await supabase
          .from('perfil')
          .insert({ 
            usuario_id: session.user.id,
            push_token: token,
            tutorial_completado: false
          });

        if (insertError) {
          console.error('❌ Error al crear perfil:', insertError);
        } else {
          console.log('✅ Perfil creado exitosamente con token');
        }
      } else if (existingProfile.push_token !== token) {
        console.log('Actualizando token existente...');
        const { error: updateError } = await supabase
          .from('perfil')
          .update({ push_token: token })
          .eq('usuario_id', session.user.id);

        if (updateError) {
          console.error('❌ Error al actualizar push token:', updateError);
        } else {
          console.log('✅ Token actualizado exitosamente');
        }
      }
    }

    return token;
  } catch (error) {
    console.error('❌ Error en registerForPushNotificationsAsync:', error);
    return null;
  }
}

// Función para enviar notificación push
export async function sendPushNotification(expoPushToken: string, title: string, body: string) {
  try {
    const message = {
      to: expoPushToken,
      sound: 'default',
      title: title,
      body: body,
      data: { someData: 'goes here' },
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      throw new Error(`Error al enviar notificación: ${JSON.stringify(responseData)}`);
    }

    return responseData;
  } catch (error) {
    console.error('Error al enviar notificación push:', error);
    throw error;
  }
} 