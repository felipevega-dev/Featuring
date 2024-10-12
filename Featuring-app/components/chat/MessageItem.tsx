import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Message } from '@/types/message';

interface MessageItemProps {
  message: Message;
  currentUserId: string | null;
  otherUserAvatar: string | null;
  onLongPress: (message: Message) => void;
  isSelected: boolean;
  animatedStyle: any; // Tipo más específico según la implementación de animaciones
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  currentUserId,
  otherUserAvatar,
  onLongPress,
  isSelected,
  animatedStyle,
}) => {
  const isOwnMessage = message.emisor_id === currentUserId;

  return (
    <TouchableOpacity
      onLongPress={() => onLongPress(message)}
      style={[
        {
          flexDirection: 'row',
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          marginBottom: 10,
        },
        animatedStyle,
      ]}
    >
      {!isOwnMessage && otherUserAvatar && (
        <Image
          source={{ uri: otherUserAvatar }}
          style={{ width: 30, height: 30, borderRadius: 15, marginRight: 8 }}
        />
      )}
      <View
        style={{
          backgroundColor: isOwnMessage ? '#6D29D2' : '#E5E5EA',
          borderRadius: 20,
          padding: 10,
          maxWidth: '70%',
          opacity: isSelected ? 0.7 : 1,
        }}
      >
        <Text style={{ color: isOwnMessage ? 'white' : 'black' }}>
          {message.contenido}
        </Text>
        <Text style={{ fontSize: 10, color: isOwnMessage ? '#D1C4E9' : '#8E8E93', marginTop: 5 }}>
          {new Date(message.fecha_envio).toLocaleTimeString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
