import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl } from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { RealtimeChannel } from '@supabase/supabase-js';

interface ChatListItem {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadMessages: boolean; // Nuevo campo para indicar si hay mensajes no leídos
}

export default function Chat() {
  const [chatList, setChatList] = useState<ChatListItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const subscriptionRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    
    const initialize = async () => {
      try {
        await getCurrentUser();
        
        if (currentUserId) {
          // Carga inicial de datos
          await fetchChatList();
          
          // Configurar suscripción en tiempo real
          subscribeToMessages();
          
          // Configurar refresco automático
          refreshInterval = setInterval(() => {
            console.log('Refrescando lista de chats...');
            fetchChatList();
          }, 5000); // Actualiza cada 5 segundos
        }
      } catch (error) {
        console.error('Error en la inicialización:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Iniciar la carga
    initialize();

    // Limpieza al desmontar
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [currentUserId]); // Dependencia en currentUserId

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const subscribeToMessages = () => {
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    subscriptionRef.current = supabase
      .channel('public:mensaje')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'mensaje',
          filter: `or(emisor_id.eq.${currentUserId},receptor_id.eq.${currentUserId})`
        }, 
        async (payload) => {
          console.log('Cambio en mensajes detectado:', payload);
          await fetchChatList(); // Actualiza la lista cuando hay cambios
        }
      )
      .subscribe();
  };

  const fetchChatList = async () => {
    if (!currentUserId) return;

    try {
      if (refreshing) {
        setIsLoading(true);
      }
      
      const { data: connections, error: connectionsError } = await supabase
        .from("conexion")
        .select("*")
        .or(`usuario1_id.eq.${currentUserId},usuario2_id.eq.${currentUserId}`)
        .eq("estado", true);

      if (connectionsError) throw connectionsError;

      if (!connections || connections.length === 0) {
        setChatList([]);
        return;
      }

      const uniqueUserIds = new Set<string>();
      const uniqueConnections = connections.filter((connection) => {
        const otherUserId =
          connection.usuario1_id === currentUserId
            ? connection.usuario2_id
            : connection.usuario1_id;
        if (!uniqueUserIds.has(otherUserId)) {
          uniqueUserIds.add(otherUserId);
          return true;
        }
        return false;
      });

      const chatListData = await Promise.all(
        uniqueConnections.map(async (connection) => {
          const otherUserId =
            connection.usuario1_id === currentUserId
              ? connection.usuario2_id
              : connection.usuario1_id;

          const { data: userData, error: userError } = await supabase
            .from("perfil")
            .select("username, foto_perfil")
            .eq("usuario_id", otherUserId)
            .single();

          if (userError) {
            console.error("Error al obtener datos del usuario:", userError);
            return null;
          }

          // Obtener el último mensaje y verificar si está leído
          const { data: lastMessageData, error: messageError } = await supabase
            .from("mensaje")
            .select("contenido, fecha_envio, leido, emisor_id")
            .or(
              `and(emisor_id.eq.${currentUserId},receptor_id.eq.${otherUserId}),and(emisor_id.eq.${otherUserId},receptor_id.eq.${currentUserId})`
            )
            .order("fecha_envio", { ascending: false })
            .limit(1)
            .single();

          if (messageError && messageError.code !== "PGRST116") {
            console.error("Error al obtener mensajes:", messageError);
          }

          // Determinar si hay mensajes no leídos
          const unreadMessages = lastMessageData 
            ? lastMessageData.emisor_id !== currentUserId && !lastMessageData.leido
            : false;

          return {
            id: connection.id,
            otherUserId,
            otherUserName: userData?.username || "Usuario desconocido",
            otherUserAvatar: userData?.foto_perfil || null,
            lastMessage: lastMessageData?.contenido || null,
            lastMessageTime: lastMessageData?.fecha_envio || null,
            unreadMessages: unreadMessages,
          };
        })
      );

      const newChatListData = chatListData.filter((item): item is ChatListItem => item !== null);
      
      setChatList(prevList => {
        const hasChanges = JSON.stringify(prevList) !== JSON.stringify(newChatListData);
        return hasChanges ? newChatListData : prevList;
      });

    } catch (error) {
      console.error("Error al obtener la lista de chats:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchChatList();
  }, []);

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
        <Text className={`text-lg ${item.unreadMessages ? 'font-JakartaBold' : 'font-JakartaRegular'} text-primary-700`}>
          {item.otherUserName}
        </Text>
        <Text className={`${item.unreadMessages ? 'font-JakartaBold' : 'font-JakartaRegular'} text-primary-600`} numberOfLines={1}>
          {item.lastMessage || "No hay mensajes aún"}
        </Text>
      </View>
      {item.lastMessageTime && (
        <Text className="text-primary-400 text-xs">
          {new Date(item.lastMessageTime).toLocaleDateString()}
        </Text>
      )}
      {item.unreadMessages && (
        <View className="bg-primary-500 rounded-full w-3 h-3 ml-2" />
      )}
    </TouchableOpacity>
  );

  const renderEmptyList = () => (
    <View className="flex-1 justify-center items-center mb-16">
      <FontAwesome name="comments-o" size={80} color="#6D29D2" />
      <Text className="text-xl font-JakartaBold text-primary-700 mt-4">
        No hay conexiones disponibles 😢
      </Text>
      <Text className="text-primary-600 mt-2 text-center px-4 font-JakartaMedium">
        ¡Sigue explorando y conectando con otros músicos para comenzar a
        chatear! 🎸🥁🎹
      </Text>
      <TouchableOpacity
        className="mt-6 bg-primary-500 py-3 px-6 rounded-full"
        onPress={() => router.push("/match")}
      >
        <Text className="text-white font-JakartaBold">
          Buscar Colaboradores 🤝
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-primary-700 font-JakartaMedium">
          Cargando chats... 🎵
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Text className="text-2xl font-JakartaBold p-4 text-primary-700">
        Chats
      </Text>
      {chatList.length > 0 ? (
        <FlatList
          data={chatList}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        renderEmptyList()
      )}
    </View>
  );
}
