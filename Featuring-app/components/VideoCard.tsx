import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Modal, TextInput, FlatList, Alert, Animated } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Image } from 'expo-image';
import { useVideo } from '@/contexts/VideoContext';

const { width, height } = Dimensions.get('window');


interface Perfil {
  usuario_id: string;
  username: string;
  foto_perfil: string | null;
  // Añade otras propiedades del perfil si son necesarias
}

interface Video {
  id: number;
  usuario_id: string;
  titulo: string;
  descripcion: string;
  url: string | null;
  created_at: string;
  perfil: Perfil;
}

interface Comentario {
  id: number;
  usuario_id: string;
  video_id: number;
  comentario: string;
  created_at: string;
  likes_count: number;
  perfil: Perfil;
  isLiked?: boolean;
}

interface ComentarioLike {
  id: number;
  usuario_id: string;
  comentario_id: number;
  created_at: string;
}

interface Like {
  id: number;
  usuario_id: string;
  cancion_id: number;
  created_at: string;
}

interface VideoCardProps {
  video: Video;
  currentUserId: string;
  onDeleteVideo: (videoId: number) => void;
  onUpdateVideo: (videoId: number) => void;
}
  

const VideoCard: React.FC<VideoCardProps> = ({ video, currentUserId }) => {
  const { currentPlayingId, setCurrentPlayingId } = useVideo();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [comentarioLikes, setComentarioLikes] = useState<{[key: number]: ComentarioLike[]}>({});
  const [nuevoComentario, setNuevoComentario] = useState('');
  const videoRef = useRef<Video>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState(false);

  useEffect(() => {
    if (currentPlayingId === video.id) {
      videoRef.current?.playAsync();
      setIsPlaying(true);
    } else {
      videoRef.current?.pauseAsync();
      setIsPlaying(false);
    }
  }, [currentPlayingId]);

  useEffect(() => {
    checkIfLiked();
    fetchLikesCount();
  }, []);

  const togglePlayPause = () => {
    if (isPlaying) {
      videoRef.current?.pauseAsync();
      setCurrentPlayingId(null);
    } else {
      setCurrentPlayingId(video.id);
    }
    setIsPlaying(!isPlaying);
    setShowPlayPauseIcon(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        delay: 1000,
        useNativeDriver: true,
      }).start();
    });
  };

  const checkIfLiked = async () => {
    const { data } = await supabase
      .from('likes_video')
      .select('*')
      .eq('video_id', video.id)
      .eq('usuario_id', currentUserId)
      .single();
    setIsLiked(!!data);
  };

  const fetchLikesCount = async () => {
    const { count } = await supabase
      .from('likes_video')
      .select('*', { count: 'exact', head: true })
      .eq('video_id', video.id);
    setLikesCount(count || 0);
  };

  const handleLike = async () => {
    try {
      if (isLiked) {
        await supabase
          .from('likes_video')
          .delete()
          .eq('video_id', video.id)
          .eq('usuario_id', currentUserId);
        setLikesCount(prev => prev - 1);
      } else {
        await supabase
          .from('likes_video')
          .insert({ video_id: video.id, usuario_id: currentUserId });
        setLikesCount(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error al dar/quitar like:', error);
    }
  };

  const fetchComentarios = async () => {
    try {
      const { data, error } = await supabase
        .from('comentario_video')
        .select(`
          *,
          perfil:usuario_id (
            username,
            foto_perfil
          )
        `)
        .eq('video_id', video.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setComentarios(data || []);
    } catch (error) {
      console.error('Error al obtener comentarios:', error);
    }
  };

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const day = date.getDate();
    const month = date.toLocaleString('es-ES', { month: 'long' });
    
    return `${day} de ${month} ${formattedHours}:${minutes} ${ampm}`;
  };

  const handleComment = async () => {
    if (nuevoComentario.trim()) {
      try {
        const { data, error } = await supabase
          .from('comentario_video')
          .insert({ 
            video_id: video.id, 
            usuario_id: currentUserId, 
            comentario: nuevoComentario.trim() 
          })
          .select(`
            *,
            perfil:usuario_id (
              username,
              foto_perfil
            )
          `)
          .single();
        if (error) throw error;
        setComentarios([data, ...comentarios]);
        setNuevoComentario('');
      } catch (error) {
        console.error('Error al enviar el comentario:', error);
        Alert.alert('Error', 'No se pudo enviar el comentario. Por favor, intenta de nuevo.');
      }
    }
  };

  const handleCommentLike = async (comentarioId: number) => {
    const likes = comentarioLikes[comentarioId] || [];
    const isLiked = likes.some(like => like.usuario_id === currentUserId);

    if (isLiked) {
      await supabase
        .from('likes_comentario_cancion')
        .delete()
        .eq('comentario_id', comentarioId)
        .eq('usuario_id', currentUserId);
      
      setComentarioLikes(prev => ({
        ...prev,
        [comentarioId]: prev[comentarioId].filter(like => like.usuario_id !== currentUserId)
      }));
    } else {
      const { data } = await supabase
        .from('likes_comentario_cancion')
        .insert({ comentario_id: comentarioId, usuario_id: currentUserId })
        .select()
        .single();
      
      if (data) {
        setComentarioLikes(prev => ({
          ...prev,
          [comentarioId]: [...(prev[comentarioId] || []), data]
        }));
      }
    }

    setComentarios(prev => prev.map(comentario => 
      comentario.id === comentarioId 
        ? {...comentario, likes_count: isLiked ? comentario.likes_count - 1 : comentario.likes_count + 1}
        : comentario
    ));
  };

  return (
    <View style={{ width, height: height - 100 }}>
      <TouchableOpacity onPress={togglePlayPause} style={{ flex: 1 }}>
        <Video
          ref={videoRef}
          source={{ uri: video.url }}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isPlaying}
          isLooping
          style={{ flex: 1 }}
        />
        {showPlayPauseIcon && (
          <Animated.View style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: [{ translateX: -25 }, { translateY: -25 }],
            opacity: fadeAnim,
          }}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={50} color="white" />
          </Animated.View>
        )}
      </TouchableOpacity>
      <View className="absolute bottom-20 left-4 right-4">
        <Text className="text-white font-bold text-lg">{video.titulo}</Text>
        <Text className="text-white">{video.descripcion}</Text>
      </View>
      <View className="absolute right-4 bottom-20">
        <TouchableOpacity onPress={handleLike} className="mb-4">
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={30} color={isLiked ? "red" : "white"} />
          <Text className="text-white text-center">{likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setShowComments(true); fetchComentarios(); }} className="mb-4">
          <Ionicons name="chatbubble-outline" size={30} color="white" />
          <Text className="text-white text-center">{comentarios.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={30} color="white" />
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showComments}
        onRequestClose={() => setShowComments(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-end">
          <View className="bg-white rounded-t-3xl p-4 h-3/4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-JakartaBold">Comentarios</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={comentarios}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View className="flex-row mb-4">
                  <Image
                    source={{ uri: item.perfil.foto_perfil || 'https://via.placeholder.com/50' }}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <View className="flex-1">
                    <Text className="font-JakartaBold text-sm">{item.perfil.username}</Text>
                    <Text className="text-sm text-general-200 mt-1">{item.comentario}</Text>
                    <View className="flex-row items-center mt-2">
                      <TouchableOpacity onPress={() => handleCommentLike(item.id)} className="mr-4">
                        <Ionicons 
                          name={item.isLiked ? "heart" : "heart-outline"} 
                          size={18} 
                          color={item.isLiked ? "red" : "black"} 
                        />
                      </TouchableOpacity>
                      <Text className="text-xs text-general-200">{item.likes_count} likes</Text>
                      <Text className="text-xs text-general-200 ml-4">{formatCommentDate(item.created_at)}</Text>
                    </View>
                  </View>
                </View>
              )}
            />
            <View className="flex-row mt-2">
              <TextInput
                className="flex-1 border border-general-300 rounded-full px-4 py-2 mr-2"
                value={nuevoComentario}
                onChangeText={setNuevoComentario}
                placeholder="Añade un comentario..."
              />
              <TouchableOpacity onPress={handleComment} className="bg-primary-500 rounded-full px-4 py-2">
                <Text className="text-white font-JakartaBold">Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default VideoCard;