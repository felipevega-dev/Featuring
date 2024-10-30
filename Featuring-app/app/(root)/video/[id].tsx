import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, SafeAreaView, FlatList, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Video as ExpoVideo } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Constants from 'expo-constants';
import { VideoProvider } from '@/contexts/VideoContext';

interface Video {
  id: number;
  usuario_id: string;
  descripcion: string;
  url: string | null;
  created_at: string;
  perfil: {
    username: string;
    foto_perfil: string | null;
  };
}

interface Comentario {
  id: number;
  usuario_id: string;
  video_id: number;
  comentario: string;
  created_at: string;
  likes_count: number;
  perfil: {
    username: string;
    foto_perfil: string | null;
  };
  isLiked?: boolean;
}

export default function VideoDetail() {
  const { id, showComments } = useLocalSearchParams<{ id: string; showComments?: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
  const videoRef = useRef<ExpoVideo>(null);

  useEffect(() => {
    fetchVideo();
    getCurrentUser();
    if (showComments === 'true') {
      setShowCommentsModal(true);
    }
  }, [id]);

  useEffect(() => {
    checkIfLiked();
    fetchLikesCount();
    fetchComentarios();
  }, [id, currentUserId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchVideo = async () => {
    try {
      const { data, error } = await supabase
        .from('video')
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
      setVideo(data);
    } catch (error) {
      console.error('Error al cargar el video:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfLiked = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: { likes } } = await supabase
          .from('likes')
          .select(`
            *,
            perfil:usuario_id (
              username,
              foto_perfil
            )
          `)
          .eq('video_id', id)
          .eq('usuario_id', user.id)
          .single();

        if (likes) {
          setIsLiked(true);
        } else {
          setIsLiked(false);
        }
      }
    } catch (error) {
      console.error('Error al verificar si el video está marcado como favorito:', error);
    }
  };

  const fetchLikesCount = async () => {
    try {
      const { data: { likes_count } } = await supabase
        .from('likes')
        .select('likes_count')
        .eq('video_id', id)
        .single();

      if (likes_count) {
        setLikesCount(likes_count);
      }
    } catch (error) {
      console.error('Error al cargar el número de likes:', error);
    }
  };

  const fetchComentarios = async () => {
    try {
      const { data: { comentarios } } = await supabase
        .from('comentarios')
        .select(`
          *,
          perfil:usuario_id (
            username,
            foto_perfil
          )
        `)
        .eq('video_id', id);

      if (comentarios) {
        setComentarios(comentarios);
      }
    } catch (error) {
      console.error('Error al cargar los comentarios:', error);
    }
  };

  const handleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: { likes } } = await supabase
          .from('likes')
          .select(`
            *,
            perfil:usuario_id (
              username,
              foto_perfil
            )
          `)
          .eq('video_id', id)
          .eq('usuario_id', user.id)
          .single();

        if (likes) {
          await supabase
            .from('likes')
            .delete()
            .eq('id', likes.id);
        } else {
          await supabase
            .from('likes')
            .insert({
              usuario_id: user.id,
              video_id: id,
            });
        }

        checkIfLiked();
        fetchLikesCount();
      }
    } catch (error) {
      console.error('Error al manejar el like:', error);
    }
  };

  if (isLoading || !video) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <Text className="text-white">Cargando video...</Text>
      </View>
    );
  }

  return (
    <VideoProvider>
      <SafeAreaView className="flex-1 bg-black">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="absolute top-4 left-4 z-10"
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <ExpoVideo
          ref={videoRef}
          source={{ uri: video?.url || "" }}
          shouldPlay
          isLooping
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />

        <View className="absolute bottom-20 left-4">
          <View className="flex-row items-center">
            <Image
              source={{
                uri: video?.perfil?.foto_perfil
                  ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${video.perfil.foto_perfil}`
                  : 'https://via.placeholder.com/40'
              }}
              className="w-10 h-10 rounded-full mr-2"
            />
            <Text className="text-white font-bold">{video?.perfil?.username}</Text>
          </View>
          <Text className="text-white mt-2">{video?.descripcion}</Text>
        </View>

        <View className="absolute right-4 bottom-20">
          <TouchableOpacity onPress={handleLike} className="mb-4">
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={30}
              color={isLiked ? "red" : "white"}
            />
            <Text className="text-white text-center">{likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowCommentsModal(true)}
            className="mb-4"
          >
            <Ionicons name="chatbubble-outline" size={30} color="white" />
            <Text className="text-white text-center">{comentarios.length}</Text>
          </TouchableOpacity>
        </View>

        {/* Modal de comentarios */}
        {/* ... código del modal de comentarios igual que en VideoCard ... */}
      </SafeAreaView>
    </VideoProvider>
  );
} 