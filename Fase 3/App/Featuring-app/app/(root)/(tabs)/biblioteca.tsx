import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { icons } from '@/constants';

interface Cancion {
  id: number;
  titulo: string;
  caratula: string | null;
  genero: string;
  created_at: string;
  likes_count: number;
}

export default function BibliotecaScreen() {
  const [canciones, setCanciones] = useState<Cancion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchUserSongs();
    }
  }, [currentUserId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchUserSongs = async () => {
    try {
      const { data, error } = await supabase
        .from('cancion')
        .select(`
          id,
          titulo,
          caratula,
          genero,
          created_at,
          likes:likes_cancion(count)
        `)
        .eq('usuario_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const cancionesFormateadas = data.map(cancion => ({
        ...cancion,
        likes_count: cancion.likes?.[0]?.count || 0
      }));

      setCanciones(cancionesFormateadas);
    } catch (error) {
      console.error('Error al cargar canciones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSongItem = ({ item }: { item: Cancion }) => (
    <TouchableOpacity 
      className="bg-white rounded-lg shadow-md mb-4 p-4"
      onPress={() => router.push(`/comunidad?scrollToId=${item.id}`)}
    >
      <View className="flex-row">
        <Image
          source={{ 
            uri: item.caratula || "https://via.placeholder.com/100"
          }}
          className="w-20 h-20 rounded-lg"
          resizeMode="cover"
        />
        <View className="flex-1 ml-4">
          <Text className="font-JakartaSemiBold text-md mb-1 text-primary-700">
            {item.titulo}
          </Text>
          <Text className="text-xs mb-1 text-secondary-500">
            {item.genero}
          </Text>
          <View className="flex-row justify-between items-center mt-2">
            <Text className="text-xs text-general-200">
              {new Date(item.created_at).toLocaleDateString('es-ES', { 
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <View className="flex-row items-center">
              <View className="flex-row items-center mr-2">
                <Image
                  source={icons.hearto}
                  className="w-4 h-4 mr-1"
                  style={{ tintColor: "#6D29D2" }}
                />
                <Text className="text-xs text-primary-500">
                  {item.likes_count}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6D29D2" />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header con botón de volver */}
      <View className="bg-primary-500 py-4 px-4 flex-row items-center">
        <Text className="flex-1 text-xl font-bold text-white text-center">
          Mi Biblioteca
        </Text>
      </View>

      <FlatList
        data={canciones}
        renderItem={renderSongItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100
        }}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center p-4">
            <Text className="text-gray-500">
              No has subido canciones aún
            </Text>
          </View>
        }
      />
    </View>
  );
} 