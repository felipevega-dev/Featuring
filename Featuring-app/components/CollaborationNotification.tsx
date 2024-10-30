import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import CollaborationRatingModal from './CollaborationRatingModal';

interface CollaborationNotificationProps {
  notification: {
    id: number;
    usuario_origen_id: string;
    contenido_id: number;
    mensaje: string;
    perfil?: {
      username: string;
      foto_perfil: string | null;
    };
  };
  onRespond: () => void;
  currentUserId: string;
}

export default function CollaborationNotification({
  notification,
  onRespond,
  currentUserId,
}: CollaborationNotificationProps) {
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [colaboracionId, setColaboracionId] = useState<number | null>(null);
  const [colaboracionEstado, setColaboracionEstado] = useState<string | null>(null);
  const [yaValorado, setYaValorado] = useState(false);
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;

  useEffect(() => {
    verificarEstadoColaboracion();
  }, [notification.contenido_id]);

  const verificarEstadoColaboracion = async () => {
    try {
      // Obtener estado de la colaboración
      const { data: colaboracionData, error: colaboracionError } = await supabase
        .from('colaboracion')
        .select('id, estado')
        .eq('cancion_id', notification.contenido_id)
        .single();

      if (colaboracionError) throw colaboracionError;

      if (colaboracionData) {
        setColaboracionId(colaboracionData.id);
        setColaboracionEstado(colaboracionData.estado);

        // Verificar si ya existe una valoración
        const { data: valoracionData, error: valoracionError } = await supabase
          .from('valoracion_colaboracion')
          .select('id')
          .eq('colaboracion_id', colaboracionData.id)
          .eq('usuario_id', currentUserId)
          .single();

        if (!valoracionError && valoracionData) {
          setYaValorado(true);
        }
      }
    } catch (error) {
      console.error('Error al verificar estado:', error);
    }
  };

  const handleAccept = async () => {
    try {
      // Actualizar el estado de la colaboración
      const { data: colaboracionData, error: collaborationError } = await supabase
        .from('colaboracion')
        .update({ estado: 'aceptada' })
        .eq('cancion_id', notification.contenido_id)
        .eq('usuario_id2', currentUserId)
        .select()
        .single();

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
          usuario_origen_id: currentUserId
        });

      Alert.alert('Éxito', 'Has aceptado la colaboración');
      
      // Mostrar el modal de valoración
      if (colaboracionData) {
        setColaboracionId(colaboracionData.id);
        setIsRatingModalVisible(true);
      }
      
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
        .eq('usuario_id2', currentUserId);

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
          usuario_origen_id: currentUserId
        });

      Alert.alert('Notificación', 'Has rechazado la colaboración');
      onRespond();
    } catch (error) {
      console.error('Error al rechazar la colaboración:', error);
      Alert.alert('Error', 'No se pudo procesar tu respuesta');
    }
  };

  const renderButtons = () => {
    if (yaValorado || colaboracionEstado === 'aceptada' || colaboracionEstado === 'rechazada') {
      return (
        <View className="bg-gray-100 p-2 rounded">
          <Text className="text-center text-gray-600">
            {yaValorado ? 'Ya has valorado esta colaboración' : 
             colaboracionEstado === 'aceptada' ? 'Colaboración aceptada' : 
             'Colaboración rechazada'}
          </Text>
        </View>
      );
    }

    return (
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
    );
  };

  return (
    <>
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
        {renderButtons()}
      </View>

      {colaboracionId && (
        <CollaborationRatingModal
          isVisible={isRatingModalVisible}
          onClose={() => {
            setIsRatingModalVisible(false);
            setYaValorado(true);
          }}
          colaboracionId={colaboracionId}
          colaboradorUsername={notification.perfil?.username || 'Usuario'}
          usuarioId={currentUserId}
        />
      )}
    </>
  );
} 