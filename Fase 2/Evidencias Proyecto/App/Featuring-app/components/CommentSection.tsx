import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Modal, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { icons } from "@/constants/index";
import { router } from "expo-router";
import { sendPushNotification } from '@/utils/pushNotifications';

interface Comment {
  id: number;
  usuario_id: string;
  contenido: string;
  created_at: string;
  perfil: {
    username: string | null;
    foto_perfil: string | null;
  };
  padre_id?: number | null;
  respuestas?: Comment[];
  respuestas_count?: number;
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
  const [showReplies, setShowReplies] = useState<{ [key: number]: boolean }>({});
  const [respondingTo, setRespondingTo] = useState<{ id: number; username: string } | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState('');
  const [selectedReplyId, setSelectedReplyId] = useState<number | null>(null);
  const [replyOptionsVisible, setReplyOptionsVisible] = useState(false);
  const [commentLikes, setCommentLikes] = useState<{ [key: number]: number }>({});
  const [likedComments, setLikedComments] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    let subscription: RealtimeChannel | null = null;
    
    if (isVisible) {
      fetchComments();
      
      subscription = supabase
        .channel(`comments-${songId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'comentario_cancion',
            filter: `cancion_id=eq.${songId}`
          },
          (payload) => {
            // Solo actualizar si es una inserción de otro usuario
            if (payload.eventType === 'INSERT' && payload.new.usuario_id !== currentUserId) {
              fetchComments();
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [songId, isVisible]);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from('comentario_cancion')
      .select(`
        id,
        usuario_id,
        contenido,
        created_at,
        padre_id,
        perfil!usuario_id (
          username,
          foto_perfil
        ),
        respuestas:comentario_cancion!padre_id (
          id,
          usuario_id,
          contenido,
          created_at,
          perfil:usuario_id (
            username,
            foto_perfil
          )
        )
      `)
      .eq('cancion_id', songId)
      .is('padre_id', null)
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
        },
        respuestas: comment.respuestas || [],
        respuestas_count: comment.respuestas?.length || 0
      }));
      setComments(formattedComments);

      // Obtener los likes de los comentarios
      const { data: likesData } = await supabase
        .from('likes_comentario_cancion')
        .select('*')
        .in('comentario_id', data.map(c => c.id));

      // Contar likes por comentario
      const likesCount: { [key: number]: number } = {};
      const userLikes: { [key: number]: boolean } = {};

      likesData?.forEach(like => {
        likesCount[like.comentario_id] = (likesCount[like.comentario_id] || 0) + 1;
        if (like.usuario_id === currentUserId) {
          userLikes[like.comentario_id] = true;
        }
      });

      setCommentLikes(likesCount);
      setLikedComments(userLikes);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim() || isSendingComment) return;

    try {
      setIsSendingComment(true);

      // Primero obtener los datos del perfil del usuario actual
      const { data: userProfile, error: profileError } = await supabase
        .from('perfil')
        .select('username, foto_perfil')
        .eq('usuario_id', currentUserId)
        .single();

      if (profileError) throw profileError;

      // Luego insertar el comentario
      const { data: commentData, error: commentError } = await supabase
        .from('comentario_cancion')
        .insert({
          cancion_id: songId,
          usuario_id: currentUserId,
          contenido: newComment.trim()
        })
        .select('id, usuario_id, contenido, created_at')
        .single();

      if (commentError) throw commentError;

      if (commentData) {
        // Crear el nuevo comentario con los datos del perfil
        const newComentario = {
          ...commentData,
          likes_count: 0,
          perfil: {
            username: userProfile.username,
            foto_perfil: userProfile.foto_perfil
          },
          isLiked: false,
          respuestas: [],
          respuestas_count: 0
        };
        
        // Actualizar estado local
        setComments(prevComments => [newComentario, ...prevComments]);
        setNewComment('');

        // Manejar notificaciones si es necesario
        if (currentUserId !== cancion.usuario_id) {
          const { data: songOwnerData } = await supabase
            .from('perfil')
            .select('push_token')
            .eq('usuario_id', cancion.usuario_id)
            .single();

          if (songOwnerData?.push_token) {
            await sendPushNotification(
              songOwnerData.push_token,
              '¡Nuevo Comentario!',
              `${userProfile.username} ha comentado en tu canción "${cancion.titulo}"`
            );
          }
        }
      }
    } catch (error) {
      console.error('Error al enviar comentario:', error);
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

        // Primero eliminar todas las respuestas asociadas
        await supabase
          .from("comentario_cancion")
          .delete()
          .eq("padre_id", selectedCommentId);

        // Luego eliminar el comentario principal
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

  const handleResponderComment = async (comentario: Comment) => {
    setRespondingTo({ id: comentario.id, username: comentario.perfil.username || '' });
    setRespuestaTexto(`@${comentario.perfil.username} `);
  };

  const handleEnviarRespuesta = async () => {
    if (!respuestaTexto.trim() || !respondingTo || isSendingComment) return;

    try {
      setIsSendingComment(true);

      // Verificar que no sea el mismo usuario
      const comentarioOriginal = comments.find(c => c.id === respondingTo.id);
      if (!comentarioOriginal || comentarioOriginal.usuario_id === currentUserId) {
        setIsSendingComment(false);
        return;
      }

      // Verificar respuestas previas del usuario en este comentario hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: previousReplies, error: previousRepliesError } = await supabase
        .from('comentario_cancion')
        .select('id')
        .eq('padre_id', respondingTo.id)
        .eq('usuario_id', currentUserId)
        .gte('created_at', today.toISOString());

      if (previousRepliesError) throw previousRepliesError;

      // Obtener datos del usuario que responde
      const { data: userData, error: userError } = await supabase
        .from('perfil')
        .select('username, foto_perfil')
        .eq('usuario_id', currentUserId)
        .single();

      if (userError) throw userError;

      // Obtener token de push del dueño del comentario
      const { data: commentOwnerData, error: ownerError } = await supabase
        .from('perfil')
        .select('push_token')
        .eq('usuario_id', comentarioOriginal.usuario_id)
        .single();

      if (ownerError) throw ownerError;

      // Insertar la respuesta
      const { data: commentData, error: commentError } = await supabase
        .from('comentario_cancion')
        .insert({
          cancion_id: songId,
          usuario_id: currentUserId,
          contenido: respuestaTexto.trim(),
          padre_id: respondingTo.id
        })
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
        .single();

      if (commentError) throw commentError;

      // Verificar si ya existe una notificación de respuesta de este usuario hoy
      const { data: existingNotification, error: notificationError } = await supabase
        .from('notificacion')
        .select('id, mensaje')
        .eq('usuario_id', comentarioOriginal.usuario_id)
        .eq('usuario_origen_id', currentUserId)
        .eq('tipo_notificacion', 'respuesta_comentario')
        .eq('contenido_id', respondingTo.id)
        .gte('created_at', today.toISOString())
        .single();

      if (!notificationError || notificationError.code === 'PGRST116') {
        let mensaje;
        if (existingNotification) {
          // Actualizar la notificación existente
          const replyCount = previousReplies.length + 1;
          mensaje = `Ha respondido a tu comentario en "${cancion.titulo}": "${respuestaTexto.slice(0, 30)}${respuestaTexto.length > 30 ? '...' : ''}" y ${replyCount - 1} respuestas más`;
          
          await supabase
            .from('notificacion')
            .update({ mensaje })
            .eq('id', existingNotification.id);
        } else {
          // Crear nueva notificación solo si es la primera respuesta del día
          mensaje = `Ha respondido a tu comentario en "${cancion.titulo}": "${respuestaTexto.slice(0, 50)}${respuestaTexto.length > 50 ? '...' : ''}"`;
          
          await supabase
            .from('notificacion')
            .insert({
              usuario_id: comentarioOriginal.usuario_id,
              tipo_notificacion: 'respuesta_comentario',
              leido: false,
              usuario_origen_id: currentUserId,
              contenido_id: respondingTo.id,
              mensaje
            });

          // Enviar notificación push solo para la primera respuesta del día
          if (commentOwnerData?.push_token) {
            await sendPushNotification(
              commentOwnerData.push_token,
              '¡Nueva Respuesta!',
              `${userData.username} ha respondido a tu comentario en "${cancion.titulo}"`
            );
          }
        }
      }

      // Actualizar el estado local
      setComments(prevComments => 
        prevComments.map(comment => 
          comment.id === respondingTo.id
            ? {
                ...comment,
                respuestas: [...(comment.respuestas || []), commentData],
                respuestas_count: (comment.respuestas_count || 0) + 1
              }
            : comment
        )
      );

      // Limpiar el estado de respuesta
      setRespondingTo(null);
      setRespuestaTexto('');
      
      // Mostrar las respuestas del comentario al que se respondió
      setShowReplies(prev => ({
        ...prev,
        [respondingTo.id]: true
      }));

    } catch (error) {
      console.error('Error al enviar respuesta:', error);
      Alert.alert('Error', 'No se pudo enviar la respuesta');
    } finally {
      setIsSendingComment(false);
    }
  };

  const toggleReplies = (commentId: number) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleReplyOptions = (respuesta: Comment) => {
    if (respuesta.usuario_id === currentUserId) {
      setSelectedReplyId(respuesta.id);
      setReplyOptionsVisible(true);
    }
  };

  const handleDeleteReply = async () => {
    if (selectedReplyId) {
      try {
        const parentComment = comments.find(comment => 
          comment.respuestas?.some(respuesta => respuesta.id === selectedReplyId)
        );

        if (!parentComment) {
          Alert.alert("Error", "No se encontró el comentario padre");
          return;
        }

        const selectedReply = parentComment.respuestas?.find(r => r.id === selectedReplyId);

        if (!selectedReply || selectedReply.usuario_id !== currentUserId) {
          Alert.alert("Error", "No tienes permiso para eliminar esta respuesta");
          return;
        }

        await supabase
          .from("comentario_cancion")
          .delete()
          .eq("id", selectedReplyId);

        // Actualizar el estado local
        setComments(prevComments => 
          prevComments.map(comment => 
            comment.id === parentComment.id
              ? {
                  ...comment,
                  respuestas: comment.respuestas?.filter(r => r.id !== selectedReplyId) || [],
                  respuestas_count: (comment.respuestas_count || 1) - 1
                }
              : comment
          )
        );

        setReplyOptionsVisible(false);
        Alert.alert("Éxito", "Respuesta eliminada correctamente");
      } catch (error) {
        console.error("Error al eliminar la respuesta:", error);
        Alert.alert("Error", "No se pudo eliminar la respuesta");
      }
    }
  };

  const handleLikeComment = async (commentId: number) => {
    try {
      const isLiked = likedComments[commentId];

      if (isLiked) {
        // Quitar like
        await supabase
          .from('likes_comentario_cancion')
          .delete()
          .eq('comentario_id', commentId)
          .eq('usuario_id', currentUserId);

        setCommentLikes(prev => ({
          ...prev,
          [commentId]: (prev[commentId] || 1) - 1
        }));
        setLikedComments(prev => ({
          ...prev,
          [commentId]: false
        }));
      } else {
        // Dar like
        await supabase
          .from('likes_comentario_cancion')
          .insert({
            comentario_id: commentId,
            usuario_id: currentUserId
          });

        setCommentLikes(prev => ({
          ...prev,
          [commentId]: (prev[commentId] || 0) + 1
        }));
        setLikedComments(prev => ({
          ...prev,
          [commentId]: true
        }));

        // Enviar notificación si no es tu propio comentario
        const comment = comments.find(c => c.id === commentId);
        if (comment && comment.usuario_id !== currentUserId) {
          const { data: userData } = await supabase
            .from('perfil')
            .select('username')
            .eq('usuario_id', currentUserId)
            .single();

          const { data: commentOwnerData } = await supabase
            .from('perfil')
            .select('push_token')
            .eq('usuario_id', comment.usuario_id)
            .single();

          // Crear notificación
          await supabase.from('notificacion').insert({
            usuario_id: comment.usuario_id,
            tipo_notificacion: 'like_comentario',
            leido: false,
            usuario_origen_id: currentUserId,
            contenido_id: commentId,
            mensaje: `Le ha gustado tu comentario en "${cancion.titulo}"`
          });

          // Enviar push notification
          if (commentOwnerData?.push_token) {
            await sendPushNotification(
              commentOwnerData.push_token,
              '¡Nuevo Like en tu comentario!',
              `A ${userData?.username} le gustó tu comentario en "${cancion.titulo}"`
            );
          }
        }
      }
    } catch (error) {
      console.error('Error al manejar like:', error);
      Alert.alert('Error', 'No se pudo procesar tu like');
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View key={`comment-${item.id}`} className="bg-white p-4 rounded-lg mb-3 shadow">
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
      
      {/* Botones de acción */}
      <View className="flex-row items-center mt-2 ml-10">
        <TouchableOpacity
          onPress={() => handleLikeComment(item.id)}
          className="flex-row items-center mr-4"
        >
          <Image
            source={likedComments[item.id] ? icons.hearto : icons.heart}
            className="w-4 h-4 mr-1"
            style={{ tintColor: likedComments[item.id] ? "#6D29D2" : undefined }}
          />
          <Text className="text-xs text-primary-500 font-JakartaBold">
            {commentLikes[item.id] || 0}
          </Text>
        </TouchableOpacity>

        {item.usuario_id !== currentUserId && (
          <TouchableOpacity
            onPress={() => handleResponderComment(item)}
            className="mr-4"
          >
            <Text className="text-primary-500 font-JakartaMedium text-sm">
              Responder
            </Text>
          </TouchableOpacity>
        )}
        
        {item.respuestas_count > 0 && (
          <TouchableOpacity
            onPress={() => toggleReplies(item.id)}
            className="flex-row items-center"
          >
            <Text className="text-primary-500 font-JakartaMedium text-sm">
              {showReplies[item.id] ? 'Ocultar' : `Ver ${item.respuestas_count} respuestas`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Campo de respuesta */}
      {respondingTo?.id === item.id && (
        <View className="mt-2 ml-10">
          <TextInput
            value={respuestaTexto}
            onChangeText={setRespuestaTexto}
            placeholder="Escribe tu respuesta..."
            className="bg-gray-100 rounded-lg px-4 py-2 mb-2"
            multiline
            editable={!isSendingComment}
          />
          <TouchableOpacity
            onPress={handleEnviarRespuesta}
            disabled={isSendingComment || !respuestaTexto.trim()}
            className={`${
              isSendingComment || !respuestaTexto.trim() 
                ? 'bg-gray-400' 
                : 'bg-primary-500'
            } p-2 rounded-lg`}
          >
            {isSendingComment ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="text-white text-center font-JakartaMedium">
                Enviar respuesta
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Respuestas */}
      {showReplies[item.id] && item.respuestas && item.respuestas.length > 0 && (
        <View className="ml-10 mt-2">
          {item.respuestas.map((respuesta) => (
            <View key={`reply-${respuesta.id}`} className="bg-gray-50 p-3 rounded-lg mb-2">
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center flex-1">
                  <Image
                    source={{
                      uri: respuesta.perfil.foto_perfil
                        ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${respuesta.perfil.foto_perfil}`
                        : 'https://via.placeholder.com/40'
                    }}
                    className="w-6 h-6 rounded-full mr-2"
                  />
                  <Text className="font-JakartaBold text-primary-600">
                    {respuesta.perfil.username}
                  </Text>
                </View>
                {respuesta.usuario_id === currentUserId && (
                  <TouchableOpacity
                    onPress={() => handleReplyOptions(respuesta)}
                    className="ml-2"
                  >
                    <Image source={icons.trespuntos} className="w-5 h-5" />
                  </TouchableOpacity>
                )}
              </View>
              <Text className="mt-1 text-gray-700">{respuesta.contenido}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const getTotalCommentsCount = () => {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.respuestas?.length || 0);
    }, 0);
  };

  const handleCloseCommentsModal = () => {
    setCommentsModalVisible(false);
    router.setParams({ showComments: undefined });
  };

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
                {getTotalCommentsCount()}
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
            keyExtractor={(item) => `comment-${item.id}`}
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

      {/* Modal para opciones de respuesta */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={replyOptionsVisible}
        onRequestClose={() => setReplyOptionsVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 justify-center items-center bg-black bg-opacity-50"
          activeOpacity={1}
          onPress={() => setReplyOptionsVisible(false)}
        >
          <View className="bg-white rounded-lg p-4 w-3/4">
            <TouchableOpacity
              className="bg-red-500 rounded-lg p-2"
              onPress={handleDeleteReply}
            >
              <Text className="text-white text-center font-JakartaBold">
                Eliminar respuesta
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}