import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';
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
  cancionUsuarioId?: string; // ID del usuario dueño de la canción
}

export default function CommentSection({ songId, currentUserId, cancionUsuarioId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;

  useEffect(() => {
    fetchComments();
    subscribeToComments();
  }, [songId]);

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
        perfil (
          username,
          foto_perfil
        )
      `)
      .eq('cancion_id', songId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar comentarios:', error);
    } else {
      setComments(data || []);
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

      // Crear notificación si el comentario no es del dueño de la canción
      if (cancionUsuarioId && currentUserId !== cancionUsuarioId) {
        const { error: notificationError } = await supabase
          .from('notificacion')
          .insert({
            usuario_id: cancionUsuarioId,
            tipo_notificacion: 'comentario_cancion',
            contenido_id: songId,
            mensaje: `Ha comentado en tu canción: "${newComment.slice(0, 50)}${newComment.length > 50 ? '...' : ''}"`,
            leido: false,
            usuario_origen_id: currentUserId
          });

        if (notificationError) {
          console.error('Error al crear notificación:', notificationError);
        }
      }

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
    <View className="mt-4">
      <Text className="text-lg font-bold mb-4">Comentarios</Text>
      <View className="flex-row items-center mb-4">
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
      <FlatList
        data={comments}
        renderItem={renderComment}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text className="text-center text-gray-500">
            No hay comentarios aún. ¡Sé el primero en comentar!
          </Text>
        }
      />
    </View>
  );
}
