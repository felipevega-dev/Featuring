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
      // Primero obtener el ID de la colaboración
      const { data: colaboracionData, error: colaboracionError } = await supabase
        .from('colaboracion')
        .select('id')
        .eq('cancion_id', notification.contenido_id)
        .eq('usuario_id2', currentUserId)
        .single();

      if (colaboracionError) throw colaboracionError;

      // Verificar si ya existe una valoración previa
      const { data: valoracionPrevia, error: valoracionError } = await supabase
        .from('valoracion_colaboracion')
        .select('id')
        .eq('usuario_id', currentUserId)
        .eq('colaboracion_id', colaboracionData.id)
        .single();

      // Actualizar el estado de la colaboración
      const { data: updatedColaboracion, error: collaborationError } = await supabase
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
      
      // Mostrar el modal de valoración solo si no existe una valoración previa
      if (!valoracionPrevia && updatedColaboracion) {
        setColaboracionId(updatedColaboracion.id);
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
      // 1. Obtener información de la canción
      const { data: cancionData, error: cancionError } = await supabase
        .from('cancion')
        .select('*')
        .eq('id', notification.contenido_id)
        .single();

      if (cancionError) throw cancionError;

      // 2. Actualizar el estado de la colaboración a 'rechazada' en lugar de eliminarla
      const { error: collaborationError } = await supabase
        .from('colaboracion')
        .update({ estado: 'rechazada' })
        .eq('cancion_id', notification.contenido_id)
        .eq('usuario_id2', currentUserId);

      if (collaborationError) throw collaborationError;

      // 3. Eliminar archivos de la canción
      if (cancionData) {
        if (cancionData.archivo_audio) {
          const audioFileName = cancionData.archivo_audio.split("/").pop();
          if (audioFileName) {
            await supabase.storage
              .from("canciones")
              .remove([`${cancionData.usuario_id}/${audioFileName}`]);
          }
        }

        if (cancionData.caratula) {
          const caratulaFileName = cancionData.caratula.split("/").pop();
          if (caratulaFileName) {
            await supabase.storage
              .from("caratulas")
              .remove([`${cancionData.usuario_id}/${caratulaFileName}`]);
          }
        }
      }

      // 4. Eliminar la canción
      const { error: deleteCancionError } = await supabase
        .from('cancion')
        .delete()
        .eq('id', notification.contenido_id);

      if (deleteCancionError) throw deleteCancionError;

      // 5. Marcar la notificación como leída
      const { error: notificationError } = await supabase
        .from('notificacion')
        .update({ leido: true })
        .eq('id', notification.id);

      if (notificationError) throw notificationError;

      // 6. Crear notificación de rechazo
      await supabase
        .from('notificacion')
        .insert({
          usuario_id: notification.usuario_origen_id,
          tipo_notificacion: 'colaboracion_rechazada',
          contenido_id: notification.contenido_id,
          mensaje: 'Tu solicitud de colaboración ha sido rechazada.',
          leido: false,
          usuario_origen_id: currentUserId
        });

      Alert.alert('Notificación', 'Has rechazado la colaboración.');
      onRespond();
    } catch (error) {
      console.error('Error al rechazar la colaboración:', error);
      Alert.alert('Error', 'No se pudo procesar tu respuesta');
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
              onRespond(); // Actualizar la lista
            } catch (error) {
              console.error('Error al eliminar notificación:', error);
              Alert.alert('Error', 'No se pudo eliminar la notificación');
            }
          }
        }
      ]
    );
  };

  const renderButtons = () => {
    if (yaValorado || colaboracionEstado === 'aceptada') {
      return (
        <View className="bg-yellow-300 p-2 rounded">
          <Text className="text-center text-yellow-600">
            {yaValorado ? 'Ya has valorado a este usuario' : 'Colaboración aceptada'}
          </Text>
        </View>
      );
    }


    if (colaboracionEstado === 'rechazada') {
      return (
        <View className="bg-red-100 p-2 rounded">
          <Text className="text-center text-red-600">
            Has rechazado esta colaboración
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
    <TouchableOpacity
      onLongPress={handleLongPress}
      delayLongPress={500}
      activeOpacity={1}
    >
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
            <Text className="font-bold text-primary-600">
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
    </TouchableOpacity>
  );
} 