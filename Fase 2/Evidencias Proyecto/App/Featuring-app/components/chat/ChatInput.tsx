import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { FontAwesome } from "@expo/vector-icons";

interface ChatInputProps {
  newMessage: string;
  onChangeText: (text: string) => void;
  onSendMessage: () => void;
  onPickImage: () => void;
  isRecording: boolean;
  onRecordPress: () => void;
}

export const ChatInput = ({
  newMessage,
  onChangeText,
  onSendMessage,
  onPickImage,
  isRecording,
  onRecordPress
}: ChatInputProps) => {
  return (
    <View className="flex-row items-center p-2 bg-white border-t border-primary-200">
      <TextInput
        className="flex-1 bg-primary-100 rounded-full px-4 py-2 mr-2"
        value={newMessage}
        onChangeText={onChangeText}
        placeholder="Escribe un mensaje..."
      />

      <TouchableOpacity
        onPress={onPickImage}
        className="bg-primary-500 rounded-full p-2 mr-2"
      >
        <FontAwesome name="image" size={20} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onRecordPress}
        className="bg-primary-500 rounded-full p-2 mr-2"
      >
        <FontAwesome
          name={isRecording ? "stop" : "microphone"}
          size={20}
          color="white"
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onSendMessage}
        className="bg-primary-500 rounded-full p-2"
      >
        <FontAwesome name="send" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
}; 