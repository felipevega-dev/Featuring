import React, { useState } from 'react';
import { View, FlatList, TouchableOpacity, Text, Image, Modal } from 'react-native';
import { Video, ResizeMode } from "expo-av";
import { FontAwesome } from "@expo/vector-icons";
import AudioPlayer from '@/components/AudioPlayer';
import { ReportButton } from '@/components/reports/ReportButton';

interface Message {
  id: number;
  emisor_id: string;
  receptor_id: string;
  contenido: string;
  tipo_contenido: "texto" | "audio" | "imagen" | "video_chat";
  url_contenido: string | null;
  fecha_envio: string;
  leido: boolean;
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

// Componente para el modal de reporte
const ReportModal = ({ 
  isVisible, 
  onClose, 
  message, 
  currentUserId 
}: { 
  isVisible: boolean; 
  onClose: () => void; 
  message: Message | null;
  currentUserId: string;
}) => {
  if (!message) return null;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/50 justify-center items-center"
        activeOpacity={1}
        onPress={onClose}
      >
        <View className="bg-white rounded-lg w-[80%] p-4">
          <Text className="text-lg font-bold mb-4">Opciones de mensaje</Text>
          
          <ReportButton
            contentId={message.id.toString()}
            contentType={message.tipo_contenido}
            reportedUserId={message.emisor_id}
            currentUserId={currentUserId}
            buttonStyle="bg-red-500 w-full mb-2"
            buttonText={`Reportar ${
              message.tipo_contenido === 'texto' ? 'mensaje' :
              message.tipo_contenido === 'audio' ? 'audio' :
              message.tipo_contenido === 'imagen' ? 'imagen' :
              message.tipo_contenido === 'video_chat' ? 'video' : 'archivo'
            }`}
          />
          
          <TouchableOpacity
            onPress={onClose}
            className="bg-gray-200 p-3 rounded-lg"
          >
            <Text className="text-center font-medium">Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// Componente para un mensaje individual
const MessageItem = React.memo(({ 
  message, 
  isCurrentUser, 
  onLongPress,
  onMediaPress,
  onReport,
  currentUserId
}: {
  message: Message;
  isCurrentUser: boolean;
  onLongPress: () => void;
  onMediaPress: () => void;
  onReport: () => void;
  currentUserId: string | null;
}) => {
  return (
    <TouchableOpacity
      onLongPress={isCurrentUser ? onLongPress : onReport}
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
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const handleReport = (message: Message) => {
    setSelectedMessage(message);
    setReportModalVisible(true);
  };

  const renderMessage = React.useCallback(({ item }: { item: Message }) => {
    const isCurrentUser = item.emisor_id === currentUserId;
    return (
      <MessageItem
        message={item}
        isCurrentUser={isCurrentUser}
        onLongPress={() => onLongPress(item)}
        onMediaPress={() => onMediaPress(item)}
        onReport={() => handleReport(item)}
        currentUserId={currentUserId}
      />
    );
  }, [currentUserId, onLongPress, onMediaPress]);

  return (
    <>
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

      <ReportModal
        isVisible={reportModalVisible}
        onClose={() => {
          setReportModalVisible(false);
          setSelectedMessage(null);
        }}
        message={selectedMessage}
        currentUserId={currentUserId || ''}
      />
    </>
  );
}; 