import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import { supabase } from "@/lib/supabase";
import { icons } from "@/constants/index";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import EditSongModal from "./EditSongModal";

interface Perfil {
  usuario_id: string;
  username: string;
  foto_perfil: string | null;
  // Añade otras propiedades del perfil si son necesarias
}

interface Cancion {
  id: number;
  usuario_id: string;
  titulo: string;
  archivo_audio: string | null;
  caratula: string | null;
  contenido: string;
  genero: string; // Nuevo campo
  created_at: string;
  perfil: Perfil | null;
}

interface Comentario {
  id: number;
  usuario_id: string;
  cancion_id: number;
  contenido: string;
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

interface SongCardProps {
  cancion: Cancion;
  currentUserId: string;
  onDeleteSong: (cancionId: number) => void;
  onUpdateSong: (cancionId: number) => void;
}

const SongCard: React.FC<SongCardProps> = ({
  cancion,
  currentUserId,
  onDeleteSong,
  onUpdateSong,
}) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [position, setPosition] = useState<number | null>(null);
  const [likes, setLikes] = useState<Like[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [comentarioLikes, setComentarioLikes] = useState<{
    [key: number]: ComentarioLike[];
  }>({});
  const [showComments, setShowComments] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [commentSortOrder, setCommentSortOrder] = useState<"newest" | "oldest">(
    "newest"
  );
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);
  const [commentOptionsVisible, setCommentOptionsVisible] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const {
    playSound,
    currentSong,
    isPlaying: globalIsPlaying,
    pauseSound,
  } = useAudioPlayer();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    fetchLikesAndComments();
    checkIfLiked();
  }, [cancion.id]);

  const loadAudio = async () => {
    if (cancion.archivo_audio) {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: cancion.archivo_audio },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
    }
  };

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis ?? null);
      setPosition(status.positionMillis ?? null);
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
        await playSound(sound);
        setIsPlaying(true);
      }
    }
  };

  const fetchLikesAndComments = async () => {
    const { data: likesData } = await supabase
      .from("likes_cancion")
      .select("*")
      .eq("cancion_id", cancion.id);

    const { data: comentariosData } = await supabase
      .from("comentario_cancion")
      .select("*, perfil(*)")
      .eq("cancion_id", cancion.id)
      .order("created_at", { ascending: false });

    if (likesData) setLikes(likesData);
    if (comentariosData) {
      const comentariosConLikes = await Promise.all(
        comentariosData.map(async (comentario) => {
          const { data: likesData } = await supabase
            .from("likes_comentario_cancion")
            .select("*")
            .eq("comentario_id", comentario.id);

          setComentarioLikes((prev) => ({
            ...prev,
            [comentario.id]: likesData || [],
          }));

          return {
            ...comentario,
            isLiked: (likesData || []).some(
              (like) => like.usuario_id === currentUserId
            ),
          };
        })
      );
      setComentarios(comentariosConLikes);
    }
  };

  const checkIfLiked = async () => {
    const { data } = await supabase
      .from("likes_cancion")
      .select("*")
      .eq("cancion_id", cancion.id)
      .eq("usuario_id", currentUserId)
      .single();

    setIsLiked(!!data);
  };

  const handleLike = async () => {
    if (isLiked) {
      await supabase
        .from("likes_cancion")
        .delete()
        .eq("cancion_id", cancion.id)
        .eq("usuario_id", currentUserId);
      setLikes(likes.filter((like) => like.usuario_id !== currentUserId));
    } else {
      const { data } = await supabase
        .from("likes_cancion")
        .insert({ cancion_id: cancion.id, usuario_id: currentUserId })
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
          .from("comentario_cancion")
          .insert({
            cancion_id: cancion.id,
            usuario_id: currentUserId,
            contenido: nuevoComentario.trim(),
          })
          .select(
            `
            id,
            usuario_id,
            cancion_id,
            contenido,
            created_at,
            perfil (
              usuario_id,
              username,
              foto_perfil
            )
          `
          )
          .single();

        if (error) throw error;

        if (data) {
          const newComentario: Comentario = {
            ...data,
            likes_count: 0, // Set an initial value for likes_count
            perfil: data.perfil[0] as Perfil, // Assume perfil is the first item in the array
            isLiked: false // Add this if it's part of your Comentario interface
          };
          setComentarios([newComentario, ...comentarios]);
          setNuevoComentario("");
        }
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
    const likes = comentarioLikes[comentarioId] || [];
    const isLiked = likes.some((like) => like.usuario_id === currentUserId);

    if (isLiked) {
      await supabase
        .from("likes_comentario_cancion")
        .delete()
        .eq("comentario_id", comentarioId)
        .eq("usuario_id", currentUserId);

      setComentarioLikes((prev) => ({
        ...prev,
        [comentarioId]: prev[comentarioId].filter(
          (like) => like.usuario_id !== currentUserId
        ),
      }));
    } else {
      const { data } = await supabase
        .from("likes_comentario_cancion")
        .insert({ comentario_id: comentarioId, usuario_id: currentUserId })
        .select()
        .single();

      if (data) {
        setComentarioLikes((prev) => ({
          ...prev,
          [comentarioId]: [...(prev[comentarioId] || []), data],
        }));
      }
    }

    setComentarios((prev) =>
      prev.map((comentario) =>
        comentario.id === comentarioId
          ? { ...comentario, isLiked: !isLiked }
          : comentario
      )
    );
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

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  const toggleImageModal = () => {
    setIsImageModalVisible(!isImageModalVisible);
  };

  const toggleCommentsModal = () => {
    setCommentsModalVisible(!commentsModalVisible);
  };

  const toggleSortOptions = () => {
    setShowSortOptions(!showSortOptions);
  };

  const sortComments = (order: "newest" | "oldest") => {
    setCommentSortOrder(order);
    let sortedComments = [...comentarios];
    if (order === "newest") {
      sortedComments.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      sortedComments.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
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
          .from("comentario_cancion")
          .delete()
          .eq("id", selectedCommentId)
          .eq("usuario_id", currentUserId);

        setComentarios((prevComentarios) =>
          prevComentarios.filter((c) => c.id !== selectedCommentId)
        );
        setCommentOptionsVisible(false);
      } catch (error) {
        console.error("Error al eliminar el comentario:", error);
        Alert.alert("Error", "No se pudo eliminar el comentario");
      }
    }
  };

  const handleCopyComment = async () => {
    const comentario = comentarios.find((c) => c.id === selectedCommentId);
    if (comentario) {
      await Clipboard.setStringAsync(comentario.contenido);
      Alert.alert("Éxito", "Contenido del comentario copiado al portapapeles");
      setCommentOptionsVisible(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar canción",
      "¿Estás seguro de que quieres eliminar esta canción? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            onDeleteSong(cancion.id);
            setShowOptionsModal(false);
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    setIsEditModalVisible(true);
    setShowOptionsModal(false);
  };

  const handleEditSuccess = () => {
    // Aquí puedes actualizar el estado local si es necesario
    onUpdateSong(cancion.id);
  };

  const handlePlayPause = () => {
    if (cancion) {
      if (currentSong?.id === cancion.id && globalIsPlaying) {
        pauseSound();
      } else {
        playSound({
          id: cancion.id,
          title: cancion.titulo,
          audioUrl: cancion.archivo_audio || "",
          coverUrl: cancion.caratula || "",
        });
      }
    }
  };

  const formatDuration = (durationMillis: number | null) => {
    if (durationMillis === null) return "";
    const minutes = Math.floor(durationMillis / 60000);
    const seconds = ((durationMillis % 60000) / 1000).toFixed(0);
    return `${minutes}:${(Number(seconds) < 10 ? "0" : "") + seconds}`;
  };

  const handleProfilePress = () => {
    router.push(`/public-profile/${cancion.usuario_id}`);
  };

  return (
    <View className="bg-white rounded-lg shadow-md mb-4 p-4">
      {/* Cabecera con nombre de usuario y opciones */}
      <View className="flex-row justify-between items-center mb-2">
            <TouchableOpacity onPress={handleProfilePress}  className="flex-row items-center">
              <Image
                source={{
                  uri: cancion.perfil?.foto_perfil || "https://via.placeholder.com/30",
                }}
                className="w-6 h-6 rounded-full mr-2"
              />
              <Text className="text-sm font-bold text-gray-700">
                {cancion.perfil?.username || "Usuario desconocido"}
              </Text>
            </TouchableOpacity>
            {cancion.usuario_id === currentUserId && (
              <TouchableOpacity onPress={() => setShowOptionsModal(true)}>
                <Ionicons name="ellipsis-vertical" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
      <View className="flex-row">
        {/* Imagen de portada */}
        <View>
          <TouchableOpacity onPress={toggleImageModal}>
            <Image
              source={{ uri: cancion.caratula || "https://via.placeholder.com/100" }}
              className="w-20 h-20 rounded-lg"
            />
          </TouchableOpacity>
        </View>
        
        {/* Contenido principal */}
        <View className="flex-1 ml-4">
          {/* Título, género y descripción */}
          <Text className="font-JakartaSemiBold text-md mb-1 text-primary-700">{cancion.titulo}</Text>
          <Text className="text-xs mb-1 text-secondary-500">{cancion.genero}</Text>
          <Text className="text-xs text-general-200 mb-2" numberOfLines={2}>{cancion.contenido}</Text>
          
          {/* Controles, estadísticas y fecha */}
          <View className="flex-row justify-between items-center mt-2">
            {/* Fecha de creación */}
            <Text className="text-xs text-general-200">
              {new Date(cancion.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
            </Text>
            
            <View className="flex-row items-center">
              <TouchableOpacity onPress={handleLike} className="flex-row items-center mr-4">
                <Image
                  source={isLiked ? icons.hearto : icons.heart}
                  className="w-5 h-5 mr-1"
                  style={{ tintColor: isLiked ? "#6D29D2" : undefined }}
                />
                <Text className="text-xs text-primary-500">{likes.length}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleCommentsModal} className="flex-row items-center mr-4">
                <Image source={icons.comentario} className="w-5 h-5 mr-1" />
                <Text className="text-xs">{comentarios.length}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePlayPause}>
                <Ionicons
                  name={currentSong?.id === cancion.id && globalIsPlaying ? "pause" : "play"}
                  size={20}
                  color="#6D29D2"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Modal para imagen de portada */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isImageModalVisible}
        onRequestClose={toggleImageModal}
      >
        <TouchableOpacity
          className="flex-1 justify-center items-center bg-black bg-opacity-70"
          activeOpacity={1}
          onPress={toggleImageModal}
        >
          <Image
            source={{ uri: cancion.caratula || "https://via.placeholder.com/300" }}
            className="w-11/12 h-5/6"
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>

      {/* Modal para comentarios */}
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
                  style={{ tintColor: "#00BFA5" }}
                />
              </TouchableOpacity>
              <View className="flex-row items-center">
                <Text className="text-secondary-500 font-JakartaBold mr-2">
                  {comentarios.length}
                </Text>
                <Text className="font-JakartaBold text-lg">Comentarios</Text>
              </View>
              <TouchableOpacity onPress={toggleCommentsModal}>
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
            <ScrollView className="mb-4">
              {comentarios.map((comentario) => (
                <View
                  key={comentario.id}
                  className="mb-3 border-b border-general-300 pb-2"
                >
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
                          <Text className="font-JakartaBold text-sm mr-2">
                            {comentario.perfil?.username ||
                              "Usuario desconocido"}
                          </Text>
                          <Text className="text-xs text-general-200">
                            {formatCommentDate(comentario.created_at)}
                          </Text>
                        </View>
                        <Text className="text-sm mt-1">
                          {comentario.contenido}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleCommentOptions(comentario)}
                      className="ml-2"
                    >
                      <Image source={icons.trespuntos} className="w-5 h-5" />
                    </TouchableOpacity>
                  </View>
                  <View className="flex-row items-center mt-2 ml-10">
                    <TouchableOpacity
                      onPress={() => handleCommentLike(comentario.id)}
                      className="flex-row items-center"
                    >
                      <Image
                        source={comentario.isLiked ? icons.hearto : icons.heart}
                        className="w-4 h-4 mr-1"
                        style={{
                          tintColor: comentario.isLiked ? "#6D29D2" : undefined,
                        }}
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
              <TouchableOpacity
                onPress={handleComment}
                className="bg-primary-500 rounded-full py-2 items-center"
              >
                <Text className="text-white font-JakartaBold">Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para opciones de canción */}
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
              className="py-3 border-b border-gray-200"
              onPress={handleEdit}
            >
              <Text className="text-primary-500 font-JakartaMedium">
                Editar canción
              </Text>
            </TouchableOpacity>
            <TouchableOpacity className="py-3" onPress={handleDelete}>
              <Text className="text-red-500 font-JakartaMedium">
                Eliminar canción
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal para editar canción */}
      <EditSongModal
        isVisible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        onEditSuccess={handleEditSuccess}
        cancion={cancion}
      />
    </View>
  );
};

export default SongCard;
