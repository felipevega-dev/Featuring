import React, { useState, useEffect } from 'react';
import { FlatList, Text, View, RefreshControl, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { useNotification } from '@/contexts/NotificationContext';

interface Notificacion {
  id: string;
  usuario_id: string;
  tipo_notificacion: string;
  created_at: string;
  contenido_id: string | null;
  usuario_origen_id: string | null;
  perfil: {
    username: string;
  } | null;
}

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { updateUnreadCount } = useNotification();

  const fetchNotificaciones = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('notificacion')
        .select(`
          *,
          perfil:usuario_origen_id (username)
        `)
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notificaciones:', error);
      } else {
        console.log('Notificaciones obtenidas:', JSON.stringify(data, null, 2));
        setNotificaciones(data);

        const { error: updateError } = await supabase
          .from('notificacion')
          .update({ leido: true })
          .eq('usuario_id', user.id)
          .eq('leido', false);

        if (updateError) {
          console.error('Error al marcar notificaciones como leídas:', updateError);
        } else {
          console.log('Notificaciones marcadas como leídas');
          updateUnreadCount();
        }
      }
    } else {
      console.log('No se encontró usuario autenticado');
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchNotificaciones().then(() => setRefreshing(false));
  }, []);

  const renderNotificacion = ({ item }: { item: Notificacion }) => (
    <View className="bg-gray-100 p-3 mb-2 rounded-lg">
      <Text className="font-JakartaSemiBold text-sm">
        {item.tipo_notificacion === 'like' && item.perfil
          ? `${item.perfil.username} te ha dado like, ¡conecta!`
          : item.tipo_notificacion === 'match' && item.perfil
          ? `Conectaste con ${item.perfil.username}, ¡empieza a colaborar!`
          : item.tipo_notificacion === 'like_cancion' && item.perfil
          ? `A ${item.perfil.username} le gustó tu publicación`
          : item.tipo_notificacion === 'comentario_cancion' && item.perfil
          ? `${item.perfil.username} ha comentado tu publicación`
          : item.tipo_notificacion === 'like_comentario_cancion' && item.perfil
          ? `A ${item.perfil.username} le gustó tu comentario en una canción`
          : item.tipo_notificacion === 'respuesta_comentario' && item.perfil
          ? `${item.perfil.username} ha respondido a tu comentario`
          : item.tipo_notificacion}
      </Text>
      <Text className="text-gray-400 mt-1 text-xs">
        {new Date(item.created_at).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View className="flex-1 px-4">
        <Text className="text-2xl font-JakartaBold mb-2">Notificaciones</Text>
        <FlatList
          data={notificaciones}
          renderItem={renderNotificacion}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Text className="text-center text-gray-500 mt-4">
              No tienes notificaciones
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default Notificaciones;
