import React, { useState, useEffect } from 'react';
import { FlatList, Text, View, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

interface Notificacion {
  id: string;
  usuario_id: string;
  tipo_notificacion: string;
  created_at: string;
}

const Notificaciones = () => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotificaciones = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('notificacion')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notificaciones:', error);
      } else {
        console.log('Notificaciones obtenidas:', data);
        setNotificaciones(data);
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
    <View className="bg-gray-100 p-4 mb-2 rounded-lg">
      <Text className="font-JakartaBold text-lg">{item.tipo_notificacion}</Text>
      <Text className="text-gray-400 mt-1 text-xs">
        {new Date(item.created_at).toLocaleString()}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white p-5">
      <Text className="text-2xl font-JakartaBold mb-4">Notificaciones</Text>
      <FlatList
        data={notificaciones}
        renderItem={renderNotificacion}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};

export default Notificaciones;
