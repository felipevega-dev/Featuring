import React from 'react';
import { TouchableOpacity, View, Text, Image, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import { NotificationType, NOTIFICATION_REDIRECTS } from '@/types/notification';

interface NotificationItemProps {
  notification: {
    id: number;
    tipo_notificacion: NotificationType;
    contenido_id: number;
    mensaje: string;
    leido: boolean;
    usuario_origen_id: string;
    perfil?: {
      username: string;
      foto_perfil: string | null;
    };
  };
  onNotificationRead: () => void;
}

export default function NotificationItem({ notification, onNotificationRead }: NotificationItemProps) {
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;

  const handleNotificationPress = async () => {
    try {
      // 1. Marcar como leída
      const { error } = await supabase
        .from('notificacion')
        .update({ leido: true })
        .eq('id', notification.id);

      if (error) throw error;

      // 2. Obtener la configuración de redirección
      const redirectConfig = NOTIFICATION_REDIRECTS[notification.tipo_notificacion];
      if (!redirectConfig) return;

      // 3. Obtener los parámetros y redirigir
      const params = await redirectConfig.getParams(notification);
      if (Object.keys(params).length > 0) {
        router.push({
          pathname: redirectConfig.route as any,
          params
        });
      }

      onNotificationRead();
    } catch (error) {
      console.error('Error al procesar la notificación:', error);
    }
  };

  const handleLongPress = () => {
    Alert.alert(
      "Eliminar notificación",
      "¿Estás seguro de que quieres eliminar esta notificación?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('notificacion')
                .delete()
                .eq('id', notification.id);

              if (error) throw error;
              onNotificationRead(); // Actualizar la lista
            } catch (error) {
              console.error('Error al eliminar notificación:', error);
              Alert.alert('Error', 'No se pudo eliminar la notificación');
            }
          }
        }
      ]
    );
  };

  // No renderizar el componente si es una notificación de colaboración
  if (['solicitud_colaboracion', 'colaboracion_aceptada', 'colaboracion_rechazada'].includes(notification.tipo_notificacion)) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={handleNotificationPress}
      onLongPress={handleLongPress}
      delayLongPress={500}
      className={`bg-white p-2 rounded-lg mb-2 shadow ${
        !notification.leido ? 'border-l-4 border-primary-500' : 'opacity-75'
      }`}
    >
      <View className="flex-row items-center">
        <Image
          source={{
            uri: notification.perfil?.foto_perfil
              ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${notification.perfil.foto_perfil}`
              : 'https://via.placeholder.com/40'
          }}
          className="w-10 h-10 rounded-full mr-3"
        />
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className={`font-bold ${!notification.leido ? 'text-primary-600' : 'text-gray-700'}`}>
              {notification.perfil?.username || 'Usuario'}
            </Text>
            {notification.leido && (
              <Text className="text-xs text-gray-500">Leído</Text>
            )}
          </View>
          <Text className={`text-sm ${!notification.leido ? 'text-gray-800' : 'text-gray-600'}`}>
            {notification.mensaje}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
} 