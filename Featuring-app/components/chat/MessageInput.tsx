import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  onSendPress: () => void;
  isRecording: boolean;
  onRecordPress: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  setNewMessage,
  onSendPress,
  isRecording,
  onRecordPress,
}) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: '#E5E5EA' }}>
      <TextInput
        value={newMessage}
        onChangeText={setNewMessage}
        placeholder="Escribe un mensaje..."
        style={{ flex: 1, padding: 10, backgroundColor: '#F2F2F7', borderRadius: 20, marginRight: 10 }}
      />
      <TouchableOpacity onPress={onRecordPress} style={{ marginRight: 10 }}>
        <FontAwesome name={isRecording ? "stop" : "microphone"} size={24} color="#6D29D2" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onSendPress}>
        <FontAwesome name="send" size={24} color="#6D29D2" />
      </TouchableOpacity>
    </View>
  );
};
