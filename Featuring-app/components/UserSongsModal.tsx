import React, { useState, useEffect } from 'react';
import { Modal, View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Cancion } from '@/types/db_types';

interface UserSongsModalProps {
  isVisible: boolean;
  onClose: () => void;
  userId: string;
}

export default function UserSongsModal({ isVisible, onClose, userId }: UserSongsModalProps) {
  const [userSongs, setUserSongs] = useState<Cancion[]>([]);

  useEffect(() => {
    if (isVisible) {
      fetchUserSongs();
    }
  }, [isVisible]);

  const fetchUserSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('cancion')
        .select('*')
        .eq('usuario_id', userId);

      if (error) throw error;
      setUserSongs(data || []);
    } catch (error) {
      console.error('Error fetching user songs:', error);
    }
  };

  const renderSongItem = ({ item }: { item: Cancion }) => (
    <View className="flex-row items-center p-4 border-b border-primary-700">
      <Image
        source={{ uri: item.caratula || undefined }}
        className="w-12 h-12 rounded-md mr-4"
      />
      <View className="flex-1">
        <Text className="text-white font-bold">{item.titulo}</Text>
        <Text className="text-primary-300">{item.genero}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={isVisible} animationType="slide" transparent={false}>
      <View className="flex-1 bg-primary-900">
        <View className="flex-row justify-between items-center p-4 border-b border-primary-700">
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-lg font-bold">Mi Música Subida</Text>
          <View style={{ width: 24 }} /> 
        </View>
        {userSongs.length > 0 ? (
          <FlatList
            data={userSongs}
            renderItem={renderSongItem}
            keyExtractor={(item) => item.id.toString()}
          />
        ) : (
          <View className="flex-1 justify-center items-center">
            <Text className="text-white">No has subido canciones aún.</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}
