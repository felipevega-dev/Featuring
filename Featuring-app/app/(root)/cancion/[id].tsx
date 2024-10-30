import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import GlobalAudioPlayer from '@/components/GlobalAudioPlayer';
import CommentSection from '@/components/CommentSection';

interface Cancion {
  id: number;
  titulo: string;
  archivo_audio: string;
  caratula: string;
  contenido: string;
  genero: string;
  usuario_id: string;
  perfil: {
    username: string;
    foto_perfil: string | null;
  };
}

export default function CancionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cancion, setCancion] = useState<Cancion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;

  useEffect(() => {
    fetchCancion();
  }, [id]);

  const fetchCancion = async () => {
    try {
      const { data, error } = await supabase
        .from('cancion')
        .select(`
          *,
          perfil:usuario_id (
            username,
            foto_perfil
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setCancion(data);
    } catch (error) {
      console.error('Error al cargar la canción:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Cargando...</Text>
      </View>
    );
  }

  if (!cancion) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>No se encontró la canción</Text>
      </View>
    );
  }

  return (
    <AudioPlayerProvider>
      <View className="flex-1 bg-white">
        <ScrollView>
          <TouchableOpacity 
            onPress={() => router.back()}
            className="absolute top-4 left-4 z-10"
          >
            <Ionicons name="arrow-back" size={24} color="#6D29D2" />
          </TouchableOpacity>

          <Image
            source={{ uri: cancion.caratula }}
            className="w-full h-64"
            resizeMode="cover"
          />

          <View className="p-4">
            <Text className="text-2xl font-bold mb-2">{cancion.titulo}</Text>
            
            <TouchableOpacity 
              onPress={() => router.push(`/public-profile/${cancion.usuario_id}`)}
              className="flex-row items-center mb-4"
            >
              <Image
                source={{
                  uri: cancion.perfil.foto_perfil
                    ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${cancion.perfil.foto_perfil}`
                    : 'https://via.placeholder.com/40'
                }}
                className="w-10 h-10 rounded-full mr-2"
              />
              <Text className="text-primary-600 font-semibold">
                {cancion.perfil.username}
              </Text>
            </TouchableOpacity>

            <Text className="text-gray-600 mb-4">{cancion.contenido}</Text>
            
            <View className="bg-primary-100 rounded-full px-3 py-1 self-start mb-4">
              <Text className="text-primary-600">{cancion.genero}</Text>
            </View>

            <CommentSection
              songId={Number(id)}
              currentUserId={cancion.usuario_id}
            />
          </View>
        </ScrollView>
        <GlobalAudioPlayer />
      </View>
    </AudioPlayerProvider>
  );
} 