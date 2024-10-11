import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

interface ChatListItem {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string | null;
  lastMessageTime: string | null;
}

export default function Chat() {
  const [chatList, setChatList] = useState<ChatListItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchChatList();
    }
  }, [currentUserId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const fetchChatList = async () => {
    if (!currentUserId) return;

    try {
      setIsLoading(true);
      const { data: connections, error: connectionsError } = await supabase
        .from('conexion')
        .select('*')
        .or(`usuario1_id.eq.${currentUserId},usuario2_id.eq.${currentUserId}`)
        .eq('estado', true);

      if (connectionsError) throw connectionsError;

      if (!connections || connections.length === 0) {
        setChatList([]);
        setIsLoading(false);
        return;
      }

      // Crear un Set para almacenar IDs de usuarios únicos
      const uniqueUserIds = new Set<string>();
      const uniqueConnections = connections.filter(connection => {
        const otherUserId = connection.usuario1_id === currentUserId ? connection.usuario2_id : connection.usuario1_id;
        if (!uniqueUserIds.has(otherUserId)) {
          uniqueUserIds.add(otherUserId);
          return true;
        }
        return false;
      });

      const chatListPromises = uniqueConnections.map(async (connection) => {
        const otherUserId = connection.usuario1_id === currentUserId ? connection.usuario2_id : connection.usuario1_id;

        const { data: userData, error: userError } = await supabase
          .from('perfil')
          .select('username, foto_perfil')
          .eq('usuario_id', otherUserId)
          .single();

        if (userError) throw userError;

        const { data: lastMessageData, error: messageError } = await supabase
          .from('mensaje')
          .select('contenido, fecha_envio')
          .or(`and(emisor_id.eq.${currentUserId},receptor_id.eq.${otherUserId}),and(emisor_id.eq.${otherUserId},receptor_id.eq.${currentUserId})`)
          .order('fecha_envio', { ascending: false })
          .limit(1)
          .single();

        if (messageError && messageError.code !== 'PGRST116') throw messageError;

        return {
          id: connection.id,
          otherUserId,
          otherUserName: userData.username,
          otherUserAvatar: userData.foto_perfil,
          lastMessage: lastMessageData?.contenido || null,
          lastMessageTime: lastMessageData?.fecha_envio || null,
        };
      });

      const chatListData = await Promise.all(chatListPromises);
      setChatList(chatListData);
    } catch (error) {
      console.error('Error al obtener la lista de chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChatItem = ({ item }: { item: ChatListItem }) => (
    <TouchableOpacity 
      className="flex-row items-center p-4 border-b border-primary-200"
      onPress={() => router.push(`/chat/${item.otherUserId}`)}
    >
      {item.otherUserAvatar ? (
        <Image
          source={{ uri: item.otherUserAvatar }}
          className="w-12 h-12 rounded-full mr-4"
        />
      ) : (
        <View className="w-12 h-12 rounded-full bg-primary-300 mr-4 justify-center items-center">
          <Text className="text-xl font-bold text-primary-700">
            {item.otherUserName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View className="flex-1">
        <Text className="font-JakartaBold text-lg text-primary-700">{item.otherUserName}</Text>
        <Text className="text-primary-600" numberOfLines={1}>
          {item.lastMessage || 'No hay mensajes aún'}
        </Text>
      </View>
      {item.lastMessageTime && (
        <Text className="text-primary-400 text-xs">
          {new Date(item.lastMessageTime).toLocaleDateString()}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View className="flex-1 justify-center items-center">
      <FontAwesome name="comments-o" size={80} color="#6D29D2" />
      <Text className="text-xl font-JakartaBold text-primary-700 mt-4">No hay matches disponibles</Text>
      <Text className="text-primary-600 mt-2 text-center px-4 font-JakartaMedium">
        ¡Sigue explorando y conectando con otros músicos para comenzar a chatear!
      </Text>
      <TouchableOpacity 
        className="mt-6 bg-primary-500 py-3 px-6 rounded-full"
        onPress={() => router.push('/match')}
      >
        <Text className="text-white font-JakartaBold">Ir a Matches</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-primary-700 font-JakartaMedium">Cargando chats...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Text className="text-2xl font-JakartaBold p-4 text-primary-700">Chats</Text>
      {chatList.length > 0 ? (
        <FlatList
          data={chatList}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
        />
      ) : (
        renderEmptyList()
      )}
    </View>
  );
}