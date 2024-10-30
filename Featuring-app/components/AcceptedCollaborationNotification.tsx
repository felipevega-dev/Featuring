import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import CollaborationRatingModal from './CollaborationRatingModal';

interface AcceptedCollaborationNotificationProps {
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
  currentUserId: string;
  onRespond: () => void;
}

export default function AcceptedCollaborationNotification({
  notification,
  currentUserId,
  onRespond,
}: AcceptedCollaborationNotificationProps) {
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [colaboracionId, setColaboracionId] = useState<number | null>(null);
  const [yaValorado, setYaValorado] = useState(false);
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;

  useEffect(() => {
    verificarEstadoValoracion();
  }, []);

  const verificarEstadoValoracion = async () => {
    try {
      // Primero verificar si la canción aún existe
      const { data: cancionData, error: cancionError } = await supabase
        .from('cancion')
        .select('id')
        .eq('id', notification.contenido_id)
        .single();

      if (cancionError || !cancionData) {
        // Si la canción no existe, eliminar la notificación
        await supabase
          .from('notificacion')
          .delete()
          .eq('id', notification.id);
        
        onRespond(); // Actualizar la lista de notificaciones
        return;
      }

      // Obtener la colaboración
      const { data: colaboracionData, error: colaboracionError } = await supabase
        .from('colaboracion')
        .select('id, usuario_id, usuario_id2')
        .eq('cancion_id', notification.contenido_id)
        .single();

      if (colaboracionError) throw colaboracionError;

      if (colaboracionData) {
        setColaboracionId(colaboracionData.id);

        // Obtener el ID del otro usuario
        const otroUsuarioId = colaboracionData.usuario_id === currentUserId 
          ? colaboracionData.usuario_id2 
          : colaboracionData.usuario_id;

        // Verificar si ya existe una valoración entre estos usuarios
        const { data: valoracionData, error: valoracionError } = await supabase
          .from('valoracion_colaboracion')
          .select('id')
          .eq('usuario_id', currentUserId)
          .in('colaboracion_id', (
            supabase
              .from('colaboracion')
              .select('id')
              .or(`usuario_id.eq.${currentUserId},usuario_id2.eq.${currentUserId}`)
              .or(`usuario_id.eq.${otroUsuarioId},usuario_id2.eq.${otroUsuarioId}`)
          ))
          .single();

        if (!valoracionError && valoracionData) {
          setYaValorado(true);
        }
      }
    } catch (error) {
      console.error('Error al verificar valoración:', error);
    }
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
        
        {!yaValorado && colaboracionId ? (
          <TouchableOpacity
            onPress={() => setIsRatingModalVisible(true)}
            className="bg-primary-500 p-2 rounded mt-2"
          >
            <Text className="text-white text-center">Valorar colaboración</Text>
          </TouchableOpacity>
        ) : (
          <Text className="text-yellow-500 text-center mt-2">
            Ya has valorado a este colaborador
          </Text>
        )}
      </View>

      {colaboracionId && (
        <CollaborationRatingModal
          isVisible={isRatingModalVisible}
          onClose={() => {
            setIsRatingModalVisible(false);
            setYaValorado(true);
            onRespond();
          }}
          colaboracionId={colaboracionId}
          colaboradorUsername={notification.perfil?.username || 'Usuario'}
          usuarioId={currentUserId}
        />
      )}
    </>
  );
} 