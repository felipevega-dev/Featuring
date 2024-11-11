import React from 'react';
import { View, FlatList, TouchableOpacity, Text, Image } from 'react-native';
import { Video, ResizeMode } from "expo-av";
import { FontAwesome } from "@expo/vector-icons";
import AudioPlayer from '@/components/AudioPlayer';

interface Message {
  id: number;
  emisor_id: string;
  receptor_id: string;
  contenido: string;
  tipo_contenido: "texto" | "audio" | "imagen" | "video_chat";
  url_contenido: string | null;
  fecha_envio: string;
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string | null;
  onLongPress: (message: Message) => void;
  onMediaPress: (message: Message) => void;
}

const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
};

// Componente para un mensaje individual
const MessageItem = React.memo(({ 
  message, 
  isCurrentUser, 
  onLongPress,
  onMediaPress 
}: {
  message: Message;
  isCurrentUser: boolean;
  onLongPress: () => void;
  onMediaPress: () => void;
}) => {
  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      className={`flex-row ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}
    >
      <View
        className={`rounded-lg p-3 ${
          isCurrentUser ? 'bg-primary-500' : 'bg-primary-100'
        } ${['audio', 'imagen', 'video_chat'].includes(message.tipo_contenido) ? 'w-[85%]' : 'max-w-[80%]'}`}
      >
        {message.tipo_contenido === 'texto' && (
          <Text
            className={`${
              isCurrentUser ? 'text-white' : 'text-primary-700'
            } font-JakartaMedium`}
          >
            {message.contenido}
          </Text>
        )}

        {message.tipo_contenido === 'audio' && message.url_contenido && (
          <AudioPlayer uri={message.url_contenido} />
        )}

        {message.tipo_contenido === 'imagen' && message.url_contenido && (
          <TouchableOpacity onPress={onMediaPress}>
            <Image
              source={{ uri: message.url_contenido }}
              style={{ width: '100%', height: 200, borderRadius: 10 }}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}

        {message.tipo_contenido === 'video_chat' && message.url_contenido && (
          <TouchableOpacity onPress={onMediaPress}>
            <Video
              source={{ uri: message.url_contenido }}
              style={{
                width: '100%',
                aspectRatio: 16/9,
                borderRadius: 10,
              }}
              useNativeControls
              resizeMode={ResizeMode.COVER}
              isLooping={false}
              shouldPlay={false}
            />
            <View 
              className="absolute inset-0 bg-black/20 items-center justify-center rounded-lg"
            >
              <FontAwesome 
                name="play-circle" 
                size={50} 
                color="rgba(255,255,255,0.9)" 
              />
            </View>
          </TouchableOpacity>
        )}

        <Text
          className={`text-xs mt-1 ${
            isCurrentUser ? 'text-primary-200' : 'text-primary-400'
          }`}
        >
          {formatTime(message.fecha_envio)}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

export const MessageList = ({ 
  messages, 
  currentUserId, 
  onLongPress,
  onMediaPress 
}: MessageListProps) => {
  const renderMessage = React.useCallback(({ item }: { item: Message }) => {
    const isCurrentUser = item.emisor_id === currentUserId;
    return (
      <MessageItem
        message={item}
        isCurrentUser={isCurrentUser}
        onLongPress={() => onLongPress(item)}
        onMediaPress={() => onMediaPress(item)}
      />
    );
  }, [currentUserId, onLongPress, onMediaPress]);

  return (
    <FlatList
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item) => `message-${item.id}`}
      inverted
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "flex-end",
        paddingVertical: 10,
        margin: 12,
      }}
    />
  );
}; 