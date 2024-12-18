import React from 'react';
import { View, TouchableOpacity, Image, Text } from 'react-native';
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface ChatHeaderProps {
  otherUserAvatar: string | null;
  otherUserName: string;
  supabaseUrl: string;
  selectedMessage: any;
  onDeleteMessage: () => void;
  onOptionsPress: () => void;
  onProfilePress: () => void;
}

export const ChatHeader = ({
  otherUserAvatar,
  otherUserName,
  supabaseUrl,
  selectedMessage,
  onDeleteMessage,
  onOptionsPress,
  onProfilePress
}: ChatHeaderProps) => {
  const router = useRouter();

  return (
    <View className="flex-row items-center p-4 bg-white border-b border-primary-200">
      <TouchableOpacity 
        onPress={() => router.push("/chat")}
        className="mr-3"
      >
        <Ionicons name="arrow-back" size={24} color="#6D29D2" />
      </TouchableOpacity>

      <TouchableOpacity onPress={onProfilePress} className="mr-4">
        <Image
          source={{ 
            uri: otherUserAvatar
              ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${otherUserAvatar}`
              : "https://via.placeholder.com/40"
          }}
          className="w-10 h-10 rounded-full mr-3"
        />
      </TouchableOpacity>
      
      <Text className="text-lg font-JakartaBold text-primary-700 flex-1">
        {otherUserName}
      </Text>
      
      {selectedMessage && (
        <TouchableOpacity
          onPress={onDeleteMessage}
        >
          <FontAwesome name="trash" size={24} color="#6D29D2" />
        </TouchableOpacity>
      )}
      
      <TouchableOpacity
        onPress={onOptionsPress}
        className="p-2.5 items-center justify-center"
      >
        <FontAwesome name="ellipsis-v" size={20} color="#6D29D2" />
      </TouchableOpacity>
    </View>
  );
}; 