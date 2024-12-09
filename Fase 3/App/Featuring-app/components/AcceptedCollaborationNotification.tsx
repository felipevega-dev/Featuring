import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
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
      const { data: colaboracionData, error: colaboracionError } = await supabase
        .from('colaboracion')
        .select('id, usuario_id, usuario_id2, cancion_id')
        .eq('cancion_id', notification.contenido_id)
        .single();

      if (colaboracionError) {
        console.error('Error al obtener colaboración:', colaboracionError);
        return;
      }

      if (colaboracionData) {
        setColaboracionId(colaboracionData.id);

        // Verificar si ya existe una valoración de este usuario
        const { data: valoracionData, error: valoracionError } = await supabase
          .from('valoracion_colaboracion')
          .select('id')
          .eq('usuario_id', currentUserId)
          .eq('colaboracion_id', colaboracionData.id)
          .single();

        if (!valoracionError && valoracionData) {
          setYaValorado(true);
        }
      }
    } catch (error) {
      console.error('Error al verificar valoración:', error);
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
            <Text className="text-white text-center">
              Valorar colaboración
            </Text>
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
          colaboradorId={notification.usuario_origen_id}
          usuarioId={currentUserId}
        />
      )}
    </TouchableOpacity>
  );
} 