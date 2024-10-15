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
  Animated,
} from "react-native";
import { Video as ExpoVideo, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";
import { useVideo } from "@/contexts/VideoContext";

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
  isActive: boolean;
  height: number;
  onDeleteVideo: (videoId: number) => void;
  onUpdateVideo: (videoId: number, updatedData: { titulo: string; descripcion: string }) => void;
  setVideos: React.Dispatch<React.SetStateAction<Video[]>>;
  refetchVideos: () => Promise<void>;
}

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
  const { currentPlayingId, setCurrentPlayingId } = useVideo();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [comentarioLikes, setComentarioLikes] = useState<{
    [key: number]: ComentarioLike[];
  }>({});
  const [nuevoComentario, setNuevoComentario] = useState("");
  const videoRef = useRef<ExpoVideo>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [showPlayPauseIcon, setShowPlayPauseIcon] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState(video.titulo);
  const [editDescripcion, setEditDescripcion] = useState(video.descripcion);

  useEffect(() => {
    if (isActive) {
      videoRef.current?.playAsync();
      setIsPlaying(true);
    } else {
      videoRef.current?.pauseAsync();
      setIsPlaying(false);
    }
  }, [isActive]);

  useEffect(() => {
    checkIfLiked();
    fetchLikesCount();
    fetchComentarios();
  }, [video.id]);

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
    try {
      if (isLiked) {
        await supabase
          .from("likes_video")
          .delete()
          .eq("video_id", video.id)
          .eq("usuario_id", currentUserId);
        setLikesCount((prev) => prev - 1);
      } else {
        await supabase
          .from("likes_video")
          .insert({ video_id: video.id, usuario_id: currentUserId });
        setLikesCount((prev) => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error al dar/quitar like:", error);
    }
  };

  const fetchComentarios = async () => {
    try {
      const { data, error } = await supabase
        .from("comentario_video")
        .select(
          `
          *,
          perfil:usuario_id (
            username,
            foto_perfil
          ),
          likes:likes_comentario_video (*)
        `
        )
        .eq("video_id", video.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const comentariosConLikes = data.map((comentario) => ({
        ...comentario,
        isLiked: comentario.likes.some(
          (like: any) => like.usuario_id === currentUserId
        ),
        likes_count: comentario.likes.length,
      }));

      setComentarios(comentariosConLikes);
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
            perfil:usuario_id (
              username,
              foto_perfil
            )
          `
          )
          .single();
        if (error) throw error;
        setComentarios([data, ...comentarios]);
        setNuevoComentario("");
      } catch (error) {
        console.error("Error al enviar el comentario:", error);
        Alert.alert(
          "Error",
          "No se pudo enviar el comentario. Por favor, intenta de nuevo."
        );
      }
    }
  };

  const handleCommentLike = async (comentarioId: number) => {
    const comentario = comentarios.find((c) => c.id === comentarioId);
    if (!comentario) return;

    const newIsLiked = !comentario.isLiked;
    const likeDelta = newIsLiked ? 1 : -1;

    try {
      if (newIsLiked) {
        await supabase
          .from("likes_comentario_video")
          .insert({ comentario_id: comentarioId, usuario_id: currentUserId });
      } else {
        await supabase
          .from("likes_comentario_video")
          .delete()
          .eq("comentario_id", comentarioId)
          .eq("usuario_id", currentUserId);
      }

      setComentarios((prev) =>
        prev.map((c) =>
          c.id === comentarioId
            ? {
                ...c,
                isLiked: newIsLiked,
                likes_count: (c.likes_count || 0) + likeDelta,
              }
            : c
        )
      );
    } catch (error) {
      console.error("Error al dar/quitar like al comentario:", error);
    }
  };

  const handleDeleteVideo = async () => {
    Alert.alert(
      "Eliminar video",
      "¿Estás seguro de que quieres eliminar este video? Esta acción no se puede deshacer.",
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
        .update({ titulo: editTitle, descripcion: editDescripcion })
        .eq("id", video.id);

      if (error) throw error;

      onUpdateVideo(video.id, {
        titulo: editTitle,
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

  return (
    <View style={{ width, height }}>
      <TouchableOpacity onPress={togglePlayPause} style={{ flex: 1 }}>
        <ExpoVideo
          ref={videoRef}
          source={{ uri: video.url || "" }}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isActive}
          isLooping
          style={{ flex: 1 }}
        />
        {showPlayPauseIcon && (
          <Animated.View
            style={{
              position: "absolute",
              top: "45%",
              left: "50%",
              transform: [{ translateX: -25 }, { translateY: -25 }],
              opacity: fadeAnim,
            }}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={50}
              color="white"
            />
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* Información del usuario y fecha de subida */}
      <View className="absolute left-4 bottom-28 flex-row items-center">
        <Image
          source={{ uri: video.perfil?.foto_perfil || "https://via.placeholder.com/40" }}
          className="w-10 h-10 rounded-full mr-2"
        />
        <View>
          <Text className="text-white font-JakartaBold">{video.perfil?.username || "Usuario desconocido"}</Text>
          <Text className="text-white text-xs">{formatUploadDate(video.created_at)}</Text>
        </View>
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
            setShowComments(true);
            fetchComentarios();
          }}
          className="mb-4"
        >
          <Ionicons name="chatbubble-outline" size={30} color="white" />
          <Text className="text-white text-center">{comentarios.length}</Text>
        </TouchableOpacity>
        {/* Botón de tres puntos movido aquí */}
        <TouchableOpacity
          onPress={() => setShowOptionsModal(true)}
        >
          <Ionicons name="ellipsis-vertical" size={30} color="white" />
        </TouchableOpacity>
      </View>

      {/* Modal de comentarios */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showComments}
        onRequestClose={() => setShowComments(false)}
      >
        <View className="flex-1 bg-black bg-opacity-50 justify-end">
          <View className="bg-white rounded-t-3xl p-4 h-3/4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-JakartaBold text-primary-700">Comentarios</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Ionicons name="close" size={24} color="#4A148C" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={comentarios}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View className="flex-row mb-4">
                  <Image
                    source={{
                      uri: item.perfil.foto_perfil || "https://via.placeholder.com/50",
                    }}
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <View className="flex-1">
                    <Text className="font-JakartaBold text-sm text-primary-700">{item.perfil.username}</Text>
                    <Text className="text-sm text-general-200 mt-1">{item.comentario}</Text>
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
              )}
            />
            <View className="flex-row mt-2">
              <TextInput
                className="flex-1 border border-general-300 rounded-full px-4 py-2 mr-2"
                value={nuevoComentario}
                onChangeText={setNuevoComentario}
                placeholder="Añade un comentario..."
              />
              <TouchableOpacity
                onPress={handleComment}
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
          </View>
        </TouchableOpacity>
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
              placeholder="Título del video"
              value={editTitle}
              onChangeText={setEditTitle}
            />

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
