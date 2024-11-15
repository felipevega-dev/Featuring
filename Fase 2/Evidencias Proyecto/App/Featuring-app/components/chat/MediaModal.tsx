import React from 'react';
import { View, Modal, TouchableOpacity, Image } from 'react-native';
import { Video, ResizeMode } from "expo-av";
import { FontAwesome } from "@expo/vector-icons";

interface MediaModalProps {
  isVisible: boolean;
  onClose: () => void;
  mediaType: 'imagen' | 'video_chat';
  mediaUrl: string;
}

export const MediaModal = ({
  isVisible,
  onClose,
  mediaType,
  mediaUrl
}: MediaModalProps) => {
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        <TouchableOpacity 
          className="absolute top-10 right-4 z-10 bg-black/50 p-2 rounded-full"
          onPress={onClose}
        >
          <FontAwesome name="close" size={24} color="white" />
        </TouchableOpacity>
        
        {mediaType === 'imagen' ? (
          <View className="flex-1 justify-center">
            <Image
              source={{ uri: mediaUrl }}
              style={{
                width: '100%',
                height: '100%',
              }}
              resizeMode="contain"
            />
          </View>
        ) : (
          <Video
            source={{ uri: mediaUrl }}
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
            }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping={true}
            shouldPlay={true}
          />
        )}
      </View>
    </Modal>
  );
}; 