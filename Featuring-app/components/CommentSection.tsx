import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Modal } from 'react-native';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

interface Comment {
  id: number;
  usuario_id: string;
  contenido: string;
  created_at: string;
  perfil: {
    username: string;
    foto_perfil: string | null;
  };
}

interface CommentSectionProps {
  songId: number;
  currentUserId: string;
  isVisible: boolean;
  onClose: () => void;
}

export default function CommentSection({ songId, currentUserId, isVisible, onClose }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;

  useEffect(() => {
    if (isVisible) {
      fetchComments();
      subscribeToComments();
    }
  }, [songId, isVisible]);

  const subscribeToComments = () => {
    const subscription = supabase
      .channel(`comments-${songId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comentario_cancion',
          filter: `cancion_id=eq.${songId}`
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comentario_cancion')
      .select(`
        id,
        usuario_id,
        contenido,
        created_at,
        perfil:usuario_id (
          username,
          foto_perfil
        )
      `)
      .eq('cancion_id', songId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar comentarios:', error);
    } else {
      // Formatear los datos para que coincidan con el tipo Comment
      const formattedComments: Comment[] = data.map(comment => ({
        id: comment.id,
        usuario_id: comment.usuario_id,
        contenido: comment.contenido,
        created_at: comment.created_at,
        perfil: {
          username: comment.perfil?.username || 'Usuario desconocido',
          foto_perfil: comment.perfil?.foto_perfil || null
        }
      }));
      setComments(formattedComments);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;

    try {
      const { data: commentData, error: commentError } = await supabase
        .from('comentario_cancion')
        .insert({
          cancion_id: songId,
          usuario_id: currentUserId,
          contenido: newComment.trim()
        })
        .select()
        .single();

      if (commentError) throw commentError;

      setNewComment('');
      await fetchComments();
    } catch (error) {
      console.error('Error al agregar comentario:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View className="bg-white p-4 rounded-lg mb-3 shadow">
      <View className="flex-row items-center mb-2">
        <Image
          source={{
            uri: item.perfil.foto_perfil
              ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${item.perfil.foto_perfil}`
              : 'https://via.placeholder.com/40'
          }}
          className="w-8 h-8 rounded-full mr-2"
        />
        <View>
          <Text className="font-bold text-primary-600">
            {item.perfil.username}
          </Text>
          <Text className="text-xs text-gray-500">
            {formatDate(item.created_at)}
          </Text>
        </View>
      </View>
      <Text className="text-gray-700">{item.contenido}</Text>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl h-3/4 p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Comentarios</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id.toString()}
            className="mb-4"
            ListEmptyComponent={
              <Text className="text-center text-gray-500">
                No hay comentarios aún. ¡Sé el primero en comentar!
              </Text>
            }
          />

          <View className="flex-row items-center">
            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Escribe un comentario..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
              multiline
            />
            <TouchableOpacity
              onPress={handleComment}
              className="bg-primary-500 p-2 rounded-full"
            >
              <Ionicons name="send" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
