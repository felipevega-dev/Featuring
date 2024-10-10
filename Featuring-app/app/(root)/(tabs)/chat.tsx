import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../types';
import { FontAwesome } from '@expo/vector-icons'; // Asegúrate de tener esta dependencia instalada
import { Link } from 'expo-router';

type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

interface ChatListItem {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string | null;
  lastMessageTime: string | null;
}

const Chat = () => {
  const [chatList, setChatList] = useState<ChatListItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation<ChatScreenNavigationProp>();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchChatList();
    }
  }, [currentUserId]);

  const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error al obtener el usuario actual:', error);
    } else if (user) {
      console.log('Usuario actual obtenido:', user.id);
      setCurrentUserId(user.id);
    } else {
      console.error('No hay usuario autenticado');
    }
  };

  const fetchChatList = async () => {
    if (!currentUserId) return;

    try {
      setIsLoading(true);
      console.log('Obteniendo conexiones para el usuario:', currentUserId);

      // Modificamos la consulta para obtener todas las conexiones del usuario actual
      const { data: connections, error: connectionsError } = await supabase
        .from('conexion')
        .select('*')
        .or(`usuario1_id.eq.${currentUserId},usuario2_id.eq.${currentUserId}`)
        .eq('estado', true);

      if (connectionsError) throw connectionsError;
      
      console.log('Conexiones obtenidas:', connections);

      if (!connections || connections.length === 0) {
        console.log('No se encontraron conexiones');
        setChatList([]);
        setIsLoading(false);
        return;
      }

      // Obtener los detalles de los usuarios y los últimos mensajes
      const chatListPromises = connections.map(async (connection) => {
        const otherUserId = connection.usuario1_id === currentUserId ? connection.usuario2_id : connection.usuario1_id;

        // Obtener detalles del otro usuario
        const { data: userData, error: userError } = await supabase
          .from('perfil')
          .select('username, foto_perfil')
          .eq('usuario_id', otherUserId)
          .single();

        if (userError) throw userError;

        // Obtener el último mensaje
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
      console.log('Lista de chats procesada:', chatListData);
      setChatList(chatListData);
    } catch (error) {
      console.error('Error al obtener la lista de chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderChatItem = ({ item }: { item: ChatListItem }) => (
    <Link href={`/chat/${item.otherUserId}`} asChild>
      <TouchableOpacity className="flex-row items-center p-4 border-b border-gray-200">
        {item.otherUserAvatar ? (
          <Image
            source={{ uri: item.otherUserAvatar }}
            className="w-12 h-12 rounded-full mr-4"
          />
        ) : (
          <View className="w-12 h-12 rounded-full bg-gray-300 mr-4 justify-center items-center">
            <Text className="text-xl font-bold text-gray-500">
              {item.otherUserName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="font-bold text-lg">{item.otherUserName}</Text>
          <Text className="text-gray-600" numberOfLines={1}>
            {item.lastMessage || 'No hay mensajes aún'}
          </Text>
        </View>
        {item.lastMessageTime && (
          <Text className="text-gray-400 text-xs">
            {new Date(item.lastMessageTime).toLocaleDateString()}
          </Text>
        )}
      </TouchableOpacity>
    </Link>
  );

  const renderEmptyList = () => (
    <View className="flex-1 justify-center items-center">
      <FontAwesome name="comments-o" size={80} color="#CCCCCC" />
      <Text className="text-xl font-bold text-gray-400 mt-4">No hay matches disponibles</Text>
      <Text className="text-gray-400 mt-2 text-center px-4">
        ¡Sigue explorando y conectando con otros músicos para comenzar a chatear!
      </Text>
      <TouchableOpacity 
        className="mt-6 bg-blue-500 py-3 px-6 rounded-full"
        onPress={() => navigation.navigate('match')}
      >
        <Text className="text-white font-bold">Ir a Matches</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Cargando chats...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Text className="text-2xl font-bold p-4">Chats</Text>
      {chatList.length > 0 ? (
        <FlatList
          data={chatList}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
        />
      ) : (
        renderEmptyList()
      )}
    </SafeAreaView>
  );
};

export default Chat;