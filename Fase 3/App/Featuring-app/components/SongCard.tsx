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
import { RealtimeChannel } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { sendPushNotification } from "@/utils/pushNotifications";
import { validateContent } from "@/utils/contentFilter";
import CommentSection from "./CommentSection";

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
  is_edited?: boolean;
  padre_id?: number | null;
  respuestas?: Comentario[];
  respuestas_count?: number;
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

interface Colaboracion {
  id: number;
  estado: string;
  usuario_id: string;
  usuario_id2: string;
  perfil?: {
    username: string;
    foto_perfil: string | null;
  };
  perfil2?: {
    username: string;
    foto_perfil: string | null;
  };
}

interface SongCardProps {
  cancion: Cancion;
  currentUserId: string;
  onDeleteSong: (cancionId: number) => void;
  onUpdateSong: (cancionId: number) => void;
  onCommentPress: (cancionId: number) => void;
  initialShowComments?: boolean;
}

const SongCard: React.FC<SongCardProps> = ({
  cancion,
  currentUserId,
  onDeleteSong,
  onUpdateSong,
  onCommentPress,
  initialShowComments,
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
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(
    null
  );
  const [commentOptionsVisible, setCommentOptionsVisible] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showReportConfirmation, setShowReportConfirmation] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState<
    string | null
  >(null);
  const {
    playSound,
    currentSong,
    isPlaying: globalIsPlaying,
    pauseSound,
  } = useAudioPlayer();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [isReportConfirmationVisible, setIsReportConfirmationVisible] =
    useState(false);
  const [userReportCount, setUserReportCount] = useState(0);
  const [editingComment, setEditingComment] = useState("");
  const [respondingTo, setRespondingTo] = useState<{
    id: number;
    username: string;
  } | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [commentSubscription, setCommentSubscription] =
    useState<RealtimeChannel | null>(null);
  const [colaboracion, setColaboracion] = useState<Colaboracion | null>(null);

  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
  // Construir la URL pública de la foto de perfil
  const profileImageUrl = cancion.perfil?.foto_perfil
    ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${cancion.perfil.foto_perfil}`
    : "https://via.placeholder.com/30";

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
    subscribeToComments();
    fetchColaboracion();

    return () => {
      if (commentSubscription) {
        commentSubscription.unsubscribe();
      }
    };
  }, [cancion.id]);

  useEffect(() => {
    if (initialShowComments) {
      setCommentsModalVisible(true);
    }
  }, [initialShowComments]);

  useEffect(() => {
    // Suscripción a cambios en likes de comentarios
    const channel = supabase
      .channel(`likes-comentarios-${cancion.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "likes_comentario_cancion",
          filter: `comentario_id=in.(${comentarios.map((c) => c.id).join(",")})`,
        },
        () => {
          // Actualizar los likes de los comentarios
          fetchLikesAndComments();
        }
      )
      .subscribe();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [comentarios]);

  useEffect(() => {
    // Suscripción a cambios en likes de la canción
    const channel = supabase
      .channel(`likes-cancion-${cancion.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "likes_cancion",
          filter: `cancion_id=eq.${cancion.id}`,
        },
        () => {
          // Actualizar los likes cuando haya cambios
          fetchLikesAndComments();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [cancion.id]);

  const subscribeToComments = async () => {
    const subscription = supabase
      .channel(`public:comentario_cancion:cancion_id=eq.${cancion.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comentario_cancion",
          filter: `cancion_id=eq.${cancion.id}`,
        },
        (payload) => {
          fetchLikesAndComments();
        }
      )
      .subscribe();

    setCommentSubscription(subscription);
  };

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
    try {
      // Obtener likes
      const { data: likesData } = await supabase
        .from("likes_cancion")
        .select("*")
        .eq("cancion_id", cancion.id);

      // Obtener comentarios con sus respuestas y likes
      const { data: comentariosData } = await supabase
        .from("comentario_cancion")
        .select(
          `
          *,
          perfil (
            usuario_id,
            username,
            foto_perfil
          ),
          respuestas:comentario_cancion!padre_id (
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
          )
        `
        )
        .eq("cancion_id", cancion.id)
        .is("padre_id", null) // Solo traer comentarios principales
        .order("created_at", { ascending: false });

      if (likesData) setLikes(likesData);
      if (comentariosData) {
        const comentariosConLikes = await Promise.all(
          comentariosData.map(async (comentario) => {
            // Obtener likes del comentario principal
            const { data: likesData } = await supabase
              .from("likes_comentario_cancion")
              .select("*")
              .eq("comentario_id", comentario.id);

            // Obtener likes de las respuestas
            const respuestasConLikes = await Promise.all(
              (comentario.respuestas || []).map(async (respuesta: any) => {
                const { data: respuestaLikesData } = await supabase
                  .from("likes_comentario_cancion")
                  .select("*")
                  .eq("comentario_id", respuesta.id);

                return {
                  ...respuesta,
                  likes_count: (respuestaLikesData || []).length,
                  isLiked: (respuestaLikesData || []).some(
                    (like) => like.usuario_id === currentUserId
                  ),
                };
              })
            );

            return {
              ...comentario,
              likes_count: (likesData || []).length,
              isLiked: (likesData || []).some(
                (like) => like.usuario_id === currentUserId
              ),
              perfil: comentario.perfil[0],
              respuestas: respuestasConLikes,
              respuestas_count: respuestasConLikes.length,
            };
          })
        );

        setComentarios(comentariosConLikes);
      }
    } catch (error) {
      console.error("Error al cargar likes y comentarios:", error);
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

      // Actualizar el estado local inmediatamente
      setLikes(likes.filter((like) => like.usuario_id !== currentUserId));
      setIsLiked(false);
    } else {
      try {
        // Obtener el username del usuario que da like
        const { data: userData, error: userError } = await supabase
          .from("perfil")
          .select("username")
          .eq("usuario_id", currentUserId)
          .single();

        if (userError) throw userError;

        // Obtener el token de push del usuario que recibe el like
        const { data: songOwnerData, error: ownerError } = await supabase
          .from("perfil")
          .select("push_token")
          .eq("usuario_id", cancion.usuario_id)
          .single();

        if (ownerError) throw ownerError;

        const { data } = await supabase
          .from("likes_cancion")
          .insert({ cancion_id: cancion.id, usuario_id: currentUserId })
          .select()
          .single();

        if (data) {
          // Actualizar el estado local inmediatamente
          setLikes([...likes, data]);
          setIsLiked(true);

          // Si el usuario que da like no es el dueño de la canción
          if (currentUserId !== cancion.usuario_id) {
            // Enviar notificación push si el usuario tiene token
            if (songOwnerData?.push_token) {
              await sendPushNotification(
                songOwnerData.push_token,
                "¡Nuevo Like!",
                `A ${userData.username} le ha gustado tu canción "${cancion.titulo}"`
              );
            }

            // Crear notificación en la base de datos
            const { error: notificationError } = await supabase
              .from("notificacion")
              .insert({
                usuario_id: cancion.usuario_id,
                tipo_notificacion: "like_cancion",
                leido: false,
                usuario_origen_id: currentUserId,
                contenido_id: cancion.id,
                mensaje: `Le ha dado me gusta a tu canción "${cancion.titulo}"`,
              });

            if (notificationError) {
              console.error(
                "Error al crear notificación de like:",
                notificationError
              );
            }
          }
        }
      } catch (error) {
        console.error("Error al dar like:", error);
      }
    }
  };

  const handleComment = async () => {
    if (nuevoComentario.trim()) {
      // Validar comentario
      const commentValidation = validateContent(nuevoComentario, "comentario");
      if (!commentValidation.isValid) {
        Alert.alert("Error", commentValidation.message);
        return;
      }

      try {
        // Verificar comentarios previos del usuario en esta canción hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: previousComments, error: previousCommentsError } =
          await supabase
            .from("comentario_cancion")
            .select("id")
            .eq("cancion_id", cancion.id)
            .eq("usuario_id", currentUserId)
            .gte("created_at", today.toISOString());

        if (previousCommentsError) throw previousCommentsError;

        // Obtener el username del usuario que comenta
        const { data: userData, error: userError } = await supabase
          .from("perfil")
          .select("username")
          .eq("usuario_id", currentUserId)
          .single();

        if (userError) throw userError;

        // Obtener el token de push del dueño de la canción
        const { data: songOwnerData, error: ownerError } = await supabase
          .from("perfil")
          .select("push_token")
          .eq("usuario_id", cancion.usuario_id)
          .single();

        if (ownerError) throw ownerError;

        // Insertar el comentario
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
            likes_count: 0,
            perfil: data.perfil[0] as Perfil,
            isLiked: false,
          };
          setComentarios([newComentario, ...comentarios]);
          setNuevoComentario("");

          // Si el usuario que comenta no es el dueño de la canción
          if (currentUserId !== cancion.usuario_id) {
            // Verificar si ya existe una notificación de comentarios de este usuario hoy
            const { data: existingNotification, error: notificationError } =
              await supabase
                .from("notificacion")
                .select("id, mensaje")
                .eq("usuario_id", cancion.usuario_id)
                .eq("usuario_origen_id", currentUserId)
                .eq("tipo_notificacion", "comentario_cancion")
                .eq("contenido_id", cancion.id)
                .gte("created_at", today.toISOString())
                .single();

            if (!notificationError || notificationError.code === "PGRST116") {
              let mensaje;
              if (existingNotification) {
                // Actualizar la notificación existente
                const commentCount = previousComments.length + 1;
                mensaje = `Ha comentado en tu canción "${cancion.titulo}": "${nuevoComentario.slice(0, 30)}${nuevoComentario.length > 30 ? "..." : ""}" y ${commentCount - 1} comentarios más`;

                await supabase
                  .from("notificacion")
                  .update({ mensaje })
                  .eq("id", existingNotification.id);
              } else {
                // Crear nueva notificación solo si es el primer comentario del día
                mensaje = `Ha comentado en tu canción "${cancion.titulo}": "${nuevoComentario.slice(0, 50)}${nuevoComentario.length > 50 ? "..." : ""}"`;

                await supabase.from("notificacion").insert({
                  usuario_id: cancion.usuario_id,
                  tipo_notificacion: "comentario_cancion",
                  leido: false,
                  usuario_origen_id: currentUserId,
                  contenido_id: cancion.id,
                  mensaje,
                });

                // Enviar notificación push solo para el primer comentario del día
                if (songOwnerData?.push_token) {
                  await sendPushNotification(
                    songOwnerData.push_token,
                    "¡Nuevo Comentario!",
                    `${userData.username} ha comentado en tu canción "${cancion.titulo}"`
                  );
                }
              }
            }
          }
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
    const comentario = comentarios.find((c) => c.id === comentarioId);
    if (!comentario) return;

    const newIsLiked = !comentario.isLiked;

    try {
      if (newIsLiked) {
        // Obtener el username del usuario que da like
        const { data: userData, error: userError } = await supabase
          .from("perfil")
          .select("username")
          .eq("usuario_id", currentUserId)
          .single();

        if (userError) throw userError;

        // Obtener el token de push del dueño del comentario
        const { data: commentOwnerData, error: ownerError } = await supabase
          .from("perfil")
          .select("push_token")
          .eq("usuario_id", comentario.usuario_id)
          .single();

        if (ownerError) throw ownerError;

        // Dar like
        await supabase.from("likes_comentario_cancion").insert({
          comentario_id: comentarioId,
          usuario_id: currentUserId,
        });

        // Actualizar el estado local inmediatamente
        setComentarioLikes((prevLikes) => ({
          ...prevLikes,
          [comentarioId]: [
            ...(prevLikes[comentarioId] || []),
            {
              id: Date.now(), // ID temporal
              usuario_id: currentUserId,
              comentario_id: comentarioId,
              created_at: new Date().toISOString(),
            },
          ],
        }));

        setComentarios((prevComentarios) =>
          prevComentarios.map((c) =>
            c.id === comentarioId
              ? {
                  ...c,
                  isLiked: true,
                  likes_count: (c.likes_count || 0) + 1,
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
              "¡Nuevo Like en tu comentario!",
              `A ${userData.username} le gustó tu comentario en "${cancion.titulo}"`
            );
          }

          // Crear notificación en la base de datos
          const { error: notificationError } = await supabase
            .from("notificacion")
            .insert({
              usuario_id: comentario.usuario_id,
              tipo_notificacion: "like_comentario_cancion",
              leido: false,
              usuario_origen_id: currentUserId,
              contenido_id: comentarioId,
              mensaje: `Le ha dado me gusta a tu comentario en "${cancion.titulo}"`,
            });

          if (notificationError) {
            console.error(
              "Error al crear notificación de like en comentario:",
              notificationError
            );
          }
        }
      } else {
        // Quitar like
        await supabase
          .from("likes_comentario_cancion")
          .delete()
          .eq("comentario_id", comentarioId)
          .eq("usuario_id", currentUserId);

        // Actualizar el estado local inmediatamente
        setComentarioLikes((prevLikes) => ({
          ...prevLikes,
          [comentarioId]: (prevLikes[comentarioId] || []).filter(
            (like) => like.usuario_id !== currentUserId
          ),
        }));

        setComentarios((prevComentarios) =>
          prevComentarios.map((c) =>
            c.id === comentarioId
              ? {
                  ...c,
                  isLiked: false,
                  likes_count: Math.max(0, (c.likes_count || 0) - 1),
                }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Error al dar/quitar like al comentario:", error);
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
    if (
      comentario.usuario_id === currentUserId ||
      cancion.usuario_id === currentUserId
    ) {
      setSelectedCommentId(comentario.id);
      setEditingComment(comentario.contenido);
      setCommentOptionsVisible(true);
    }
  };

  const handleDeleteComment = async () => {
    if (selectedCommentId) {
      try {
        await supabase
          .from("comentario_cancion")
          .delete()
          .eq("id", selectedCommentId);

        setComentarios(comentarios.filter((c) => c.id !== selectedCommentId));
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
      const { data: existingReport, error: existingReportError } =
        await supabase
          .from("reporte_usuario")
          .select("id")
          .eq("usuario_id", currentUserId)
          .eq("contenido_id", cancion.id)
          .eq("tipo_contenido", "cancion")
          .single();

      if (existingReportError && existingReportError.code !== "PGRST116") {
        throw existingReportError;
      }

      if (existingReport) {
        Alert.alert("Error", "Ya has reportado este contenido anteriormente.");
        return false;
      }

      // Verificar el número de reportes en las últimas 12 horas
      const twelveHoursAgo = new Date(
        Date.now() - 12 * 60 * 60 * 1000
      ).toISOString();
      const { data: recentReports, error: recentReportsError } = await supabase
        .from("reporte_usuario")
        .select("id")
        .eq("usuario_id", currentUserId)
        .gte("created_at", twelveHoursAgo);

      if (recentReportsError) {
        throw recentReportsError;
      }

      const reportCount = recentReports ? recentReports.length : 0;
      setUserReportCount(reportCount);

      if (reportCount >= 3) {
        Alert.alert(
          "Límite alcanzado",
          "Has alcanzado el límite de 3 reportes en las últimas 12 horas."
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error al verificar elegibilidad para reportar:", error);
      Alert.alert(
        "Error",
        "No se pudo verificar tu elegibilidad para reportar. Por favor, intenta de nuevo más tarde."
      );
      return false;
    }
  };

  const sendReport = async () => {
    try {
      const { data: reportData, error: reportError } = await supabase
        .from("reporte")
        .insert({
          usuario_reportante_id: currentUserId,
          usuario_reportado_id: cancion.usuario_id,
          contenido_id: cancion.id,
          tipo_contenido: "cancion",
          razon: selectedReportReason,
          estado: "pendiente",
        })
        .select()
        .single();

      if (reportError) throw reportError;

      const { error: userReportError } = await supabase
        .from("reporte_usuario")
        .insert({
          usuario_id: currentUserId,
          contenido_id: cancion.id,
          tipo_contenido: "cancion",
        });

      if (userReportError) throw userReportError;

      setShowReportConfirmation(false);
      setShowReportModal(false);
      setIsReportConfirmationVisible(false);

      // Mostrar alerta de éxito
      Alert.alert(
        "Reporte Enviado",
        "Tu reporte ha sido enviado correctamente.",
        [{ text: "OK", style: "default" }],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Error al enviar el reporte:", error);
      Alert.alert(
        "Error",
        "No se pudo enviar el reporte. Por favor, intenta de nuevo."
      );
    }
  };

  const handleCloseReportConfirmation = () => {
    setShowReportConfirmation(false);
    // Asegurarse de que la modal de opciones también se cierre
    setShowOptionsModal(false);
    // Resetear el motivo del reporte seleccionado
    setSelectedReportReason(null);
  };

  const reportReasons = [
    "Contenido inapropiado",
    "Audio con índole sexual",
    "Carátula obscena/perturbadora",
    "Violación de derechos de autor",
    "Spam o contenido engañoso",
  ];

  const handleEditComment = async () => {
    if (selectedCommentId && editingComment.trim()) {
      try {
        const { data, error } = await supabase
          .from("comentario_cancion")
          .update({
            contenido: editingComment.trim(),
          })
          .eq("id", selectedCommentId)
          .select()
          .single();

        if (error) throw error;

        setComentarios(
          comentarios.map((c) =>
            c.id === selectedCommentId
              ? { ...c, contenido: editingComment.trim() }
              : c
          )
        );
        setCommentOptionsVisible(false);
      } catch (error) {
        console.error("Error al editar el comentario:", error);
        Alert.alert("Error", "No se pudo editar el comentario");
      }
    }
  };

  const handleResponderComment = (comentario: Comentario) => {
    setRespondingTo({
      id: comentario.id,
      username: comentario.perfil.username,
    });
    setRespuestaTexto(`@${comentario.perfil.username} `);
  };

  const handleResponderComentario = async () => {
    if (!respuestaTexto.trim() || !respondingTo) return;

    try {
      // Obtener el username del usuario que responde
      const { data: userData, error: userError } = await supabase
        .from("perfil")
        .select("username")
        .eq("usuario_id", currentUserId)
        .single();

      if (userError) throw userError;

      // Obtener el usuario_id y token de push del dueño del comentario
      const { data: commentData, error: commentError } = await supabase
        .from("comentario_cancion")
        .select(
          `
          usuario_id,
          perfil:usuario_id (
            push_token
          )
        `
        )
        .eq("id", respondingTo.id)
        .single();

      if (commentError) throw commentError;

      // Obtener el token de push del dueño del comentario
      const { data: commentOwnerData, error: ownerError } = await supabase
        .from("perfil")
        .select("push_token")
        .eq("usuario_id", commentData.usuario_id)
        .single();

      if (ownerError) throw ownerError;

      const { data, error } = await supabase
        .from("comentario_cancion")
        .insert({
          cancion_id: cancion.id,
          usuario_id: currentUserId,
          contenido: respuestaTexto.trim(),
          padre_id: respondingTo.id,
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
          likes_count: 0,
          perfil: data.perfil[0] as Perfil,
          isLiked: false,
        };
        setComentarios([newComentario, ...comentarios]);
        setRespuestaTexto("");
        setRespondingTo(null);

        // Si el usuario que responde no es el dueño del comentario
        if (currentUserId !== commentData.usuario_id) {
          // Enviar notificación push si el usuario tiene token
          if (commentOwnerData?.push_token) {
            await sendPushNotification(
              commentOwnerData.push_token,
              "¡Nueva Respuesta!",
              `${userData.username} ha respondido a tu comentario en "${cancion.titulo}"`
            );
          }

          // Crear notificación en la base de datos
          const { error: notificationError } = await supabase
            .from("notificacion")
            .insert({
              usuario_id: commentData.usuario_id,
              tipo_notificacion: "respuesta_comentario",
              leido: false,
              usuario_origen_id: currentUserId,
              contenido_id: data.id,
              mensaje: `Ha respondido a tu comentario en "${cancion.titulo}": "${respuestaTexto.slice(0, 50)}${respuestaTexto.length > 50 ? "..." : ""}"`,
            });

          if (notificationError) {
            console.error(
              "Error al crear notificación de respuesta:",
              notificationError
            );
          }
        }
      }
    } catch (error) {
      console.error("Error al responder al comentario:", error);
      Alert.alert(
        "Error",
        "No se pudo enviar la respuesta. Por favor, intenta de nuevo."
      );
    }
  };

  const fetchColaboracion = async () => {
    try {
      const { data, error } = await supabase
        .from("colaboracion")
        .select(
          `
          *,
          perfil:usuario_id(username, foto_perfil),
          perfil2:usuario_id2(username, foto_perfil)
        `
        )
        .eq("cancion_id", cancion.id)
        .single();

      if (!error && data) {
        setColaboracion(data);
      }
    } catch (error) {
      console.error("Error al cargar colaboración:", error);
    }
  };

  const renderComment = ({ item }: { item: Comentario }) => (
    <View key={item.id} className="mb-3 border-b border-general-300 pb-2">
      <View className="flex-row justify-between items-start mb-1">
        <View className="flex-row items-center flex-1">
          {item.perfil?.foto_perfil && (
            <Image
              source={{
                uri: `${supabaseUrl}/storage/v1/object/public/fotoperfil/${item.perfil.foto_perfil}`,
              }}
              className="w-8 h-8 rounded-full mr-2"
            />
          )}
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="font-JakartaBold text-sm mr-2">
                {item.perfil?.username || "Usuario desconocido"}
              </Text>
              <Text className="text-xs text-general-200">
                {formatCommentDate(item.created_at)}
              </Text>
            </View>
            <Text className="text-sm mt-1">{item.contenido}</Text>
          </View>
        </View>
        {(item.usuario_id === currentUserId ||
          cancion.usuario_id === currentUserId) && (
          <TouchableOpacity
            onPress={() => handleCommentOptions(item)}
            className="ml-2"
          >
            <Image source={icons.trespuntos} className="w-5 h-5" />
          </TouchableOpacity>
        )}
      </View>
      <View className="flex-row items-center mt-2 ml-10">
        <TouchableOpacity
          onPress={() => handleCommentLike(item.id)}
          className="flex-row items-center"
        >
          <Image
            source={item.isLiked ? icons.hearto : icons.heart}
            className="w-4 h-4 mr-1"
            style={{
              tintColor: item.isLiked ? "#6D29D2" : undefined,
            }}
          />
          <Text className="text-xs text-primary-500 font-JakartaBold">
            {(comentarioLikes[item.id] || []).length}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleResponderComment(item)}
          className="ml-4"
        >
          <Text className="text-xs text-primary-500 font-JakartaBold">
            Responder
          </Text>
        </TouchableOpacity>
      </View>
      {respondingTo?.id === item.id && (
        <View className="mt-2 ml-8">
          <TextInput
            className="border border-general-300 rounded-full px-4 py-2 mb-2"
            value={respuestaTexto}
            onChangeText={setRespuestaTexto}
            placeholder="Escribe tu respuesta..."
            placeholderTextColor="#858585"
          />
          <TouchableOpacity
            onPress={handleResponderComentario}
            className="bg-primary-500 rounded-full py-2 items-center"
          >
            <Text className="text-white font-JakartaBold">
              Enviar respuesta
            </Text>
          </TouchableOpacity>
        </View>
      )}
      {item.respuestas &&
        item.respuestas.map((respuesta) => (
          <View
            key={`reply-${respuesta.id}-${item.id}`}
            className="ml-8 mt-2 border-l-2 border-general-300 pl-2"
          >
            <View className="flex-row justify-between items-start mb-1">
              <View className="flex-row items-center flex-1">
                {respuesta.perfil?.foto_perfil && (
                  <Image
                    source={{
                      uri: `${supabaseUrl}/storage/v1/object/public/fotoperfil/${respuesta.perfil.foto_perfil}`,
                    }}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                )}
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="font-JakartaBold text-sm mr-2">
                      {respuesta.perfil?.username || "Usuario desconocido"}
                    </Text>
                    <Text className="text-xs text-general-200">
                      {formatCommentDate(respuesta.created_at)}
                    </Text>
                  </View>
                  <Text className="text-sm mt-1">{respuesta.contenido}</Text>
                </View>
              </View>
              {(respuesta.usuario_id === currentUserId ||
                cancion.usuario_id === currentUserId) && (
                <TouchableOpacity
                  onPress={() => handleCommentOptions(respuesta)}
                  className="ml-2"
                >
                  <Image source={icons.trespuntos} className="w-5 h-5" />
                </TouchableOpacity>
              )}
            </View>
            <View className="flex-row items-center mt-2 ml-10">
              <TouchableOpacity
                onPress={() => handleCommentLike(respuesta.id)}
                className="flex-row items-center"
              >
                <Image
                  source={respuesta.isLiked ? icons.hearto : icons.heart}
                  className="w-4 h-4 mr-1"
                  style={{
                    tintColor: respuesta.isLiked ? "#6D29D2" : undefined,
                  }}
                />
                <Text className="text-xs text-primary-500 font-JakartaBold">
                  {(comentarioLikes[respuesta.id] || []).length}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
    </View>
  );

  const renderHeader = () => {
    return (
      <View className="flex-row justify-between items-center mb-2">
        {/* Usuario que subió la canción */}
        <TouchableOpacity
          onPress={() => router.push(`/public-profile/${cancion.usuario_id}`)}
          className="flex-row items-center flex-1"
        >
          <Image
            source={{ uri: profileImageUrl }}
            className="w-6 h-6 rounded-full mr-2"
          />
          <Text className="text-sm font-bold text-gray-700">
            {cancion.perfil?.username || "Usuario desconocido"}
          </Text>
        </TouchableOpacity>

        {/* Colaborador (si existe) */}
        {colaboracion && colaboracion.estado === "aceptada" && (
          <View className="flex-row items-center justify-end flex-1">
            <Text className="text-xs font-bold text-primary-500">FEAT.</Text>
            <TouchableOpacity
              onPress={() =>
                router.push(`/public-profile/${colaboracion.usuario_id2}`)
              }
              className="flex-row items-center ml-2"
            >
              <Text className="text-sm font-bold text-gray-700 mr-2">
                {colaboracion.perfil2?.username || "Usuario desconocido"}
              </Text>
              <Image
                source={{
                  uri: colaboracion.perfil2?.foto_perfil
                    ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${colaboracion.perfil2.foto_perfil}`
                    : "https://via.placeholder.com/30",
                }}
                className="w-6 h-6 rounded-full"
              />
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity onPress={handleOptionsPress} className="ml-2">
          <Ionicons name="ellipsis-vertical" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };

  const handleCloseCommentsModal = () => {
    setCommentsModalVisible(false);
    router.setParams({ showComments: undefined });
  };

  const getTotalCommentsCount = () => {
    return comentarios.reduce((total, comment) => {
      return total + 1 + (comment.respuestas?.length || 0);
    }, 0);
  };

  return (
    <View className="bg-white rounded-lg shadow-md mb-4 p-4">
      {renderHeader()}
      <View className="flex-row">
        {/* Imagen de portada */}
        <View>
          <TouchableOpacity onPress={toggleImageModal}>
            <Image
              source={{
                uri: cancion.caratula || "https://via.placeholder.com/100",
              }}
              className="w-20 h-20 rounded-lg"
            />
          </TouchableOpacity>
        </View>

        {/* Contenido principal */}
        <View className="flex-1 ml-4">
          {/* Título, género y descripción */}
          <Text className="font-JakartaSemiBold text-md mb-1 text-primary-700">
            {cancion.titulo}
          </Text>
          <Text className="text-xs mb-1 text-secondary-500">
            {cancion.genero}
          </Text>
          <Text className="text-xs text-general-200 mb-2" numberOfLines={2}>
            {cancion.contenido}
          </Text>

          {/* Controles, estadísticas y fecha */}
          <View className="flex-row justify-between items-center mt-2">
            {/* Fecha de creación */}
            <Text className="text-xs text-general-200">
              {new Date(cancion.created_at).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "long",
              })}
            </Text>

            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={handleLike}
                className="flex-row items-center mr-4"
              >
                <Image
                  source={isLiked ? icons.hearto : icons.heart}
                  className="w-5 h-5 mr-1"
                  style={{ tintColor: isLiked ? "#6D29D2" : undefined }}
                />
                <Text className="text-xs text-primary-500">{likes.length}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={toggleCommentsModal}
                className="flex-row items-center mr-4"
              >
                <Image source={icons.comentario} className="w-5 h-5 mr-1" />
                <Text className="text-xs">{getTotalCommentsCount()}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePlayPause}>
                <Ionicons
                  name={
                    currentSong?.id === cancion.id && globalIsPlaying
                      ? "pause"
                      : "play"
                  }
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
            source={{
              uri: cancion.caratula || "https://via.placeholder.com/300",
            }}
            className="w-11/12 h-5/6"
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>

      {/* Modal comentarios*/}
      <CommentSection
        songId={cancion.id}
        currentUserId={currentUserId}
        isVisible={commentsModalVisible}
        onClose={handleCloseCommentsModal}
        cancion={{
          id: cancion.id,
          titulo: cancion.titulo,
          usuario_id: cancion.usuario_id,
        }}
      />

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
            {cancion.usuario_id === currentUserId ? (
              <>
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
              </>
            ) : (
              <TouchableOpacity className="py-3" onPress={handleReportPress}>
                <Text className="text-red-500 font-JakartaMedium">
                  Reportar contenido
                </Text>
              </TouchableOpacity>
            )}
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
            <Text className="text-xl font-JakartaBold mb-4">
              Reportar contenido
            </Text>
            <Text className="text-sm text-gray-600 mb-4">
              Selecciona una razón para reportar esta canción. Un reporte
              injustificado o malintencionado podría resultar en una suspensión
              de tu cuenta.
            </Text>
            {reportReasons.map((reason, index) => (
              <TouchableOpacity
                key={index}
                className={`py-3 border-b border-gray-200 ${selectedReportReason === reason ? "bg-primary-100" : ""}`}
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
              <Text className="text-white font-JakartaBold">
                Enviar reporte
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="mt-2 py-3 items-center"
              onPress={() => setShowReportModal(false)}
            >
              <Text className="text-primary-500 font-JakartaMedium">
                Cancelar
              </Text>
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
              Recuerda que solo puedes enviar un total de 3 reportes cada 12
              horas.
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
            {cancion.usuario_id === currentUserId ? (
              <TouchableOpacity
                className="bg-red-500 rounded-lg p-2"
                onPress={handleDeleteComment}
              >
                <Text className="text-white text-center">
                  Eliminar comentario
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <TextInput
                  className="border border-gray-300 rounded-lg p-2 mb-4"
                  value={editingComment}
                  onChangeText={setEditingComment}
                  multiline
                />
                <TouchableOpacity
                  className="bg-blue-500 rounded-lg p-2 mb-2"
                  onPress={handleEditComment}
                >
                  <Text className="text-white text-center">
                    Editar comentario
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-red-500 rounded-lg p-2"
                  onPress={handleDeleteComment}
                >
                  <Text className="text-white text-center">
                    Eliminar comentario
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default SongCard;