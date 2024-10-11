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

export default function ChatDetail() {
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
    if (!currentUserId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('mensaje')
        .select('*')
        .or(`and(emisor_id.eq.${currentUserId},receptor_id.eq.${id}),and(emisor_id.eq.${id},receptor_id.eq.${currentUserId})`)
        .order('fecha_envio', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error al obtener mensajes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewMessage = (payload: any) => {
    const newMsg = payload.new as Message;
    setMessages(prevMessages => [newMsg, ...prevMessages]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    try {
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
      setNewMessage('');
      if (data) setMessages(prevMessages => [data[0], ...prevMessages]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View className={`p-2 m-1 max-w-[80%] rounded-lg ${item.emisor_id === currentUserId ? 'bg-primary-500 self-end' : 'bg-gray-300 self-start'}`}>
      <Text className={item.emisor_id === currentUserId ? 'text-white' : 'text-black'}>{item.contenido}</Text>
      <Text className={`text-xs ${item.emisor_id === currentUserId ? 'text-primary-200' : 'text-gray-600'}`}>
        {new Date(item.fecha_envio).toLocaleTimeString()}
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#6D29D2" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center p-4 bg-white border-b border-primary-200">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <FontAwesome name="arrow-left" size={24} color="#6D29D2" />
        </TouchableOpacity>
        <Text className="text-lg font-JakartaBold text-primary-700">{otherUserName}</Text>
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id.toString()}
          inverted
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', paddingVertical: 10 }}
        />

        <View className="flex-row items-center p-2 bg-white border-t border-primary-200">
          <TextInput
            className="flex-1 bg-primary-100 rounded-full px-4 py-2 mr-2 mb-14"
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Escribe un mensaje..."
          />
          <TouchableOpacity onPress={sendMessage} className="bg-primary-500 rounded-full p-2 mb-14">
            <FontAwesome name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}