import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import CollaborationNotification from '@/components/CollaborationNotification';
import AcceptedCollaborationNotification from '@/components/AcceptedCollaborationNotification';
import Constants from 'expo-constants';

interface Notificacion {
  id: number;
  tipo_notificacion: string;
  usuario_origen_id: string;
  contenido_id: number;
  mensaje: string;
  leido: boolean;
  created_at: string;
  perfil?: {
    username: string;
    foto_perfil: string | null;
  };
}

export default function NotificacionesScreen() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;

  useEffect(() => {
    getCurrentUser();
    fetchNotificaciones();
    suscribirseANotificaciones();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const suscribirseANotificaciones = () => {
    const subscription = supabase
      .channel('notificaciones_cambios')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificacion'
        },
        () => {
          fetchNotificaciones();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const fetchNotificaciones = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notificacion')
        .select(`
          *,
          perfil:usuario_origen_id (
            username,
            foto_perfil
          )
        `)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotificaciones(data || []);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchNotificaciones();
  };

  const renderNotificacion = ({ item }: { item: Notificacion }) => {
    if (!currentUserId) return null;

    switch (item.tipo_notificacion) {
      case 'solicitud_colaboracion':
        return (
          <CollaborationNotification
            notification={item}
            onRespond={fetchNotificaciones}
            currentUserId={currentUserId}
          />
        );
      case 'colaboracion_aceptada':
        return (
          <AcceptedCollaborationNotification
            notification={item}
            currentUserId={currentUserId}
            onRespond={fetchNotificaciones}
          />
        );
      case 'colaboracion_rechazada':
        return (
          <View className="bg-white p-4 rounded-lg mb-2 shadow">
            <Text className="font-bold text-red-600">
              Colaboración rechazada
            </Text>
            <Text>{item.mensaje}</Text>
          </View>
        );
      case 'like_cancion':
        return (
          <View className="bg-white p-4 rounded-lg mb-2 shadow">
            <View className="flex-row items-center">
              <Image
                source={{
                  uri: item.perfil?.foto_perfil
                    ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${item.perfil.foto_perfil}`
                    : 'https://via.placeholder.com/40'
                }}
                className="w-10 h-10 rounded-full mr-3"
              />
              <View className="flex-1">
                <Text className="font-bold text-primary-600">
                  {item.perfil?.username || 'Usuario'}
                </Text>
                <Text className="text-sm text-gray-600">
                  {item.mensaje}
                </Text>
              </View>
            </View>
          </View>
        );

      case 'like_comentario_cancion':
        return (
          <View className="bg-white p-4 rounded-lg mb-2 shadow">
            <View className="flex-row items-center">
              <Image
                source={{
                  uri: item.perfil?.foto_perfil
                    ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${item.perfil.foto_perfil}`
                    : 'https://via.placeholder.com/40'
                }}
                className="w-10 h-10 rounded-full mr-3"
              />
              <View className="flex-1">
                <Text className="font-bold text-primary-600">
                  {item.perfil?.username || 'Usuario'}
                </Text>
                <Text className="text-sm text-gray-600">
                  {item.mensaje}
                </Text>
              </View>
            </View>
          </View>
        );
      case 'like':
        return (
          <View className="bg-white p-4 rounded-lg mb-2 shadow">
            <View className="flex-row items-center">
              <Image
                source={{
                  uri: item.perfil?.foto_perfil
                    ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${item.perfil.foto_perfil}`
                    : 'https://via.placeholder.com/40'
                }}
                className="w-10 h-10 rounded-full mr-3"
              />
              <View className="flex-1">
                <Text className="font-bold text-primary-600">
                  {item.perfil?.username || 'Usuario'}
                </Text>
                <Text className="text-sm text-gray-600">
                  {item.mensaje}
                </Text>
              </View>
            </View>
          </View>
        );
      case 'comentario_cancion':
        return (
          <View className="bg-white p-4 rounded-lg mb-2 shadow">
            <View className="flex-row items-center">
              <Image
                source={{
                  uri: item.perfil?.foto_perfil
                    ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${item.perfil.foto_perfil}`
                    : 'https://via.placeholder.com/40'
                }}
                className="w-10 h-10 rounded-full mr-3"
              />
              <View className="flex-1">
                <Text className="font-bold text-primary-600">
                  {item.perfil?.username || 'Usuario'}
                </Text>
                <Text className="text-sm text-gray-600">
                  {item.mensaje}
                </Text>
              </View>
            </View>
          </View>
        );
      case 'match':
        return (
          <View className="bg-white p-4 rounded-lg mb-2 shadow">
            <View className="flex-row items-center">
              <Image
                source={{
                  uri: item.perfil?.foto_perfil
                    ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${item.perfil.foto_perfil}`
                    : 'https://via.placeholder.com/40'
                }}
                className="w-10 h-10 rounded-full mr-3"
              />
              <View className="flex-1">
                <Text className="font-bold text-primary-600">
                  {item.perfil?.username || 'Usuario'}
                </Text>
                <Text className="text-sm text-gray-600">
                  {item.mensaje}
                </Text>
              </View>
            </View>
          </View>
        );
      default:
        return (
          <View className="bg-white p-4 rounded-lg mb-2 shadow">
            <Text>{item.mensaje}</Text>
          </View>
        );
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#6D29D2" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      <FlatList
        data={notificaciones}
        renderItem={renderNotificacion}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={["#6D29D2"]}
          />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center p-4">
            <Text className="text-gray-500 text-center">
              No tienes notificaciones
            </Text>
          </View>
        }
      />
    </View>
  );
}
