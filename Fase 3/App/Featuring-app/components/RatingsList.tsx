import React from 'react';
import { View, Text, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

interface Rating {
  id: number;
  valoracion: number;
  comentario: string | null;
  created_at: string;
  perfil: {
    username: string;
    foto_perfil: string | null;
  };
}

export default function RatingsList({ ratings }: { ratings: Rating[] }) {
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderRating = ({ item }: { item: Rating }) => (
    <View className="bg-white p-4 rounded-lg mb-3 shadow">
      <View className="flex-row items-center mb-2">
        <Image
          source={{
            uri: item.perfil.foto_perfil
              ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${item.perfil.foto_perfil}`
              : 'https://via.placeholder.com/40'
          }}
          className="w-10 h-10 rounded-full mr-3"
        />
        <View className="flex-1">
          <Text className="font-bold text-primary-600">{item.perfil.username}</Text>
          <Text className="text-xs text-gray-500">{formatDate(item.created_at)}</Text>
        </View>
      </View>
      
      <View className="flex-row mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name="star"
            size={16}
            color={star <= item.valoracion ? "#FFD700" : "#E5E7EB"}
          />
        ))}
      </View>

      {item.comentario && (
        <Text className="text-gray-700 mt-1">{item.comentario}</Text>
      )}
    </View>
  );

  return (
    <FlatList
      data={ratings}
      renderItem={renderRating}
      keyExtractor={(item) => item.id.toString()}
      ListEmptyComponent={
        <Text className="text-center text-gray-500">
          No hay valoraciones aún
        </Text>
      }
    />
  );
} 