import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';

interface CollaborationNotificationProps {
  notification: {
    id: number;
    usuario_origen_id: string;
    contenido_id: number; // cancion_id
    mensaje: string;
    perfil?: {
      username: string;
      foto_perfil: string | null;
    };
  };
  onRespond: () => void;
}

export default function CollaborationNotification({
  notification,
  onRespond,
}: CollaborationNotificationProps) {
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;

  const handleAccept = async () => {
    try {
      // Actualizar el estado de la colaboración
      const { error: collaborationError } = await supabase
        .from('colaboracion')
        .update({ estado: 'aceptada' })
        .eq('cancion_id', notification.contenido_id)
        .eq('usuario_id', notification.usuario_origen_id);

      if (collaborationError) throw collaborationError;

      // Marcar la notificación como leída
      const { error: notificationError } = await supabase
        .from('notificacion')
        .update({ leido: true })
        .eq('id', notification.id);

      if (notificationError) throw notificationError;

      // Crear notificación de respuesta
      await supabase
        .from('notificacion')
        .insert({
          usuario_id: notification.usuario_origen_id,
          tipo_notificacion: 'colaboracion_aceptada',
          contenido_id: notification.contenido_id,
          mensaje: 'Tu solicitud de colaboración ha sido aceptada',
          leido: false,
        });

      Alert.alert('Éxito', 'Has aceptado la colaboración');
      onRespond();
    } catch (error) {
      console.error('Error al aceptar la colaboración:', error);
      Alert.alert('Error', 'No se pudo procesar tu respuesta');
    }
  };

  const handleReject = async () => {
    try {
      // Actualizar el estado de la colaboración
      const { error: collaborationError } = await supabase
        .from('colaboracion')
        .update({ estado: 'rechazada' })
        .eq('cancion_id', notification.contenido_id)
        .eq('usuario_id', notification.usuario_origen_id);

      if (collaborationError) throw collaborationError;

      // Marcar la notificación como leída
      const { error: notificationError } = await supabase
        .from('notificacion')
        .update({ leido: true })
        .eq('id', notification.id);

      if (notificationError) throw notificationError;

      // Crear notificación de respuesta
      await supabase
        .from('notificacion')
        .insert({
          usuario_id: notification.usuario_origen_id,
          tipo_notificacion: 'colaboracion_rechazada',
          contenido_id: notification.contenido_id,
          mensaje: 'Tu solicitud de colaboración ha sido rechazada',
          leido: false,
        });

      Alert.alert('Notificación', 'Has rechazado la colaboración');
      onRespond();
    } catch (error) {
      console.error('Error al rechazar la colaboración:', error);
      Alert.alert('Error', 'No se pudo procesar tu respuesta');
    }
  };

  return (
    <View className="bg-white p-4 rounded-lg mb-2 shadow">
      <View className="flex-row items-center mb-2">
        <Image
          source={{
            uri: notification.perfil?.foto_perfil
              ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${notification.perfil.foto_perfil}`
              : 'https://via.placeholder.com/40'
          }}
          className="w-10 h-10 rounded-full mr-3"
        />
        <View className="flex-1">
          <Text className="font-bold">
            {notification.perfil?.username || 'Usuario'}
          </Text>
          <Text className="text-sm text-gray-600">{notification.mensaje}</Text>
        </View>
      </View>
      <View className="flex-row justify-end space-x-2">
        <TouchableOpacity
          onPress={handleReject}
          className="bg-red-500 px-4 py-2 rounded"
        >
          <Text className="text-white">Rechazar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleAccept}
          className="bg-primary-500 px-4 py-2 rounded"
        >
          <Text className="text-white">Aceptar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 