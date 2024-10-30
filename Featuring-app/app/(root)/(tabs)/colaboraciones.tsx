import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CollaborationRatingModal from '@/components/CollaborationRatingModal';

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
  } | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchColaboraciones();
    }
  }, [currentUserId]);

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
          cancion:cancion_id(titulo, caratula),
          perfil:usuario_id(username, foto_perfil),
          perfil2:usuario_id2(username, foto_perfil),
          valoraciones:valoracion_colaboracion(valoracion)
        `)
        .or(`usuario_id.eq.${currentUserId},usuario_id2.eq.${currentUserId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const colaboracionesFormateadas = data.map(col => ({
        ...col,
        valoracion: col.valoraciones?.[0]?.valoracion
      }));

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

  const checkIfRated = async (colaboracionId: number) => {
    try {
      const { data, error } = await supabase
        .from('valoracion_colaboracion')
        .select('id')
        .eq('colaboracion_id', colaboracionId)
        .eq('usuario_id', currentUserId)
        .single();

      return !error && data;
    } catch (error) {
      console.error('Error al verificar valoración:', error);
      return false;
    }
  };

  const RenderColaboracionItem = ({ item }: RenderItemProps) => {
    const [hasRated, setHasRated] = useState(false);
    const isCreator = item.usuario_id === currentUserId;
    const otherUserProfile = isCreator ? item.perfil2 : item.perfil;
    const otherUserId = isCreator ? item.usuario_id2 : item.usuario_id;

    useEffect(() => {
      const checkRating = async () => {
        const rated = await checkIfRated(item.id);
        setHasRated(!!rated);
      };
      checkRating();
    }, [item.id]);

    return (
      <View className="bg-white p-4 rounded-lg mb-3 shadow">
        <View className="flex-row items-center mb-3">
          <Image
            source={{ uri: item.cancion.caratula }}
            className="w-12 h-12 rounded"
          />
          <View className="ml-3 flex-1">
            <Text className="font-bold text-lg">{item.cancion.titulo}</Text>
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

        {item.estado === 'aceptada' && !hasRated && (
          <TouchableOpacity
            onPress={() => {
              setSelectedColaboracion({
                id: item.id,
                otherUsername: otherUserProfile.username
              });
              setIsRatingModalVisible(true);
            }}
            className="bg-primary-500 p-2 rounded mt-2"
          >
            <Text className="text-white text-center">Valorar colaboración</Text>
          </TouchableOpacity>
        )}

        {hasRated && (
          <Text className="text-gray-500 text-center mt-2">
            Ya has valorado esta colaboración
          </Text>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#6D29D2" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100 p-4">
      <FlatList
        data={colaboraciones}
        renderItem={({ item }) => <RenderColaboracionItem item={item} />}
        keyExtractor={(item) => item.id.toString()}
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
            // Refrescar la lista para actualizar el estado de las valoraciones
            fetchColaboraciones();
          }}
          colaboracionId={selectedColaboracion.id}
          colaboradorUsername={selectedColaboracion.otherUsername}
          usuarioId={currentUserId || ''}
        />
      )}
    </View>
  );
} 