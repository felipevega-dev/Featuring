import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Image, SafeAreaView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';

interface Message {
  id: number;
  emisor_id: string;
  receptor_id: string;
  contenido: string;
  tipo_contenido: string | null;
  url_contenido: string | null;
  fecha_envio: string;
  created_at: string;
}

const ChatDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  useEffect(() => {
    getCurrentUser();
    fetchMessages();
    getOtherUserName();
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'mensaje',
        filter: `or(emisor_id.eq.${id},receptor_id.eq.${id})` 
      }, handleNewMessage)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id, currentUserId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const getOtherUserName = async () => {
    const { data, error } = await supabase
      .from('perfil')
      .select('username')
      .eq('usuario_id', id)
      .single();

    if (error) console.error('Error al obtener el nombre del usuario:', error);
    else if (data) setOtherUserName(data.username);
  };

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('mensaje')
        .select('*');

      if (error) {
        throw error;
      }

      console.log('Mensajes obtenidos:', data);
      setMessages(data || []);
    } catch (error) {
      console.error('Error al obtener mensajes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewMessage = (payload: any) => {
    const newMsg = payload.new as Message;
    setMessages(prevMessages => [...prevMessages, newMsg]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    try {
      console.log('Intentando enviar mensaje:', { emisor_id: currentUserId, receptor_id: id, contenido: newMessage.trim() });
      
      const { data, error } = await supabase
        .from('mensaje')
        .insert({
          emisor_id: currentUserId,
          receptor_id: id,
          contenido: newMessage.trim(),
          tipo_contenido: 'texto',
        })
        .select();

      if (error) throw error;

      console.log('Mensaje enviado exitosamente:', data);
      setNewMessage('');
      if (data) setMessages(prevMessages => [...prevMessages, data[0]]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View className={`p-2 m-1 max-w-[80%] rounded-lg ${item.emisor_id === currentUserId ? 'bg-blue-500 self-end' : 'bg-gray-300 self-start'}`}>
      {item.tipo_contenido === 'text' ? (
        <Text className={item.emisor_id === currentUserId ? 'text-white' : 'text-black'}>{item.contenido}</Text>
      ) : item.tipo_contenido === 'image' ? (
        <Image source={{ uri: item.url_contenido || '' }} style={{ width: 200, height: 200 }} />
      ) : (
        <Text className={item.emisor_id === currentUserId ? 'text-white' : 'text-black'}>Contenido no soportado</Text>
      )}
      <Text className={`text-xs ${item.emisor_id === currentUserId ? 'text-blue-200' : 'text-gray-600'}`}>
        {new Date(item.fecha_envio).toLocaleTimeString()}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View className="flex-row items-center p-4 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <FontAwesome name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-lg font-bold">{otherUserName}</Text>
        </View>
        
        <View className="flex-1 justify-between">
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({animated: true})}
            onLayout={() => flatListRef.current?.scrollToEnd({animated: true})}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', paddingBottom: 20 }}
          />
          
          <View className="bg-white border-t border-gray-200 p-2">
            <View className="flex-row items-center">
              <TextInput
                className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Escribe un mensaje..."
              />
              <TouchableOpacity onPress={sendMessage} className="bg-blue-500 rounded-full p-2">
                <FontAwesome name="send" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatDetail;
