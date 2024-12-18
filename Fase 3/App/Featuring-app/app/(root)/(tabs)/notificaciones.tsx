import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert
} from 'react-native';
import { supabase } from '@/lib/supabase';
import CollaborationNotification from '@/components/CollaborationNotification';
import AcceptedCollaborationNotification from '@/components/AcceptedCollaborationNotification';
import NotificationItem from '@/components/NotificationItem';
import Constants from 'expo-constants';

interface NotificationType {
  id: number;
  name: string;
}

interface Notificacion {
  id: number;
  tipo_notificacion: NotificationType;
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

  const handleMarkAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar si hay notificaciones sin leer
      const { count } = await supabase
        .from('notificacion')
        .select('*', { count: 'exact' })
        .eq('usuario_id', user.id)
        .eq('leido', false);

      if (!count) {
        Alert.alert('Info', 'No hay notificaciones pendientes por leer');
        return;
      }

      // Actualizar todas las notificaciones como leídas
      const { error } = await supabase
        .from('notificacion')
        .update({ leido: true })
        .eq('usuario_id', user.id)
        .eq('leido', false);

      if (error) throw error;

      // Actualizar la lista de notificaciones
      fetchNotificaciones();
      Alert.alert('Éxito', 'Todas las notificaciones han sido marcadas como leídas');
    } catch (error) {
      console.error('Error al marcar notificaciones como leídas:', error);
      Alert.alert('Error', 'No se pudieron marcar las notificaciones como leídas');
    }
  };

  const renderNotificacion = ({ item }: { item: Notificacion }) => {
    if (!currentUserId) return null;

    switch (item.tipo_notificacion.name) {
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
      default:
        return (
          <View className="bg-white rounded-lg mb-1 shadow">
            <NotificationItem
              notification={item}
              onNotificationRead={fetchNotificaciones}
            />
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
      <View className="bg-primary-500 py-4 px-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-xl font-bold text-white">
            Notificaciones
          </Text>
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            className="bg-secondary-500 px-3 py-1 rounded-full"
          >
            <Text className="text-white font-JakartaMedium text-sm">
              Marcar todo como leído
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={notificaciones}
        renderItem={({ item }) => (
          <View className="bg-white rounded-lg mb-1 shadow">
            <NotificationItem
              notification={item}
              onNotificationRead={fetchNotificaciones}
            />
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={["#6D29D2"]}
          />
        }
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 55  // Añadido padding extra para evitar que la última notificación se tape
        }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center p-4">
            <Text className="text-gray-500">No hay notificaciones</Text>
          </View>
        }
      />
    </View>
  );
}
