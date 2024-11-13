import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Modal, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { icons } from "@/constants/index";
import { router } from "expo-router";

interface Comment {
  id: number;
  usuario_id: string;
  contenido: string;
  created_at: string;
  perfil: {
    username: string | null;
    foto_perfil: string | null;
  };
}

interface CommentSectionProps {
  songId: number;
  currentUserId: string;
  isVisible: boolean;
  onClose: () => void;
  cancion: {
    id: number;
    titulo: string;
    usuario_id: string;
  };
}

export default function CommentSection({ songId, currentUserId, isVisible, onClose, cancion }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [commentSortOrder, setCommentSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [commentOptionsVisible, setCommentOptionsVisible] = useState(false);
  const [editingComment, setEditingComment] = useState("");

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
        perfil!usuario_id (
          username,
          foto_perfil
        )
      `)
      .eq('cancion_id', songId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar comentarios:', error);
    } else {
      const formattedComments: Comment[] = data.map(comment => ({
        id: comment.id,
        usuario_id: comment.usuario_id,
        contenido: comment.contenido,
        created_at: comment.created_at,
        perfil: {
          username: comment.perfil?.username || "Usuario desconocido",
          foto_perfil: comment.perfil?.foto_perfil
        }
      }));
      setComments(formattedComments);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || isSendingComment) return;

    try {
      setIsSendingComment(true);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: previousComments, error: previousCommentsError } = await supabase
        .from('comentario_cancion')
        .select('id')
        .eq('cancion_id', cancion.id)
        .eq('usuario_id', currentUserId)
        .gte('created_at', today.toISOString());

      if (previousCommentsError) throw previousCommentsError;

      const { data: userData, error: userError } = await supabase
        .from('perfil')
        .select('username, foto_perfil')
        .eq('usuario_id', currentUserId)
        .single();

      if (userError) throw userError;

      const { data: songOwnerData, error: ownerError } = await supabase
        .from('perfil')
        .select('push_token')
        .eq('usuario_id', cancion.usuario_id)
        .single();

      if (ownerError) throw ownerError;

      const { data: commentData, error: commentError } = await supabase
        .from('comentario_cancion')
        .insert({
          cancion_id: cancion.id,
          usuario_id: currentUserId,
          contenido: newComment.trim()
        })
        .select()
        .single();

      if (commentError) throw commentError;

      if (currentUserId !== cancion.usuario_id) {
        const { data: existingNotification, error: notificationError } = await supabase
          .from('notificacion')
          .select('id, mensaje')
          .eq('usuario_id', cancion.usuario_id)
          .eq('usuario_origen_id', currentUserId)
          .eq('tipo_notificacion', 'comentario_cancion')
          .eq('contenido_id', cancion.id)
          .gte('created_at', today.toISOString())
          .single();

        if (!notificationError || notificationError.code === 'PGRST116') {
          let mensaje;
          if (existingNotification) {
            const commentCount = previousComments.length + 1;
            mensaje = `Ha comentado en tu canción "${cancion.titulo}": "${newComment.slice(0, 30)}${newComment.length > 30 ? '...' : ''}" y ${commentCount - 1} comentarios más`;
            
            await supabase
              .from('notificacion')
              .update({ mensaje })
              .eq('id', existingNotification.id);
          } else {
            mensaje = `Ha comentado en tu canción "${cancion.titulo}": "${newComment.slice(0, 50)}${newComment.length > 50 ? '...' : ''}"`;
            
            await supabase
              .from('notificacion')
              .insert({
                usuario_id: cancion.usuario_id,
                tipo_notificacion: 'comentario_cancion',
                leido: false,
                usuario_origen_id: currentUserId,
                contenido_id: cancion.id,
                mensaje
              });

            if (songOwnerData?.push_token) {
              await sendPushNotification(
                songOwnerData.push_token,
                '¡Nuevo Comentario!',
                `${userData.username} ha comentado en tu canción "${cancion.titulo}"`
              );
            }
          }
        }
      }

      const newCommentFormatted = {
        id: commentData.id,
        usuario_id: currentUserId,
        contenido: newComment.trim(),
        created_at: commentData.created_at,
        perfil: {
          username: userData.username,
          foto_perfil: userData.foto_perfil
        }
      };

      setComments(prevComments => [newCommentFormatted, ...prevComments]);
      setNewComment('');

    } catch (error) {
      console.error('Error al agregar comentario:', error);
      Alert.alert('Error', 'No se pudo enviar el comentario');
    } finally {
      setIsSendingComment(false);
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

  const sortComments = (order: "newest" | "oldest") => {
    setCommentSortOrder(order);
    let sortedComments = [...comments];
    
    if (order === "newest") {
      sortedComments.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      sortedComments.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    }
    
    setComments(sortedComments);
  };

  const handleCommentOptions = (comment: Comment) => {
    if (comment.usuario_id === currentUserId || cancion.usuario_id === currentUserId) {
      setSelectedCommentId(comment.id);
      setEditingComment(comment.contenido);
      setCommentOptionsVisible(true);
    }
  };

  const handleDeleteComment = async () => {
    if (selectedCommentId) {
      try {
        const selectedComment = comments.find(c => c.id === selectedCommentId);
        
        if (!selectedComment || 
            (selectedComment.usuario_id !== currentUserId && 
             cancion.usuario_id !== currentUserId)) {
          Alert.alert("Error", "No tienes permiso para eliminar este comentario");
          return;
        }

        await supabase
          .from("comentario_cancion")
          .delete()
          .eq("id", selectedCommentId);

        setComments(comments.filter(c => c.id !== selectedCommentId));
        setCommentOptionsVisible(false);
        Alert.alert("Éxito", "Comentario eliminado correctamente");
      } catch (error) {
        console.error("Error al eliminar el comentario:", error);
        Alert.alert("Error", "No se pudo eliminar el comentario");
      }
    }
  };

  const handleEditComment = async () => {
    if (selectedCommentId && editingComment.trim()) {
      try {
        const { data, error } = await supabase
          .from("comentario_cancion")
          .update({ contenido: editingComment.trim() })
          .eq("id", selectedCommentId)
          .select()
          .single();

        if (error) throw error;

        setComments(comments.map(c => 
          c.id === selectedCommentId 
            ? { ...c, contenido: editingComment.trim() } 
            : c
        ));
        setCommentOptionsVisible(false);
      } catch (error) {
        console.error("Error al editar el comentario:", error);
        Alert.alert("Error", "No se pudo editar el comentario");
      }
    }
  };

  const toggleSortOptions = () => {
    setShowSortOptions(!showSortOptions);
  };

  const handleProfilePress = (userId: string) => {
    router.push(`/public-profile/${userId}`);
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View className="bg-white p-4 rounded-lg mb-3 shadow">
      <View className="flex-row justify-between items-start mb-2">
        <TouchableOpacity 
          onPress={() => handleProfilePress(item.usuario_id)}
          className="flex-row items-center flex-1"
        >
          <Image
            source={{
              uri: item.perfil.foto_perfil
                ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${item.perfil.foto_perfil}`
                : 'https://via.placeholder.com/40'
            }}
            className="w-8 h-8 rounded-full mr-2"
          />
          <View>
            <Text className="font-JakartaBold text-primary-600">
              {item.perfil.username}
            </Text>
            <Text className="text-xs text-gray-500">
              {formatDate(item.created_at)}
            </Text>
          </View>
        </TouchableOpacity>
        {(item.usuario_id === currentUserId || cancion.usuario_id === currentUserId) && (
          <TouchableOpacity
            onPress={() => handleCommentOptions(item)}
            className="ml-2"
          >
            <Image source={icons.trespuntos} className="w-5 h-5" />
          </TouchableOpacity>
        )}
      </View>
      <Text className="text-gray-700 ml-10">{item.contenido}</Text>
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
            <TouchableOpacity onPress={toggleSortOptions}>
              <Image
                source={icons.shuffle}
                className="w-6 h-6"
                style={{ tintColor: "#00BFA5" }}
              />
            </TouchableOpacity>
            <View className="flex-row items-center">
              <Text className="text-secondary-500 font-JakartaBold mr-2">
                {comments.length}
              </Text>
              <Text className="font-JakartaBold text-lg">Comentarios</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-secondary-500 font-JakartaBold">
                Cerrar
              </Text>
            </TouchableOpacity>
          </View>

          {showSortOptions && (
            <View className="flex-row justify-center mb-4">
              <TouchableOpacity
                onPress={() => sortComments("newest")}
                className="mr-4"
              >
                <Text
                  className={`text-sm ${
                    commentSortOrder === "newest"
                      ? "text-secondary-500 font-bold"
                      : "text-gray-500"
                  }`}
                >
                  Más nuevos
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => sortComments("oldest")}>
                <Text
                  className={`text-sm ${
                    commentSortOrder === "oldest"
                      ? "text-secondary-500 font-bold"
                      : "text-gray-500"
                  }`}
                >
                  Más antiguos
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id.toString()}
            className="mb-4"
            ListEmptyComponent={
              <Text className="text-center text-gray-500 font-JakartaMedium">
                No hay comentarios aún. ¡Sé el primero en comentar!
              </Text>
            }
          />

          <View className="mt-2">
            <View className="flex-row items-center">
              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder="Escribe un comentario..."
                className={`flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2 font-JakartaMedium ${
                  isSendingComment ? 'opacity-50' : ''
                }`}
                multiline
                editable={!isSendingComment}
                placeholderTextColor="#858585"
              />
              <TouchableOpacity
                onPress={handleComment}
                disabled={isSendingComment || !newComment.trim()}
                className={`${
                  isSendingComment || !newComment.trim() 
                    ? 'bg-gray-400' 
                    : 'bg-primary-500'
                } p-2 rounded-full items-center justify-center w-12 h-12`}
                style={{ opacity: isSendingComment ? 0.5 : 1 }}
              >
                {isSendingComment ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Ionicons name="send" size={24} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Modal para opciones de comentario */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={commentOptionsVisible}
        onRequestClose={() => setCommentOptionsVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 justify-center items-center bg-black bg-opacity-50"
          activeOpacity={1}
          onPress={() => setCommentOptionsVisible(false)}
        >
          <View className="bg-white rounded-lg p-4 w-3/4">
            {selectedCommentId && comments.find(c => c.id === selectedCommentId)?.usuario_id === currentUserId ? (
              <>
                <TextInput
                  className="border border-gray-300 rounded-lg p-2 mb-4"
                  value={editingComment}
                  onChangeText={setEditingComment}
                  multiline
                />
                <TouchableOpacity
                  className="bg-primary-500 rounded-lg p-2 mb-2"
                  onPress={handleEditComment}
                >
                  <Text className="text-white text-center font-JakartaBold">
                    Editar comentario
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-red-500 rounded-lg p-2"
                  onPress={handleDeleteComment}
                >
                  <Text className="text-white text-center font-JakartaBold">
                    Eliminar comentario
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                className="bg-red-500 rounded-lg p-2"
                onPress={handleDeleteComment}
              >
                <Text className="text-white text-center font-JakartaBold">
                  Eliminar comentario
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}
