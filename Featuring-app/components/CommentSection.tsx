import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal } from 'react-native';
import { supabase } from '@/lib/supabase';

interface Comment {
  id: number;
  user_id: string;
  content: string;
  created_at: string;
  username: string;
}

interface CommentSectionProps {
  isVisible: boolean;
  onClose: () => void;
  songId: number;
  currentUserId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ isVisible, onClose, songId, currentUserId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (isVisible) {
      fetchComments();
    }
  }, [isVisible]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comentarios')
      .select(`
        id,
        user_id,
        content,
        created_at,
        perfil (username)
      `)
      .eq('song_id', songId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
    } else {
      setComments(data.map(comment => ({
        ...comment,
        username: comment.perfil.username
      })));
    }
  };

  const handleAddComment = async () => {
    if (newComment.trim() === '') return;

    const { data, error } = await supabase
      .from('comentarios')
      .insert({
        song_id: songId,
        user_id: currentUserId,
        content: newComment.trim()
      })
      .select();

    if (error) {
      console.error('Error adding comment:', error);
    } else {
      setNewComment('');
      fetchComments();
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View className="bg-white p-2 mb-2 rounded">
      <Text className="font-bold">{item.username}</Text>
      <Text>{item.content}</Text>
    </View>
  );

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View className="flex-1 bg-black bg-opacity-50 justify-end">
        <View className="bg-white rounded-t-lg p-4 h-3/4">
          <TouchableOpacity onPress={onClose} className="self-end">
            <Text className="text-blue-500 text-lg">Cerrar</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold mb-4">Comentarios</Text>
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id.toString()}
            className="mb-4"
          />
          <View className="flex-row">
            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Escribe un comentario..."
              className="flex-1 border rounded p-2 mr-2"
            />
            <TouchableOpacity onPress={handleAddComment} className="bg-blue-500 rounded p-2">
              <Text className="text-white">Enviar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CommentSection;
