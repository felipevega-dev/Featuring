import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generosMusicales } from '@/constants/musicData';

interface GenreSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
}

export default function GenreSelectionModal({
  isVisible,
  onClose,
  selectedGenre,
  onSelectGenre,
}: GenreSelectionModalProps) {
  return (
    <Modal visible={isVisible} animationType="slide" transparent={false}>
      <View className="flex-1 bg-black">
        <View className="flex-row items-center p-4 border-b border-gray-800">
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold ml-4">Elige un género</Text>
        </View>
        <FlatList
          data={generosMusicales}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="flex-row justify-between items-center p-4 border-b border-gray-800"
              onPress={() => {
                onSelectGenre(item);
                onClose();
              }}
            >
              <Text className="text-white text-lg">{item}</Text>
              {selectedGenre === item && (
                <Ionicons name="checkmark" size={24} color="white" />
              )}
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}
