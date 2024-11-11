import React, { useState, useEffect } from "react";
import { SafeAreaView, KeyboardAvoidingView, Platform, StatusBar } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useChat } from '@/hooks/useChat';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ChatInput } from '@/components/chat/ChatInput';
import { MediaModal } from '@/components/chat/MediaModal';
import { MessageList } from '@/components/chat/MessageList';
import { supabase } from "@/lib/supabase";
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Message } from '@/types/chat';

export default function ChatDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { messages, isLoading, error, sendMessage } = useChat(currentUserId, id);
  
  // Estados para el chat
  const [newMessage, setNewMessage] = useState("");
  const [otherUserName, setOtherUserName] = useState("");
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Message | null>(null);

  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;

  // Obtener información del usuario actual y del otro usuario
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };

    const getOtherUserInfo = async () => {
      const { data, error } = await supabase
        .from("perfil")
        .select("username, foto_perfil")
        .eq("usuario_id", id)
        .single();

      if (!error && data) {
        setOtherUserName(data.username);
        setOtherUserAvatar(data.foto_perfil);
      }
    };

    getCurrentUser();
    getOtherUserInfo();
  }, [id]);

  // Manejadores de eventos
  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      await sendMessage(newMessage, "texto");
      setNewMessage("");
    }
  };

  const handleDeleteMessage = async () => {
    if (selectedMessage) {
      const { error } = await supabase
        .from("mensaje")
        .delete()
        .eq("id", selectedMessage.id);

      if (!error) {
        setSelectedMessage(null);
      }
    }
  };

  const handleLongPress = (message: Message) => {
    if (message.emisor_id === currentUserId) {
      setSelectedMessage(message);
    }
  };

  const handleMediaPress = (message: Message) => {
    setSelectedMedia(message);
    setIsFullScreen(true);
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Optimizar la imagen si es necesario
        if (asset.type === 'image') {
          const manipResult = await manipulateAsync(
            asset.uri,
            [{ resize: { width: 1080 } }],
            { compress: 0.7, format: SaveFormat.JPEG }
          );
          await sendMessage("Imagen", "imagen", manipResult.uri);
        } else {
          await sendMessage("Video", "video_chat", asset.uri);
        }
      }
    } catch (error) {
      console.error('Error picking media:', error);
    }
  };

  const handleRecordPress = () => {
    setIsRecording(!isRecording);
    // Aquí iría la lógica de grabación de audio
  };

  if (isLoading) {
    return null; // O un componente de carga
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <ChatHeader
        otherUserAvatar={otherUserAvatar}
        otherUserName={otherUserName}
        supabaseUrl={supabaseUrl}
        selectedMessage={selectedMessage}
        onDeleteMessage={handleDeleteMessage}
        onOptionsPress={() => setModalVisible(true)}
      />
      
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        onLongPress={handleLongPress}
        onMediaPress={handleMediaPress}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ChatInput
          newMessage={newMessage}
          onChangeText={setNewMessage}
          onSendMessage={handleSendMessage}
          onPickImage={handlePickImage}
          isRecording={isRecording}
          onRecordPress={handleRecordPress}
        />
      </KeyboardAvoidingView>
      
      <MediaModal
        isVisible={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        mediaType={selectedMedia?.tipo_contenido as 'imagen' | 'video_chat'}
        mediaUrl={selectedMedia?.url_contenido || ''}
      />
    </SafeAreaView>
  );
}
