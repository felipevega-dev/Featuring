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
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('No se obtuvieron permisos para las notificaciones');
        return;
      }

      // Obtener el token con el nuevo projectId
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '3c032550-ab89-4b62-aadf-92576aa5ee1d'
      });
      
      token = tokenData.data;

      // Actualizar token en Supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error al obtener usuario:', userError);
        return;
      }

      if (user) {
        // Primero verificamos si hay un token antiguo
        const { data: existingProfile } = await supabase
          .from('perfil')
          .select('push_token')
          .eq('usuario_id', user.id)
          .single();

        if (existingProfile?.push_token !== token) {
          // Si el token es diferente, actualizamos
          const { error: updateError } = await supabase
            .from('perfil')
            .update({ 
              push_token: token,
              token_updated_at: new Date().toISOString()
            })
            .eq('usuario_id', user.id);

          if (updateError) {
            console.error('Error al actualizar push token:', updateError);
            return;
          }
          
          console.log('Token actualizado exitosamente');
        }
      }

      // Configurar canal para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    } else {
      console.log('Las notificaciones push requieren un dispositivo físico');
    }
  } catch (error) {
    console.error('Error en registerForPushNotificationsAsync:', error);
    // Intentar limpiar el token en caso de error
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('perfil')
          .update({ push_token: null })
          .eq('usuario_id', user.id);
      }
    } catch (cleanupError) {
      console.error('Error al limpiar token:', cleanupError);
    }
  }

  return token;
}

// Función para enviar notificación push con mejor manejo de errores
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

    console.log('Notificación enviada exitosamente:', responseData);
    return responseData;
  } catch (error) {
    console.error('Error al enviar notificación push:', error);
    throw error;
  }
} 