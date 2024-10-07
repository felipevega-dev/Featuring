import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, Alert, Modal, ScrollView } from 'react-native';
import { Audio } from 'expo-av';
import { supabase } from '@/lib/supabase';
import { icons } from '@/constants/index';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';

interface Cancion {
  id: number;
  titulo: string;
  archivo_audio: string | null;
  caratula: string | null;
}

interface Perfil {
  username: string;
  foto_perfil: string | null;
}

interface Post {
  id: number;
  usuario_id: string;
  cancion_id: number;
  contenido: string;
  created_at: string;
  cancion: Cancion | null;
  perfil: Perfil | null;
}

interface Like {
  id: number;
  usuario_id: string;
  publicacion_id: number;
  created_at: string;
}

interface Comentario {
  id: number;
  usuario_id: string;
  publicacion_id: number;
  contenido: string;
  created_at: string;
  likes_count: number;
  perfil: Perfil;
  isLiked?: boolean;
}

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onDeletePost: (postId: number, cancionId: number | null) => void;
}

interface ComentarioLike {
  id: number;
  usuario_id: string;
  comentario_id: number;
  created_at: string;
}

const PostCard: React.FC<PostCardProps> = ({ post, currentUserId, onDeletePost }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [likes, setLikes] = useState<Like[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [comentarioLikes, setComentarioLikes] = useState<{[key: number]: ComentarioLike[]}>({});
  const [showComments, setShowComments] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [commentSortOrder, setCommentSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [commentOptionsVisible, setCommentOptionsVisible] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const { playSound, currentSong, isPlaying: globalIsPlaying, pauseSound } = useAudioPlayer();

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    fetchLikesAndComments();
    checkIfLiked();
  }, [post.id]);

  const loadAudio = async () => {
    if (post.cancion?.archivo_audio) {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: post.cancion.archivo_audio },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
    }
  };

  const onPlaybackStatusUpdate = (status: Audio.PlaybackStatus) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis);
      setPosition(status.positionMillis);
    }
  };

  const playPauseAudio = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
      setIsPlaying(!isPlaying);
    } else {
      await loadAudio();
      if (sound) {
        await sound.playAsync();
        setIsPlaying(true);
      }
    }
  };


  const formatTime = (millis: number | null) => {
    if (millis === null) return '0:00';
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${(Number(seconds) < 10 ? '0' : '')}${seconds}`;
  };

  const fetchLikesAndComments = async () => {
    const { data: likesData } = await supabase
      .from('likes_publicacion')
      .select('*')
      .eq('publicacion_id', post.id);
    
    const { data: comentariosData } = await supabase
      .from('comentario_publicacion')
      .select('*, perfil(*)')
      .eq('publicacion_id', post.id)
      .order('created_at', { ascending: false });
    // Removido el límite de 3 comentarios

    if (likesData) setLikes(likesData);
    if (comentariosData) {
      const comentariosConLikes = await Promise.all(comentariosData.map(async (comentario) => {
        const { data: likesData } = await supabase
          .from('likes_comentario_publicacion')
          .select('*')
          .eq('comentario_id', comentario.id);
        
        setComentarioLikes(prev => ({...prev, [comentario.id]: likesData || []}));
        
        return {
          ...comentario,
          isLiked: (likesData || []).some(like => like.usuario_id === currentUserId)
        };
      }));
      setComentarios(comentariosConLikes);
    }
  };

  const checkIfLiked = async () => {
    const { data } = await supabase
      .from('likes_publicacion')
      .select('*')
      .eq('publicacion_id', post.id)
      .eq('usuario_id', currentUserId)
      .single();

    setIsLiked(!!data);
  };

  const handleLike = async () => {
    if (isLiked) {
      await supabase
        .from('likes_publicacion')
        .delete()
        .eq('publicacion_id', post.id)
        .eq('usuario_id', currentUserId);
      setLikes(likes.filter(like => like.usuario_id !== currentUserId));
    } else {
      const { data } = await supabase
        .from('likes_publicacion')
        .insert({ publicacion_id: post.id, usuario_id: currentUserId })
        .select()
        .single();
      if (data) setLikes([...likes, data]);
    }
    setIsLiked(!isLiked);
  };

  const handleComment = async () => {
    if (nuevoComentario.trim()) {
      try {
        const { data, error } = await supabase
          .from('comentario_publicacion')
          .insert({ 
            publicacion_id: post.id, 
            usuario_id: currentUserId, 
            contenido: nuevoComentario.trim() 
          })
          .select(`
            id,
            usuario_id,
            publicacion_id,
            contenido,
            created_at,
            perfil (
              username,
              foto_perfil
            )
          `)
          .single();

        if (error) throw error;

        if (data) {
          setComentarios([data as Comentario, ...comentarios]);
          setNuevoComentario('');
        }
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
        .from('likes_comentario_publicacion')
        .delete()
        .eq('comentario_id', comentarioId)
        .eq('usuario_id', currentUserId);
      
      setComentarioLikes(prev => ({
        ...prev,
        [comentarioId]: prev[comentarioId].filter(like => like.usuario_id !== currentUserId)
      }));
    } else {
      const { data } = await supabase
        .from('likes_comentario_publicacion')
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
        ? {...comentario, isLiked: !isLiked}
        : comentario
    ));
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

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const toggleImageModal = () => {
    setModalVisible(!modalVisible);
  };

  const toggleCommentsModal = () => {
    setCommentsModalVisible(!commentsModalVisible);
  };

  const toggleSortOptions = () => {
    setShowSortOptions(!showSortOptions);
  };

  const sortComments = (order: 'newest' | 'oldest') => {
    setCommentSortOrder(order);
    let sortedComments = [...comentarios];
    if (order === 'newest') {
      sortedComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      sortedComments.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }
    setComentarios(sortedComments);
  };

  const handleCommentOptions = (comentario: Comentario) => {
    setSelectedCommentId(comentario.id);
    setCommentOptionsVisible(true);
  };

  const handleDeleteComment = async () => {
    if (selectedCommentId) {
      try {
        await supabase
          .from('comentario_publicacion')
          .delete()
          .eq('id', selectedCommentId)
          .eq('usuario_id', currentUserId);
        
        setComentarios(prevComentarios => prevComentarios.filter(c => c.id !== selectedCommentId));
        setCommentOptionsVisible(false);
      } catch (error) {
        console.error('Error al eliminar el comentario:', error);
        Alert.alert('Error', 'No se pudo eliminar el comentario');
      }
    }
  };

  const handleCopyComment = async () => {
    const comentario = comentarios.find(c => c.id === selectedCommentId);
    if (comentario) {
      await Clipboard.setStringAsync(comentario.contenido);
      Alert.alert('Éxito', 'Contenido del comentario copiado al portapapeles');
      setCommentOptionsVisible(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar publicación",
      "¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: () => {
            onDeletePost(post.id, post.cancion?.id || null);
            setShowOptionsModal(false);
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    // Por ahora, solo cerramos el modal
    setShowOptionsModal(false);
    // Aquí iría la lógica para editar el post
  };

  const handlePlayPause = () => {
    if (post.cancion) {
      if (currentSong?.id === post.cancion.id && globalIsPlaying) {
        pauseSound();
      } else {
        playSound({
          id: post.cancion.id,
          title: post.cancion.titulo,
          audioUrl: post.cancion.archivo_audio || '',
          coverUrl: post.cancion.caratula || '',
        });
      }
    }
  };

  return (
    <View className="bg-white p-4 mb-6 rounded-lg shadow-md">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
          <Image
            source={{ uri: post.perfil?.foto_perfil || 'https://via.placeholder.com/50' }}
            className="w-10 h-10 rounded-full mr-2"
          />
          <Text className="font-bold">{post.perfil?.username || 'Usuario desconocido'}</Text>
        </View>
        {post.usuario_id === currentUserId && (
          <TouchableOpacity onPress={() => setShowOptionsModal(true)}>
            <Ionicons name="ellipsis-vertical" size={24} color="black" />
          </TouchableOpacity>
        )}
      </View>
      {post.cancion && (
        <Text className="font-JakartaSemiBold text-lg mb-2 text-primary-700">{post.cancion.titulo}</Text>
      )}
      <Text className="mb-3 text-general-200">{post.contenido}</Text>
      {post.cancion?.caratula && (
        <TouchableOpacity onPress={toggleImageModal}>
          <Image 
            source={{ uri: post.cancion.caratula }} 
            className="w-full h-48 rounded-lg mb-3"
          />
        </TouchableOpacity>
      )}
      <View className="flex-row items-center mt-2">
        <TouchableOpacity onPress={handleLike} className="flex-row items-center mr-4">
          <Image
            source={isLiked ? require('@/assets/icons/hearto.png') : require('@/assets/icons/heart.png')}
            className="w-6 h-6 mr-1"
            style={{ tintColor: isLiked ? '#6D29D2' : undefined }}
          />
          <Text className="font-JakartaBold text-sm text-primary-500">{likes.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleCommentsModal} className="flex-row items-center">
          <Image
            source={require('@/assets/icons/comentario.png')}
            className="w-6 h-6 mr-1"
          />
          <Text className="font-JakartaBold text-sm">{comentarios.length}</Text>
        </TouchableOpacity>
      </View>
      <Text className="text-xs text-general-200 mt-2">
        {formatCommentDate(post.created_at)}
      </Text>
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={toggleImageModal}
      >
        <TouchableOpacity 
          className="flex-1 justify-center items-center bg-black bg-opacity-70"
          activeOpacity={1} 
          onPress={toggleImageModal}
        >
          <Image 
            source={{ uri: post.cancion?.caratula }} 
            className="w-11/12 h-5/6"
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
      {/* Modal para los comentarios */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={commentsModalVisible}
        onRequestClose={toggleCommentsModal}
      >
        <View className="flex-1 justify-end bg-black/20">
          <View className="bg-white rounded-t-3xl p-4 h-3/4 shadow-lg">
            <View className="flex-row justify-between items-center mb-4">
              <TouchableOpacity onPress={toggleSortOptions}>
                <Image
                  source={icons.shuffle}
                  className="w-6 h-6"
                  style={{ tintColor: '#00BFA5' }}
                />
              </TouchableOpacity>
              <View className="flex-row items-center">
                <Text className="text-secondary-500 font-JakartaBold mr-2">{comentarios.length}</Text>
                <Text className="font-JakartaBold text-lg">Comentarios</Text>
              </View>
              <TouchableOpacity onPress={toggleCommentsModal}>
                <Text className="text-secondary-500 font-JakartaBold">Cerrar</Text>
              </TouchableOpacity>
            </View>
            {showSortOptions && (
              <View className="flex-row justify-center mb-4">
                <TouchableOpacity onPress={() => sortComments('newest')} className="mr-4">
                  <Text className={`text-sm ${commentSortOrder === 'newest' ? 'text-secondary-500 font-bold' : 'text-gray-500'}`}>Más nuevos</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => sortComments('oldest')}>
                  <Text className={`text-sm ${commentSortOrder === 'oldest' ? 'text-secondary-500 font-bold' : 'text-gray-500'}`}>Más antiguos</Text>
                </TouchableOpacity>
              </View>
            )}
            <ScrollView className="mb-4">
              {comentarios.map(comentario => (
                <View key={comentario.id} className="mb-3 border-b border-general-300 pb-2">
                  <View className="flex-row justify-between items-start mb-1">
                    <View className="flex-row items-center flex-1">
                      {comentario.perfil?.foto_perfil && (
                        <Image 
                          source={{ uri: comentario.perfil.foto_perfil }} 
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      )}
                      <View className="flex-1">
                        <View className="flex-row items-center">
                          <Text className="font-JakartaBold text-sm mr-2">{comentario.perfil?.username || 'Usuario desconocido'}</Text>
                          <Text className="text-xs text-general-200">{formatCommentDate(comentario.created_at)}</Text>
                        </View>
                        <Text className="text-sm mt-1">{comentario.contenido}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleCommentOptions(comentario)} className="ml-2">
                      <Image
                        source={icons.trespuntos}
                        className="w-5 h-5"
                      />
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row items-center mt-2 ml-10">
                    <TouchableOpacity onPress={() => handleCommentLike(comentario.id)} className="flex-row items-center">
                      <Image
                        source={comentario.isLiked ? icons.hearto : icons.heart}
                        className="w-4 h-4 mr-1"
                        style={{ tintColor: comentario.isLiked ? '#6D29D2' : undefined }}
                      />
                      <Text className="text-xs text-primary-500 font-JakartaBold">
                        {(comentarioLikes[comentario.id] || []).length}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View className="mt-2">
              <TextInput
                className="border border-general-300 rounded-full px-4 py-2 mb-2"
                value={nuevoComentario}
                onChangeText={setNuevoComentario}
                placeholder="Añade un comentario..."
                placeholderTextColor="#858585"
              />
              <TouchableOpacity onPress={handleComment} className="bg-primary-500 rounded-full py-2 items-center">
                <Text className="text-white font-JakartaBold">Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Modal para opciones de comentario */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={commentOptionsVisible}
        onRequestClose={() => setCommentOptionsVisible(false)}
      >
        <TouchableOpacity 
          className="flex-1 justify-center items-center bg-black/50"
          activeOpacity={1} 
          onPress={() => setCommentOptionsVisible(false)}
        >
          <View className="bg-white rounded-lg p-4 w-3/4">
            <TouchableOpacity 
              className="py-3 border-b border-gray-200" 
              onPress={handleCopyComment}
            >
              <Text className="text-primary-500 font-JakartaMedium">Copiar contenido</Text>
            </TouchableOpacity>
            {selectedCommentId && comentarios.find(c => c.id === selectedCommentId)?.usuario_id === currentUserId && (
              <TouchableOpacity 
                className="py-3" 
                onPress={handleDeleteComment}
              >
                <Text className="text-red-500 font-JakartaMedium">Eliminar comentario</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal
        animationType="fade"
        transparent={true}
        visible={showOptionsModal}
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1} 
          onPress={() => setShowOptionsModal(false)}
        >
          <View className="bg-white rounded-lg p-4 w-3/4">
            <TouchableOpacity 
              className="py-3 border-b border-gray-200" 
              onPress={handleEdit}
            >
              <Text className="text-blue-500 font-semibold">Editar publicación</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="py-3" 
              onPress={handleDelete}
            >
              <Text className="text-red-500 font-semibold">Eliminar publicación</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {post.cancion && (
        <TouchableOpacity 
          onPress={handlePlayPause}
          className="absolute bottom-4 right-4 bg-primary-500 rounded-full p-2"
        >
          <Ionicons 
            name={currentSong?.id === post.cancion.id && globalIsPlaying ? "pause" : "play"} 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default PostCard;