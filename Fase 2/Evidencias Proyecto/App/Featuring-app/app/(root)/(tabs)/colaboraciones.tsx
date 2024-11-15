import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CollaborationRatingModal from '@/components/CollaborationRatingModal';
import { useCollaboration } from '@/contexts/CollaborationContext';

interface Colaboracion {
  id: number;
  cancion_id: number;
  usuario_id: string;
  usuario_id2: string;
  estado: string;
  created_at: string;
  cancion: {
    titulo: string;
    caratula: string;
  };
  perfil: {
    username: string;
    foto_perfil: string | null;
  };
  perfil2: {
    username: string;
    foto_perfil: string | null;
  };
  valoracion?: number;
}

interface RenderItemProps {
  item: Colaboracion;
}

export default function ColaboracionesScreen() {
  const [colaboraciones, setColaboraciones] = useState<Colaboracion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [selectedColaboracion, setSelectedColaboracion] = useState<{
    id: number;
    otherUsername: string;
    otherUserId: string;
  } | null>(null);
  const { updatePendingCount } = useCollaboration();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchColaboraciones();
    }
  }, [currentUserId]);

  useEffect(() => {
    updatePendingCount();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchColaboraciones = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('colaboracion')
        .select(`
          *,
          cancion:cancion_id!inner(titulo, caratula),
          perfil:usuario_id!inner(username, foto_perfil),
          perfil2:usuario_id2!inner(username, foto_perfil),
          valoraciones:valoracion_colaboracion(valoracion)
        `)
        .or(`usuario_id.eq.${currentUserId},usuario_id2.eq.${currentUserId}`)
        .order('estado', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const colaboracionesFormateadas = data
        .filter(col => col.cancion && col.perfil && col.perfil2)
        .map(col => ({
          ...col,
          valoracion: col.valoraciones?.[0]?.valoracion
        }))
        .sort((a, b) => {
          const orden = { pendiente: 0, aceptada: 1, rechazada: 2 };
          return (orden[a.estado as keyof typeof orden] - orden[b.estado as keyof typeof orden]) ||
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

      setColaboraciones(colaboracionesFormateadas);
    } catch (error) {
      console.error('Error al cargar colaboraciones:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'aceptada':
        return 'bg-green-100 text-green-800';
      case 'rechazada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const checkIfRated = async (colaboracionId: number, otherUserId: string) => {
    try {
      // Verificar si existe alguna valoración previa entre estos dos usuarios en cualquier dirección
      const { data: valoracionExistente, error } = await supabase
        .from('valoracion_colaboracion')
        .select('id')
        .or(
          `and(usuario_id.eq.${currentUserId},usuario_valorado_id.eq.${otherUserId}),` +
          `and(usuario_id.eq.${otherUserId},usuario_valorado_id.eq.${currentUserId})`
        )
        .limit(1);

      if (error) {
        console.error('Error al verificar valoración:', error);
        return false;
      }

      // Si hay datos, significa que ya existe una valoración entre estos usuarios
      return valoracionExistente && valoracionExistente.length > 0;
    } catch (error) {
      console.error('Error al verificar valoración:', error);
      return false;
    }
  };

  const handleAcceptCollab = async (colaboracionId: number) => {
    try {
      const { error: updateError } = await supabase
        .from('colaboracion')
        .update({ estado: 'aceptada' })
        .eq('id', colaboracionId);

      if (updateError) throw updateError;

      // Actualizar el estado local y el contador de notificaciones
      await fetchColaboraciones();
      await updatePendingCount();

      Alert.alert('Éxito', 'Colaboración aceptada correctamente');
    } catch (error) {
      console.error('Error al aceptar colaboración:', error);
      Alert.alert('Error', 'No se pudo aceptar la colaboración');
    }
  };

  const handleRejectCollab = async (colaboracionId: number) => {
    try {
      const { error: updateError } = await supabase
        .from('colaboracion')
        .update({ estado: 'rechazada' })
        .eq('id', colaboracionId);

      if (updateError) throw updateError;

      // Actualizar el estado local y el contador de notificaciones
      await fetchColaboraciones();
      await updatePendingCount();

      Alert.alert('Éxito', 'Colaboración rechazada correctamente');
    } catch (error) {
      console.error('Error al rechazar colaboración:', error);
      Alert.alert('Error', 'No se pudo rechazar la colaboración');
    }
  };

  const RenderColaboracionItem = ({ item }: RenderItemProps) => {
    const [hasRated, setHasRated] = useState(false);
    const isCreator = item.usuario_id === currentUserId;
    const otherUserProfile = isCreator ? item.perfil2 : item.perfil;
    const otherUserId = isCreator ? item.usuario_id2 : item.usuario_id;

    useEffect(() => {
      const checkRating = async () => {
        const rated = await checkIfRated(item.id, otherUserId);
        setHasRated(!!rated);
      };
      checkRating();
    }, [item.id, otherUserId]);

    if (!item.cancion || !item.perfil || !item.perfil2) {
      return null;
    }

    return (
      <View className={`bg-white p-4 rounded-lg mb-3 shadow ${
        item.estado === 'pendiente' ? 'border-l-4 border-yellow-500' : ''
      }`}>
        <View className="flex-row items-center mb-3">
          <Image
            source={{ 
              uri: item.cancion?.caratula || 'https://via.placeholder.com/50'
            }}
            className="w-12 h-12 rounded"
          />
          <View className="ml-3 flex-1">
            <Text className="font-bold text-lg">{item.cancion?.titulo || 'Canción no disponible'}</Text>
            <View className={`self-start px-2 py-1 rounded mt-1 ${getEstadoColor(item.estado)}`}>
              <Text className="text-xs capitalize">{item.estado}</Text>
            </View>
          </View>
        </View>

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Image
              source={{
                uri: isCreator 
                  ? (item.perfil.foto_perfil
                      ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${item.perfil.foto_perfil}`
                      : 'https://via.placeholder.com/30')
                  : (item.perfil2.foto_perfil
                      ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${item.perfil2.foto_perfil}`
                      : 'https://via.placeholder.com/30')
              }}
              className="w-8 h-8 rounded-full"
            />
            <Text className="ml-2 text-secondary-500 font-bold">{isCreator ? item.perfil.username : item.perfil2.username}</Text>
          </View>

          <Text className="text-primary-500 font-bold mx-2">FEAT.</Text>

          <TouchableOpacity 
            onPress={() => router.push({
              pathname: "/public-profile/[id]",
              params: { id: otherUserId }
            })}
            className="flex-row items-center"
          >
            <Text className="mr-2">{otherUserProfile.username}</Text>
            <Image
              source={{
                uri: otherUserProfile.foto_perfil
                  ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${otherUserProfile.foto_perfil}`
                  : 'https://via.placeholder.com/30'
              }}
              className="w-8 h-8 rounded-full"
            />
          </TouchableOpacity>
        </View>

        {item.valoracion && (
          <View className="mt-2 flex-row items-center justify-end">
            <Text className="text-sm text-gray-600 mr-1">Tu valoración:</Text>
            <View className="flex-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name="star"
                  size={16}
                  color={star <= item.valoracion! ? "#FFD700" : "#E5E7EB"}
                />
              ))}
            </View>
          </View>
        )}

        {item.estado === 'aceptada' && (
          <>
            {!hasRated && !item.valoracion && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedColaboracion({
                    id: item.id,
                    otherUsername: otherUserProfile.username,
                    otherUserId: otherUserId
                  });
                  setIsRatingModalVisible(true);
                }}
                className="bg-primary-500 p-2 rounded mt-2"
              >
                <Text className="text-white text-center">Valorar colaboración</Text>
              </TouchableOpacity>
            )}

            {(hasRated || item.valoracion) && (
              <Text className="text-gray-500 text-center mt-2">
                Ya has valorado esta colaboración
              </Text>
            )}
          </>
        )}

        {item.estado === 'pendiente' && item.usuario_id2 === currentUserId && (
          <View className="flex-row justify-end space-x-2 mt-2">
            <TouchableOpacity
              onPress={() => handleRejectCollab(item.id)}
              className="bg-red-500 px-4 py-2 rounded"
            >
              <Text className="text-white">Rechazar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleAcceptCollab(item.id)}
              className="bg-primary-500 px-4 py-2 rounded"
            >
              <Text className="text-white">Aceptar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const handleResponderColaboracion = async () => {
    try {
      // ... lógica existente de respuesta ...

      // Actualizar el contador después de responder
      await updatePendingCount();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#6D29D2" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header fijo */}
      <View className="bg-primary-500 py-4 px-4">
        <Text className="text-xl font-bold text-white text-center">
          Historial de Colaboraciones
        </Text>
      </View>

      {/* Contenido scrolleable con padding inferior para evitar sobreposición */}
      <FlatList
        data={colaboraciones}
        renderItem={({ item }) => <RenderColaboracionItem item={item} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 50, // Padding extra para evitar que la última tarjeta se corte
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchColaboraciones();
            }}
            colors={["#6D29D2"]}
          />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center p-4">
            <Text className="text-gray-500 text-center">
              No tienes colaboraciones aún
            </Text>
          </View>
        }
      />

      {selectedColaboracion && (
        <CollaborationRatingModal
          isVisible={isRatingModalVisible}
          onClose={() => {
            setIsRatingModalVisible(false);
            setSelectedColaboracion(null);
            fetchColaboraciones();
          }}
          colaboracionId={selectedColaboracion.id}
          colaboradorUsername={selectedColaboracion.otherUsername}
          colaboradorId={selectedColaboracion.otherUserId}
          usuarioId={currentUserId || ''}
        />
      )}
    </View>
  );
} 