import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Modal,
  TextInput,
  FlatList,
  Alert,
} from "react-native";
import { Video as ExpoVideo, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";
import { useVideo } from "@/contexts/VideoContext";
import Constants from "expo-constants";
import { useLocalSearchParams } from 'expo-router';
import { sendPushNotification } from '@/utils/pushNotifications';
import { validateContent } from '@/utils/contentFilter';
import { router } from 'expo-router';

const { width, height } = Dimensions.get("window");

interface Perfil {
  usuario_id: string;
  username: string;
  foto_perfil: string | null;
  // Añade otras propiedades del perfil si son necesarias
}

interface Video {
  id: number;
  usuario_id: string;
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
  isActive: boolean;
  height: number;
  onDeleteVideo: (videoId: number) => void;
  onUpdateVideo: (videoId: number, updatedData: { descripcion: string }) => void;
  setVideos: React.Dispatch<React.SetStateAction<Video[]>>;
  refetchVideos: () => Promise<void>;
}

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  currentUserId,
  isActive,
  height,
  onDeleteVideo,
  onUpdateVideo,
  setVideos,
  refetchVideos,
}) => {
  const { currentPlayingId, isScreenFocused, setCurrentPlayingId } = useVideo();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const videoRef = useRef<ExpoVideo>(null);
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editDescripcion, setEditDescripcion] = useState(video.descripcion);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState<string | null>(null);
  const [isReportConfirmationVisible, setIsReportConfirmationVisible] = useState(false);
  const [userReportCount, setUserReportCount] = useState(0);
  const [showRegularComments, setShowRegularComments] = useState(false);
  const [showNotificationComments, setShowNotificationComments] = useState(false);

  const { scrollToId, showComments: shouldShowComments } = useLocalSearchParams<{
    scrollToId?: string;
    showComments?: string;
  }>();

  useEffect(() => {
    if (isActive && isScreenFocused && currentPlayingId === video.id) {
      videoRef.current?.playAsync();
      setIsPlaying(true);
    } else {
      videoRef.current?.pauseAsync();
      setIsPlaying(false);
    }
  }, [isActive, isScreenFocused, currentPlayingId, video.id]);

  useEffect(() => {
    checkIfLiked();
    fetchLikesCount();
    fetchComentarios();
  }, [video.id]);

  useEffect(() => {
    if (shouldShowComments === 'true' && scrollToId === video.id.toString()) {
      setShowNotificationComments(true);
      fetchComentarios();
    }
  }, [shouldShowComments, scrollToId, video.id]);

  const togglePlayPause = async () => {
    try {
      if (isPlaying) {
        await videoRef.current?.pauseAsync();
        setCurrentPlayingId(null);
      } else {
        await videoRef.current?.playAsync();
        setCurrentPlayingId(video.id);
      }
      setIsPlaying(!isPlaying);
      setShowPlayPauseIcon(true);
    } catch (error) {
      console.error("Error toggling play/pause:", error);
    }
  };

  const checkIfLiked = async () => {
    const { data } = await supabase
      .from("likes_video")
      .select("*")
      .eq("video_id", video.id)
      .eq("usuario_id", currentUserId)
      .single();
    setIsLiked(!!data);
  };

  const fetchLikesCount = async () => {
    const { count } = await supabase
      .from("likes_video")
      .select("*", { count: "exact", head: true })
      .eq("video_id", video.id);
    setLikesCount(count || 0);
  };

  const handleLike = async () => {
    if (isLiked) {
      await supabase
        .from("likes_video")
        .delete()
        .eq("video_id", video.id)
        .eq("usuario_id", currentUserId);
      
      setLikesCount((prev) => prev - 1);
      setIsLiked(false);
    } else {
      try {
        // Obtener el username del usuario que da like
        const { data: userData, error: userError } = await supabase
          .from('perfil')
          .select('username')
          .eq('usuario_id', currentUserId)
          .single();

        if (userError) throw userError;

        // Obtener el token de push del dueño del video
        const { data: videoOwnerData, error: ownerError } = await supabase
          .from('perfil')
          .select('push_token')
          .eq('usuario_id', video.usuario_id)
          .single();

        if (ownerError) throw ownerError;

        const { data } = await supabase
          .from("likes_video")
          .insert({ video_id: video.id, usuario_id: currentUserId })
          .select()
          .single();

        if (data) {
          setLikesCount((prev) => prev + 1);
          setIsLiked(true);
          
          // Si el usuario que da like no es el dueño del video
          if (currentUserId !== video.usuario_id) {
            // Enviar notificación push si el usuario tiene token
            if (videoOwnerData?.push_token) {
              await sendPushNotification(
                videoOwnerData.push_token,
                '¡Nuevo Like en tu video!',
                `A ${userData.username} le ha gustado tu video`
              );
            }

            // Crear notificación en la base de datos
            const { error: notificationError } = await supabase
              .from('notificacion')
              .insert({
                usuario_id: video.usuario_id,
                tipo_notificacion: 'like_video',
                leido: false,
                usuario_origen_id: currentUserId,
                contenido_id: video.id,
                mensaje: `Le ha dado me gusta a tu video`
              });

            if (notificationError) {
              console.error('Error al crear notificación de like:', notificationError);
            }
          }
        }
      } catch (error) {
        console.error('Error al dar like:', error);
      }
    }
  };

  const fetchComentarios = async () => {
    try {
      // 1. Obtener los comentarios
      const { data: comentariosData, error: comentariosError } = await supabase
        .from("comentario_video")
        .select(`
          *,
          perfil (
            username,
            foto_perfil
          )
        `)
        .eq("video_id", video.id)
        .order("created_at", { ascending: false });

      if (comentariosError) throw comentariosError;

      if (comentariosData) {
        // 2. Obtener los likes de los comentarios
        const comentariosIds = comentariosData.map(c => c.id);
        const { data: likesData, error: likesError } = await supabase
          .from("likes_comentario_video")
          .select('*')
          .in('comentario_id', comentariosIds);

        if (likesError) throw likesError;

        // 3. Procesar los comentarios con sus likes
        const comentariosProcesados = comentariosData.map(comentario => {
          const comentarioLikes = likesData?.filter(like => like.comentario_id === comentario.id) || [];
          return {
            ...comentario,
            isLiked: comentarioLikes.some(like => like.usuario_id === currentUserId),
            likes_count: comentarioLikes.length
          };
        });

        setComentarios(comentariosProcesados);
      }
    } catch (error) {
      console.error("Error al obtener comentarios:", error);
    }
  };

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12;
    const day = date.getDate();
    const month = date.toLocaleString("es-ES", { month: "long" });

    return `${day} de ${month} ${formattedHours}:${minutes} ${ampm}`;
  };

  const handleComment = async () => {
    if (nuevoComentario.trim()) {
      // Validar comentario
      const commentValidation = validateContent(nuevoComentario, 'comentario');
      if (!commentValidation.isValid) {
        Alert.alert("Error", commentValidation.message);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("comentario_video")
          .insert({
            video_id: video.id,
            usuario_id: currentUserId,
            comentario: nuevoComentario.trim(),
          })
          .select(
            `
            *,
            perfil:perfil (
              username,
              foto_perfil
            )
          `
          )
          .single();

        if (error) throw error;

        if (data) {
          setComentarios([data, ...comentarios]);
          setNuevoComentario("");

          // Crear notificación si el comentario no es del dueño del video
          if (currentUserId !== video.usuario_id) {
            const { error: notificationError } = await supabase
              .from('notificacion')
              .insert({
                usuario_id: video.usuario_id,
                tipo_notificacion: 'comentario_video',
                contenido_id: video.id,
                mensaje: `Ha comentado en tu video: "${nuevoComentario.slice(0, 50)}${nuevoComentario.length > 50 ? '...' : ''}"`,
                leido: false,
                usuario_origen_id: currentUserId
              });

            if (notificationError) {
              console.error('Error al crear notificación:', notificationError);
            }
          }
        }
      } catch (error) {
        console.error('Error al comentar:', error);
      }
    }
  };

  const handleCommentLike = async (comentarioId: number) => {
    const comentario = comentarios.find((c) => c.id === comentarioId);
    if (!comentario) return;

    const newIsLiked = !comentario.isLiked;

    try {
      if (newIsLiked) {
        // Obtener el username del usuario que da like
        const { data: userData, error: userError } = await supabase
          .from('perfil')
          .select('username')
          .eq('usuario_id', currentUserId)
          .single();

        if (userError) throw userError;

        // Obtener el token de push del dueño del comentario
        const { data: commentOwnerData, error: ownerError } = await supabase
          .from('perfil')
          .select('push_token')
          .eq('usuario_id', comentario.usuario_id)
          .single();

        if (ownerError) throw ownerError;

        // Dar like
        await supabase
          .from("likes_comentario_video")
          .insert({ 
            comentario_id: comentarioId,
            usuario_id: currentUserId 
          });

        // Actualizar el estado local inmediatamente
        setComentarios(prevComentarios => 
          prevComentarios.map(c => 
            c.id === comentarioId 
              ? {
                  ...c,
                  isLiked: true,
                  likes_count: (c.likes_count || 0) + 1
                }
              : c
          )
        );

        // Si el usuario que da like no es el dueño del comentario
        if (currentUserId !== comentario.usuario_id) {
          // Enviar notificación push si el usuario tiene token
          if (commentOwnerData?.push_token) {
            await sendPushNotification(
              commentOwnerData.push_token,
              '¡Nuevo Like en tu comentario!',
              `A ${userData.username} le gustó tu comentario en el video`
            );
          }

          // Crear notificación en la base de datos
          const { error: notificationError } = await supabase
            .from('notificacion')
            .insert({
              usuario_id: comentario.usuario_id,
              tipo_notificacion: 'like_comentario_video',
              leido: false,
              usuario_origen_id: currentUserId,
              contenido_id: comentarioId,
              mensaje: `Le ha dado me gusta a tu comentario en el video`
            });

          if (notificationError) {
            console.error('Error al crear notificación de like en comentario:', notificationError);
          }
        }
      } else {
        // Quitar like
        await supabase
          .from("likes_comentario_video")
          .delete()
          .eq("comentario_id", comentarioId)
          .eq("usuario_id", currentUserId);

        // Actualizar el estado local inmediatamente
        setComentarios(prevComentarios => 
          prevComentarios.map(c => 
            c.id === comentarioId 
              ? {
                  ...c,
                  isLiked: false,
                  likes_count: Math.max(0, (c.likes_count || 0) - 1)
                }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Error al dar/quitar like al comentario:", error);
    }
  };

  const handleDeleteVideo = async () => {
    Alert.alert(
      "Eliminar video",
      "¿Ests seguro de que quieres eliminar este video? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              // Primero, eliminar los likes asociados al video
              const { error: likesDeleteError } = await supabase
                .from("likes_video")
                .delete()
                .eq("video_id", video.id);

              if (likesDeleteError) throw likesDeleteError;

              // Luego, eliminar los comentarios asociados al video
              const { error: commentsDeleteError } = await supabase
                .from("comentario_video")
                .delete()
                .eq("video_id", video.id);

              if (commentsDeleteError) throw commentsDeleteError;

              // Ahora, eliminar el archivo de video del storage
              if (video.url) {
                const videoFileName = video.url.split("/").pop();
                if (videoFileName) {
                  const { error: deleteStorageError } = await supabase.storage
                    .from("videos")
                    .remove([`${video.usuario_id}/${videoFileName}`]);

                  if (deleteStorageError) throw deleteStorageError;
                }
              }

              // Finalmente, eliminar el video de la base de datos
              const { error: deleteDbError } = await supabase
                .from("video")
                .delete()
                .eq("id", video.id);

              if (deleteDbError) throw deleteDbError;

              onDeleteVideo(video.id);
              await refetchVideos();
              Alert.alert("Éxito", "El video ha sido eliminado");
            } catch (error) {
              console.error("Error al eliminar el video:", error);
              Alert.alert("Error", "No se pudo eliminar el video");
            }
          },
        },
      ]
    );
  };

  const handleEditVideo = async () => {
    try {
      const { error } = await supabase
        .from("video")
        .update({ descripcion: editDescripcion })
        .eq("id", video.id);

      if (error) throw error;

      onUpdateVideo(video.id, {
        descripcion: editDescripcion,
      });
      await refetchVideos();
      setIsEditModalVisible(false);
      Alert.alert("Éxito", "El video ha sido actualizado");
    } catch (error) {
      console.error("Error al actualizar el video:", error);
      Alert.alert("Error", "No se pudo actualizar el video");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const { error } = await supabase
        .from("comentario_video")
        .delete()
        .eq("id", commentId)
        .eq("usuario_id", currentUserId);

      if (error) throw error;

      setComentarios((prevComentarios) =>
        prevComentarios.filter((c) => c.id !== commentId)
      );
    } catch (error) {
      console.error("Error al eliminar el comentario:", error);
      Alert.alert("Error", "No se pudo eliminar el comentario");
    }
  };

  const formatUploadDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleOptionsPress = () => {
    setShowOptionsModal(true);
  };

  const handleReportPress = () => {
    setShowOptionsModal(false);
    setShowReportModal(true);
  };

  const handleReportConfirm = async () => {
    if (selectedReportReason) {
      const canReport = await checkReportEligibility();
      if (canReport) {
        setIsReportConfirmationVisible(true);
      }
    }
  };

  const checkReportEligibility = async () => {
    try {
      // Verificar si el usuario ya ha reportado este contenido
      const { data: existingReport, error: existingReportError } = await supabase
        .from('reporte_usuario')
        .select('id')
        .eq('usuario_id', currentUserId)
        .eq('contenido_id', video.id)
        .eq('tipo_contenido', 'video')
        .single();

      if (existingReportError && existingReportError.code !== 'PGRST116') {
        throw existingReportError;
      }

      if (existingReport) {
        Alert.alert('Error', 'Ya has reportado este contenido anteriormente.');
        return false;
      }

      // Verificar el número de reportes en las últimas 12 horas
      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      const { data: recentReports, error: recentReportsError } = await supabase
        .from('reporte_usuario')
        .select('id')
        .eq('usuario_id', currentUserId)
        .gte('created_at', twelveHoursAgo);

      if (recentReportsError) {
        throw recentReportsError;
      }

      const reportCount = recentReports ? recentReports.length : 0;
      setUserReportCount(reportCount);

      if (reportCount >= 3) {
        Alert.alert('Límite alcanzado', 'Has alcanzado el límite de 3 reportes en las últimas 12 horas.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error al verificar elegibilidad para reportar:', error);
      Alert.alert('Error', 'No se pudo verificar tu elegibilidad para reportar. Por favor, intenta de nuevo más tarde.');
      return false;
    }
  };

  const sendReport = async () => {
    try {
      const { data: reportData, error: reportError } = await supabase
        .from('reporte')
        .insert({
          usuario_reportante_id: currentUserId,
          usuario_reportado_id: video.usuario_id,
          contenido_id: video.id,
          tipo_contenido: 'video',
          razon: selectedReportReason,
          estado: 'pendiente'
        })
        .select()
        .single();

      if (reportError) throw reportError;

      const { error: userReportError } = await supabase
        .from('reporte_usuario')
        .insert({
          usuario_id: currentUserId,
          contenido_id: video.id,
          tipo_contenido: 'video'
        });

      if (userReportError) throw userReportError;

      setShowReportModal(false);
      setIsReportConfirmationVisible(false);
      
      Alert.alert(
        "Reporte Enviado",
        "Tu reporte ha sido enviado correctamente.",
        [{ text: "OK", style: "default" }],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error al enviar el reporte:', error);
      Alert.alert('Error', 'No se pudo enviar el reporte. Por favor, intenta de nuevo.');
    }
  };

  const reportReasons = [
    'Contenido inapropiado',
    'Video con índole sexual',
    'Violencia o contenido perturbador',
    'Violación de derechos de autor',
    'Spam o contenido engañoso'
  ];

  const renderComment = ({ item }: { item: Comentario }) => {
    const isHighlighted = item.id.toString() === scrollToId;
    
    return (
      <View className={`flex-row mb-4 ${isHighlighted ? 'bg-primary-100' : ''}`}>
        <Image
          source={{
            uri: item.perfil.foto_perfil
              ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${item.perfil.foto_perfil}`
              : "https://via.placeholder.com/50"
          }}
          className="w-10 h-10 rounded-full mr-3"
        />
        <View className="flex-1">
          <Text className="font-JakartaBold text-sm text-primary-700">
            {item.perfil.username}
          </Text>
          <Text className="text-sm text-general-200 mt-1">
            {item.comentario}
          </Text>
          <View className="flex-row items-center mt-2">
            <TouchableOpacity
              onPress={() => handleCommentLike(item.id)}
              className="mr-4"
            >
              <Ionicons
                name={item.isLiked ? "heart" : "heart-outline"}
                size={18}
                color={item.isLiked ? "#E53E3E" : "#4A148C"}
              />
            </TouchableOpacity>
            <Text className="text-xs text-general-200">{item.likes_count} likes</Text>
            <Text className="text-xs text-general-200 ml-4">{formatCommentDate(item.created_at)}</Text>
            {item.usuario_id === currentUserId && (
              <TouchableOpacity
                onPress={() => handleDeleteComment(item.id)}
                className="ml-4"
              >
                <Ionicons name="trash-outline" size={18} color="#E53E3E" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const handleProfilePress = () => {
    router.push(`/public-profile/${video.usuario_id}`);
  };

  return (
    <View style={{ width, height }}>
      <TouchableOpacity onPress={togglePlayPause} style={{ flex: 1 }}>
        <ExpoVideo
          ref={videoRef}
          source={{ uri: video.url || "" }}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isActive && isScreenFocused && currentPlayingId === video.id}
          isLooping
          style={{ flex: 1 }}
          onPlaybackStatusUpdate={(status) => {
            if (status.isLoaded) {
              setIsPlaying(status.isPlaying);
            }
          }}
        />
        {showPlayPauseIcon && (
          <View
            style={{
              position: "absolute",
              top: "45%",
              left: "50%",
              transform: [{ translateX: -25 }, { translateY: -25 }],
            }}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={50}
              color="white"
            />
          </View>
        )}
      </TouchableOpacity>

      {/* Información del usuario y fecha de subida */}
      <View className="absolute left-4 bottom-28 flex-row items-center">
        <TouchableOpacity 
          onPress={handleProfilePress}
          className="flex-row items-center"
        >
          <Image
            source={{ 
              uri: video.perfil?.foto_perfil 
                ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${video.perfil.foto_perfil}`
                : "https://via.placeholder.com/40" 
            }}
            className="w-10 h-10 rounded-full mr-2"
          />
          <View>
            <Text className="text-white font-JakartaBold">{video.perfil?.username || "Usuario desconocido"}</Text>
            <Text className="text-white text-xs">{formatUploadDate(video.created_at)}</Text>
          </View>
        </TouchableOpacity>
      </View>
        <View className="absolute left-4 bottom-20">
          <Text className="text-white">{video.descripcion}</Text>
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
          onPress={() => {
            setShowRegularComments(true);
            fetchComentarios();
          }}
          className="mb-4"
        >
          <Ionicons name="chatbubble-outline" size={30} color="white" />
          <Text className="text-white text-center">{comentarios.length}</Text>
        </TouchableOpacity>
        {/* Botón de tres puntos movido aquí */}
        <TouchableOpacity
          onPress={handleOptionsPress}
        >
          <Ionicons name="ellipsis-vertical" size={30} color="white" />
        </TouchableOpacity>
      </View>

      {/* Modal de comentarios regular */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showRegularComments}
        onRequestClose={() => setShowRegularComments(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-end">
          <View className="bg-white rounded-t-3xl p-4 h-3/4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-JakartaBold text-primary-700">Comentarios</Text>
              <TouchableOpacity onPress={() => setShowRegularComments(false)}>
                <Ionicons name="close" size={24} color="#4A148C" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={comentarios}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderComment}
              ListEmptyComponent={
                <Text className="text-center text-gray-500">
                  No hay comentarios aún
                </Text>
              }
              className="mb-4"
            />
            <View className="flex-row mt-2">
              <TextInput
                className="flex-1 border border-general-300 rounded-full px-4 py-2 mr-2"
                value={nuevoComentario}
                onChangeText={setNuevoComentario}
                placeholder="Añade un comentario..."
              />
              <TouchableOpacity
                onPress={() => handleComment(nuevoComentario)}
                className="bg-primary-500 rounded-full px-4 py-2"
              >
                <Text className="text-white font-JakartaBold">Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de comentarios desde notificación */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showNotificationComments && scrollToId === video.id.toString()}
        onRequestClose={() => setShowNotificationComments(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-end">
          <View className="bg-white rounded-t-3xl p-4 h-3/4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-JakartaBold text-primary-700">Comentarios</Text>
              <TouchableOpacity onPress={() => setShowNotificationComments(false)}>
                <Ionicons name="close" size={24} color="#4A148C" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={comentarios}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderComment}
              ListEmptyComponent={
                <Text className="text-center text-gray-500">
                  No hay comentarios aún
                </Text>
              }
              className="mb-4"
            />
            <View className="flex-row mt-2">
              <TextInput
                className="flex-1 border border-general-300 rounded-full px-4 py-2 mr-2"
                value={nuevoComentario}
                onChangeText={setNuevoComentario}
                placeholder="Añade un comentario..."
              />
              <TouchableOpacity
                onPress={() => handleComment(nuevoComentario)}
                className="bg-primary-500 rounded-full px-4 py-2"
              >
                <Text className="text-white font-JakartaBold">Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de opciones del video */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showOptionsModal}
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity
          className="flex-1 justify-center items-center bg-black bg-opacity-50"
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View className="bg-white rounded-lg p-4 w-3/4">
            {video.usuario_id === currentUserId ? (
              <>
                <TouchableOpacity
                  className="py-3 border-b border-general-300"
                  onPress={() => {
                    setShowOptionsModal(false);
                    setIsEditModalVisible(true);
                  }}
                >
                  <Text className="text-primary-500 font-JakartaSemiBold">Editar video</Text>
                </TouchableOpacity>
                <TouchableOpacity className="py-3" onPress={handleDeleteVideo}>
                  <Text className="text-danger-600 font-JakartaSemiBold">Eliminar video</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity className="py-3" onPress={handleReportPress}>
                <Text className="text-danger-600 font-JakartaSemiBold">Reportar video</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de reporte */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showReportModal}
        onRequestClose={() => {
          setShowReportModal(false);
          setSelectedReportReason(null);
        }}
      >
        <View className="flex-1 justify-end bg-black bg-opacity-50">
          <View className="bg-white rounded-t-3xl p-4">
            <Text className="text-xl font-JakartaBold mb-4">Reportar video</Text>
            <Text className="text-sm text-gray-600 mb-4">
              Selecciona una razón para reportar este video. Un reporte injustificado o malintencionado podría resultar en una suspensión de tu cuenta.
            </Text>
            {reportReasons.map((reason, index) => (
              <TouchableOpacity
                key={index}
                className={`py-3 border-b border-gray-200 ${selectedReportReason === reason ? 'bg-primary-100' : ''}`}
                onPress={() => setSelectedReportReason(reason)}
              >
                <Text className="font-JakartaMedium">{reason}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              className="mt-4 bg-primary-500 rounded-full py-3 items-center"
              onPress={handleReportConfirm}
              disabled={!selectedReportReason}
            >
              <Text className="text-white font-JakartaBold">Enviar reporte</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="mt-2 py-3 items-center"
              onPress={() => setShowReportModal(false)}
            >
              <Text className="text-primary-500 font-JakartaMedium">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmación de reporte */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isReportConfirmationVisible}
        onRequestClose={() => setIsReportConfirmationVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white rounded-lg p-4 w-5/6">
            <Text className="text-lg font-bold mb-4">Confirmar reporte</Text>
            <Text className="mb-4">
              ¿Estás seguro que quieres enviar este reporte? 
            </Text>
            <Text className="mb-4 font-semibold text-primary-600">
              {userReportCount} de 3 reportes comunicados
            </Text>
            <Text className="mb-4 text-sm text-gray-600">
              Recuerda que solo puedes enviar un total de 3 reportes cada 12 horas.
            </Text>
            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => setIsReportConfirmationVisible(false)}
                className="bg-gray-300 rounded-md px-4 py-2 mr-2"
              >
                <Text>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={sendReport}
                className="bg-primary-500 rounded-md px-4 py-2"
              >
                <Text className="text-white">Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de edición del video */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white p-5 rounded-lg w-5/6">
            <Text className="text-xl font-JakartaBold text-primary-700 mb-4">Editar Video</Text>
            <TextInput
              className="border border-general-300 rounded-md p-2 mb-2"
              placeholder="Descripción del video"
              value={editDescripcion}
              onChangeText={setEditDescripcion}
              multiline
            />

            <TouchableOpacity
              onPress={handleEditVideo}
              className="bg-primary-500 p-2 rounded-md mb-2"
            >
              <Text className="text-white text-center font-JakartaBold">Actualizar Video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsEditModalVisible(false)}
              className="bg-danger-500 p-2 rounded-md"
            >
              <Text className="text-white text-center font-JakartaBold">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default VideoCard;