import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform, AppState } from 'react-native';
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
        return;
      }

      // Obtener el token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '503d5abc-4d4d-47ef-81bd-0ccbd546d35a'
      });
      
      token = tokenData.data;

      // Guardar el token en la base de datos
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error al obtener usuario:', userError);
        return;
      }

      if (user) {
        const { error: updateError } = await supabase
          .from('perfil')
          .update({ push_token: token })
          .eq('usuario_id', user.id);

        if (updateError) {
          console.error('Error al guardar push token:', updateError);
          return;
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
    }
  } catch (error) {
    console.error('Error en registerForPushNotificationsAsync:', error);
  }

  return token;
}

// Función para enviar notificación push
export async function sendPushNotification(expoPushToken: string, title: string, body: string) {
  const message = {
    to: expoPushToken,
    sound: 'default',
    title: title,
    body: body,
    data: { someData: 'goes here' },
  };

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
} 