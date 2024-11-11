import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Image,
  Dimensions,
  Linking,
  Modal,
  StyleSheet,
  StatusBar,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { Audio, Video } from "expo-av";
import * as ImagePicker from 'expo-image-picker';
import AudioPlayer from '@/components/AudioPlayer';
import { useUnreadMessages } from '@/contexts/UnreadMessagesContext';
import Constants from 'expo-constants';
import { ResizeMode } from 'expo-av';
import { sendPushNotification } from '@/utils/pushNotifications';
import { ReportButton } from '../../../../components/reports/ReportButton';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Message {
  id: number;
  emisor_id: string;
  receptor_id: string;
  contenido: string;
  tipo_contenido: "texto" | "audio" | "imagen" | "video_chat";
  url_contenido: string | null;
  fecha_envio: string;
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
};

export default function ChatDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState<string>("");
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showReportOptions, setShowReportOptions] = useState(false);

  const [isBlocked, setIsBlocked] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const { updateUnreadMessagesCount } = useUnreadMessages();

  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;

  const [isBlockModalVisible, setIsBlockModalVisible] = useState(false);

  const [loadingStates, setLoadingStates] = useState({
    messages: false,
    sending: false,
    media: false
  });
  const [error, setError] = useState<string | null>(null);

  const handleError = (error: any, context: string) => {
    console.error(`Error en ${context}:`, error);
    setError(`Error: ${error.message}`);
    setTimeout(() => setError(null), 3000);
  };

  useEffect(() => {
    let channel: RealtimeChannel;
    
    const initialize = async () => {
      try {
        setLoadingStates(prev => ({ ...prev, messages: true }));
        
        await getCurrentUser();
        
        if (currentUserId) {
          await Promise.all([
            fetchMessages(),
            getOtherUserInfo(),
            checkIfUserIsBlocked(id).then(setIsBlocked),
            markMessagesAsRead()
          ]);

          channel = supabase
            .channel(`chat-${id}-${currentUserId}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'mensaje',
                filter: `or(and(emisor_id.eq.${currentUserId},receptor_id.eq.${id}),and(emisor_id.eq.${id},receptor_id.eq.${currentUserId}))`,
              },
              async (payload) => {
                console.log('Cambio en mensajes:', payload);
                
                if (payload.eventType === 'INSERT') {
                  const newMsg = payload.new as Message;
                  setMessages(prev => {
                    const msgExists = prev.some(msg => msg.id === newMsg.id);
                    if (msgExists) return prev;
                    return [newMsg, ...prev];
                  });

                  if (newMsg.receptor_id === currentUserId) {
                    await markMessagesAsRead();
                    updateUnreadMessagesCount();
                  }

                  if (flatListRef.current) {
                    flatListRef.current.scrollToOffset({ offset: 0, animated: true });
                  }
                } else if (payload.eventType === 'DELETE') {
                  setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
                }
              }
            )
            .subscribe((status) => {
              console.log('Status de suscripción:', status);
            });
        }
      } catch (error) {
        handleError(error, 'initialization');
      } finally {
        setLoadingStates(prev => ({ ...prev, messages: false }));
      }
    };

    initialize();

    return () => {
      if (channel) {
        console.log('Desuscribiendo del canal...');
        channel.unsubscribe();
      }
    };
  }, [currentUserId, id]);

  useEffect(() => {
    (async () => {
      const { status: recordingStatus } = await Audio.requestPermissionsAsync();
      const { status: playbackStatus } = await Audio.requestPermissionsAsync();
      if (recordingStatus !== 'granted' || playbackStatus !== 'granted') {
        Alert.alert('Permiso denegado', 'No se pueden acceder a las funciones de audio');
      }
    })();
  }, []);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  const getOtherUserInfo = async () => {
    const { data, error } = await supabase
      .from("perfil")
      .select("username, foto_perfil")
      .eq("usuario_id", id)
      .single();

    if (error)
      console.error("Error al obtener la información del usuario:", error);
    else if (data) {
      setOtherUserName(data.username);
      setOtherUserAvatar(data.foto_perfil);
    }
  };

  const fetchMessages = async () => {
    if (!currentUserId) {
      console.log('No hay usuario actual');
      return;
    }
    
    try {
      console.log('Fetching messages for:', { currentUserId, otherId: id });
      
      const { data: bloqueos, error: bloqueoError } = await supabase
        .from("bloqueo")
        .select("*")
        .or(`and(usuario_id.eq.${currentUserId},bloqueado_id.eq.${id}),and(usuario_id.eq.${id},bloqueado_id.eq.${currentUserId})`);

      if (bloqueoError) {
        console.error('Error al verificar bloqueos:', bloqueoError);
        throw bloqueoError;
      }

      if (bloqueos && bloqueos.length > 0) {
        console.log('Usuario bloqueado');
        setMessages([]);
        return;
      }

      const MESSAGES_PER_PAGE = 20;
      const { data, error } = await supabase
        .from("mensaje")
        .select("*")
        .or(
          `and(emisor_id.eq.${currentUserId},receptor_id.eq.${id}),and(emisor_id.eq.${id},receptor_id.eq.${currentUserId})`
        )
        .order("fecha_envio", { ascending: false })
        .range(0, MESSAGES_PER_PAGE - 1);

      if (error) {
        console.error('Error al obtener mensajes:', error);
        throw error;
      }

      console.log('Mensajes obtenidos:', data?.length || 0);
      setMessages(data || []);
    } catch (error) {
      console.error("Error al obtener mensajes:", error);
      handleError(error, 'fetching messages');
    }
  };

  const handleNewMessage = (payload: any) => {
    const newMsg = payload.new as Message;
    setMessages((prevMessages) => [newMsg, ...prevMessages]);
  };

  const startRecording = async () => {
    try {
      console.log("Requesting permissions..");
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      console.log("Starting recording..");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording", err);
      Alert.alert("Error", "No se pudo iniciar la grabación");
    }
  };

  const stopRecording = async () => {
    console.log("Stopping recording..");
    if (!recording) {
      console.log("No recording to stop");
      return;
    }

    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      console.log("Recording stopped and stored at", uri);
      if (uri) {
        await sendAudioMessage(uri);
      }
    } catch (error) {
      console.error("Failed to stop recording", error);
      handleError(error, 'stopping recording');
    }
  };

  const sendAudioMessage = async (uri: string) => {
    try {
      setLoadingStates(prev => ({ ...prev, media: true }));
      
      if (!currentUserId) {
        throw new Error("Usuario no autenticado");
      }

      const fileName = `audio_${Date.now()}.m4a`;
      const filePath = `${currentUserId}/${fileName}`;

      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        name: fileName,
        type: 'audio/m4a'
      } as any);

      // Subir el archivo
      const response = await fetch(`${supabaseUrl}/storage/v1/object/audio_messages/${filePath}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      const { data: { publicUrl } } = supabase.storage
        .from('audio_messages')
        .getPublicUrl(filePath);

      // Insertar el mensaje y obtener el mensaje completo
      const { data: messageData, error: messageError } = await supabase
        .from("mensaje")
        .insert({
          emisor_id: currentUserId,
          receptor_id: id,
          contenido: "Audio message",
          tipo_contenido: "audio",
          url_contenido: publicUrl,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Actualizar el estado localmente
      if (messageData) {
        setMessages(prev => [messageData, ...prev]);
        
        // Scroll al último mensaje
        if (flatListRef.current) {
          flatListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
      }

      console.log("Audio enviado y mensaje creado:", messageData);

    } catch (error) {
      console.error("Error sending audio message:", error);
      handleError(error, 'sending audio');
    } finally {
      setLoadingStates(prev => ({ ...prev, media: false }));
    }
  };

  const sendMessage = async (
    content: string,
    tipo: "texto" | "audio" | "imagen" | "video" | "archivo",
    url?: string
  ) => {
    if ((!content.trim() && tipo === "texto") || !currentUserId) return;

    try {
      setLoadingStates(prev => ({ ...prev, sending: true }));

      const { data: bloqueos } = await supabase
        .from("bloqueo")
        .select("*")
        .or(`and(usuario_id.eq.${currentUserId},bloqueado_id.eq.${id}),and(usuario_id.eq.${id},bloqueado_id.eq.${currentUserId})`);

      if (bloqueos && bloqueos.length > 0) {
        Alert.alert(
          "No se puede enviar el mensaje",
          "No es posible enviar mensajes debido a que uno de los usuarios ha bloqueado al otro."
        );
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('perfil')
        .select('username')
        .eq('usuario_id', currentUserId)
        .single();

      if (userError) throw userError;

      const { data: receiverData, error: receiverError } = await supabase
        .from('perfil')
        .select('push_token')
        .eq('usuario_id', id)
        .single();

      if (receiverError) throw receiverError;

      // Insertar el mensaje y obtener el mensaje completo
      const { data: messageData, error } = await supabase
        .from("mensaje")
        .insert({
          emisor_id: currentUserId,
          receptor_id: id,
          contenido: content.trim(),
          tipo_contenido: tipo,
          url_contenido: url || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Actualizar el estado localmente
      if (messageData) {
        setMessages(prev => [messageData, ...prev]);
        
        // Scroll al último mensaje
        if (flatListRef.current) {
          flatListRef.current.scrollToOffset({ offset: 0, animated: true });
        }
      }

      if (receiverData?.push_token) {
        const mensajeNotificacion = tipo === "texto" 
          ? content.slice(0, 50) + (content.length > 50 ? "..." : "")
          : `Te ha enviado un ${tipo}`;

        await sendPushNotification(
          receiverData.push_token,
          `Mensaje de ${userData.username}`,
          mensajeNotificacion
        );
      }

      setNewMessage("");
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      handleError(error, 'sending message');
    } finally {
      setLoadingStates(prev => ({ ...prev, sending: false }));
    }
  };

  const handleLongPress = (message: Message) => {
    if (message.emisor_id === currentUserId) {
      setSelectedMessage(message);
    }
  };

  const handleBackgroundPress = () => {
    setSelectedMessage(null);
  };

  const deleteMessage = async () => {
    if (!selectedMessage) return;

    try {
      const { error } = await supabase
        .from("mensaje")
        .delete()
        .eq("id", selectedMessage.id);

      if (error) throw error;

      if (
        selectedMessage.tipo_contenido === "audio" &&
        selectedMessage.url_contenido
      ) {
        const filePath = selectedMessage.url_contenido.split("/").pop();
        if (filePath) {
          const { error: storageError } = await supabase.storage
            .from("audio_messages")
            .remove([`${currentUserId}/${filePath}`]);

          if (storageError)
            console.error("Error deleting audio file:", storageError);
        }
      }

      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.id !== selectedMessage.id)
      );
      setSelectedMessage(null);
    } catch (error) {
      console.error("Error deleting message:", error);
      Alert.alert("Error", "No se pudo eliminar el mensaje");
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      await sendMediaMessage(asset.uri, asset.type === 'video' ? 'video' : 'imagen');
    }
  };

  const sendMediaMessage = async (uri: string, tipo: 'imagen' | 'video') => {
    try {
      setLoadingStates(prev => ({ ...prev, media: true }));
      
      if (!currentUserId) {
        throw new Error("Usuario no autenticado");
      }

      // Comprimir imagen/video antes de subir
      let compressedUri = uri;
      if (tipo === 'imagen') {
        const manipResult = await manipulateAsync(
          uri,
          [{ resize: { width: 1080 } }],
          { compress: 0.7, format: SaveFormat.JPEG }
        );
        compressedUri = manipResult.uri;
      }

      const formData = new FormData();
      const extension = compressedUri.split('.').pop();
      const fileName = `${Date.now()}.${extension}`;
      const filePath = `${currentUserId}/${fileName}`;

      formData.append('file', {
        uri: compressedUri,
        name: fileName,
        type: tipo === 'imagen' ? 'image/jpeg' : 'video/mp4'
      } as any);

      const bucket = tipo === 'imagen' ? 'chat_images' : 'chat_videos';

      const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      const { data: messageData, error: messageError } = await supabase
        .from("mensaje")
        .insert({
          emisor_id: currentUserId,
          receptor_id: id,
          contenido: `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} message`,
          tipo_contenido: tipo === 'imagen' ? 'imagen' : 'video_chat',
          url_contenido: publicUrl,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      if (messageData) {
        setMessages(prev => [messageData, ...prev]);
      }

    } catch (error) {
      console.error(`Error sending ${tipo} message:`, error);
      handleError(error, `sending ${tipo}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, media: false }));
    }
  };

  const sendFileMessage = async (uri: string, fileName: string) => {
    try {
      if (!currentUserId) {
        throw new Error("Usuario no autenticado");
      }

      const filePath = `${currentUserId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from("chat_files")
        .upload(filePath, {
          uri: uri,
          type: "application/octet-stream",
          name: fileName,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("chat_files")
        .getPublicUrl(filePath);

      console.log("Archivo subido, URL pública:", publicUrl);
      await sendMessage(`Archivo: ${fileName}`, "archivo", publicUrl);
    } catch (error) {
      console.error("Error al enviar el archivo:", error);
      Alert.alert("Error", "No se pudo enviar el archivo");
    }
  };

  // Memoizar el renderizado de mensajes
  const MemoizedMessage = React.memo(({ item, isCurrentUser, onLongPress }: {
    item: Message;
    isCurrentUser: boolean;
    onLongPress: () => void;
  }) => {
    return (
      <TouchableOpacity
        onLongPress={onLongPress}
        className={`flex-row ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}
      >
        <View
          className={`rounded-lg p-3 ${
            isCurrentUser ? 'bg-primary-500' : 'bg-primary-100'
          } ${['audio', 'imagen', 'video', 'archivo'].includes(item.tipo_contenido) ? 'w-[80%]' : 'max-w-[80%]'}`}
        >
          {item.tipo_contenido === 'texto' && (
            <Text
              className={`${
                isCurrentUser ? 'text-white' : 'text-primary-700'
              } font-JakartaMedium`}
            >
              {item.contenido}
            </Text>
          )}
          {item.tipo_contenido === 'audio' && item.url_contenido && (
            <AudioPlayer uri={item.url_contenido} />
          )}
          {item.tipo_contenido === 'imagen' && item.url_contenido && (
            <Image
              source={{ uri: item.url_contenido }}
              style={{ width: '100%', height: 200, borderRadius: 10 }}
              resizeMode="cover"
            />
          )}
          {item.tipo_contenido === 'video_chat' && item.url_contenido && (
            <Video
              source={{ uri: item.url_contenido }}
              style={{ width: '100%', height: 200, borderRadius: 10 }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
            />
          )}
          <Text
            className={`text-xs mt-1 ${
              isCurrentUser ? 'text-primary-200' : 'text-primary-400'
            }`}
          >
            {formatTime(item.fecha_envio)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  });

  // Usar el componente memoizado en el FlatList
  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isCurrentUser = item.emisor_id === currentUserId;
    return (
      <MemoizedMessage
        item={item}
        isCurrentUser={isCurrentUser}
        onLongPress={() => handleLongPress(item)}
      />
    );
  }, [currentUserId]);

  const blockUser = async (userIdToBlock: string) => {
    try {
      if (!currentUserId) {
        throw new Error("Usuario no autenticado");
      }

      Alert.alert(
        "Bloquear usuario",
        "¿Estás seguro de que quieres bloquear a este usuario? No podrás recibir mensajes ni interactuar con él.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Bloquear",
            style: "destructive",
            onPress: async () => {
              const { error } = await supabase
                .from("bloqueo")
                .insert({
                  usuario_id: currentUserId,
                  bloqueado_id: userIdToBlock,
                });

              if (error) throw error;

              setIsBlocked(true);
              setModalVisible(false);
              Alert.alert("Usuario bloqueado", "Ya no recibirás mensajes de este usuario.");
              router.push("/chat"); // Regresar a la lista de chats
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error al bloquear usuario:", error);
      Alert.alert("Error", "No se pudo bloquear al usuario.");
    }
  };

  const unblockUser = async (userIdToUnblock: string) => {
    try {
      if (!currentUserId) {
        throw new Error("Usuario no autenticado");
      }

      Alert.alert(
        "Desbloquear usuario",
        "¿Estás seguro de que quieres desbloquear a este usuario?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Desbloquear",
            onPress: async () => {
              const { error } = await supabase
                .from("bloqueo")
                .delete()
                .match({
                  usuario_id: currentUserId,
                  bloqueado_id: userIdToUnblock,
                });

              if (error) throw error;

              setIsBlocked(false);
              setModalVisible(false);
              Alert.alert("Usuario desbloqueado", "Ahora podrás volver a interactuar con este usuario.");
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error al desbloquear usuario:", error);
      Alert.alert("Error", "No se pudo desbloquear al usuario.");
    }
  };

  const checkIfUserIsBlocked = async (userId: string) => {
    if (!currentUserId) return false;

    const { data, error } = await supabase
        .from("bloqueo")
        .select("id")
        .eq("usuario_id", currentUserId)
        .eq("bloqueado_id", userId)
        .single();

    return data !== null; // Retorna true si el usuario está bloqueado
  };

  const toggleBlockUser = () => {
    if (isBlocked) {
      unblockUser(id);
    } else {
      blockUser(id);
    }
    setIsBlocked(!isBlocked);
    setModalVisible(false); // Cierra el modal después de la acción
  };

  const markMessagesAsRead = async () => {
    if (!currentUserId) return;

    try {
      const { error } = await supabase
        .from("mensaje")
        .update({ leido: true })
        .eq("receptor_id", currentUserId)
        .eq("emisor_id", id)
        .eq("leido", false);

      if (error) throw error;

      // Actualizar el contador de mensajes no leídos
      updateUnreadMessagesCount();
    } catch (error) {
      console.error("Error al marcar mensajes como leídos:", error);
    }
  };

  // Añade esta función para cancelar la conexión
  const cancelarConexion = async () => {
    try {
      if (!currentUserId) {
        throw new Error("Usuario no autenticado");
      }

      // Primero verificamos si existe la conexión con los nombres correctos de las columnas
      const { data: conexiones, error: errorBusqueda } = await supabase
        .from("conexion")
        .select("*")
        .or(`and(usuario1_id.eq.${currentUserId},usuario2_id.eq.${id}),and(usuario1_id.eq.${id},usuario2_id.eq.${currentUserId})`);

      if (errorBusqueda) {
        console.error("Error al buscar la conexión:", errorBusqueda);
        Alert.alert("Error", "No se pudo verificar la conexión");
        return;
      }

      if (!conexiones || conexiones.length === 0) {
        Alert.alert("Error", "No existe una conexión activa con este usuario");
        return;
      }

      Alert.alert(
        "Cancelar conexión",
        "¿Estás seguro de que quieres cancelar la conexión con este usuario?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Sí, cancelar",
            style: "destructive",
            onPress: async () => {
              // Eliminar todas las conexiones encontradas
              const { error } = await supabase
                .from("conexion")
                .delete()
                .or(`and(usuario1_id.eq.${currentUserId},usuario2_id.eq.${id}),and(usuario1_id.eq.${id},usuario2_id.eq.${currentUserId})`);

              if (error) throw error;

              setModalVisible(false);
              Alert.alert("Conexión cancelada", "Has cancelado la conexión con este usuario.");
              router.push("/chat"); // Regresar a la lista de chats
            }
          }
        ]
      );
    } catch (error) {
      console.error("Error al cancelar la conexión:", error);
      Alert.alert("Error", "No se pudo cancelar la conexión.");
    }
  };

  if (loadingStates.messages) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#6D29D2" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <View className="flex-1 bg-white">
        <View className="flex-row items-center p-4 bg-white border-b border-primary-200">
          <TouchableOpacity onPress={() => router.push("/chat")} className="mr-4">
            <FontAwesome name="arrow-left" size={24} color="#6D29D2" />
          </TouchableOpacity>
          {otherUserAvatar && (
            <Image
              source={{ 
                uri: `${supabaseUrl}/storage/v1/object/public/fotoperfil/${otherUserAvatar}`
              }}
              className="w-10 h-10 rounded-full mr-3"
            />
          )}
          <Text className="text-lg font-JakartaBold text-primary-700 flex-1">
            {otherUserName}
          </Text>
          {selectedMessage && (
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Eliminar mensaje",
                  "¿Estás seguro de que quieres eliminar este mensaje?",
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Eliminar",
                      onPress: deleteMessage,
                      style: "destructive",
                    },
                  ]
                )
              }
            >
              <FontAwesome name="trash" size={24} color="#6D29D2" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={styles.threeDotsButton}
          >
            <FontAwesome name="ellipsis-v" size={20} color="#6D29D2" />
          </TouchableOpacity>
        </View>

        {isBlocked ? (
          <View className="flex-1 justify-center items-center p-4">
            <Text className="text-lg text-gray-600 text-center mb-2">
              No puedes enviar mensajes a este usuario
            </Text>
            <Text className="text-sm text-gray-500 text-center">
              Uno de los usuarios ha bloqueado al otro
            </Text>
          </View>
        ) : (
          <>
            <View className="flex-1">
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => `message-${item.id}`}
                inverted
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: "flex-end",
                  paddingVertical: 10,
                  margin: 12,
                }}
              />
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
              <View className="flex-row items-center p-2 bg-white border-t border-primary-200">
                <TextInput
                  className="flex-1 bg-primary-100 rounded-full px-4 py-2 mr-2"
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="Escribe un mensaje..."
                />

                <TouchableOpacity
                  onPress={pickImage}
                  className="bg-primary-500 rounded-full p-2 mr-2"
                >
                  <FontAwesome name="image" size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={isRecording ? stopRecording : startRecording}
                  className="bg-primary-500 rounded-full p-2 mr-2"
                >
                  <FontAwesome
                    name={isRecording ? "stop" : "microphone"}
                    size={20}
                    color="white"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => sendMessage(newMessage, "texto")}
                  className="bg-primary-500 rounded-full p-2"
                >
                  <FontAwesome name="send" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </>
        )}

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Opciones</Text>
              <TouchableOpacity
                onPress={() => toggleBlockUser()}
                style={[
                  styles.optionButton,
                  { backgroundColor: isBlocked ? '#4CAF50' : '#FF3B30' }
                ]}
              >
                <Text style={[styles.optionText, { color: 'white' }]}>
                  {isBlocked ? "Desbloquear usuario" : "Bloquear usuario"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={cancelarConexion}
                style={[styles.optionButton, { marginTop: 10, backgroundColor: '#f43f5e' }]}
              >
                <Text style={[styles.optionText, { color: 'white' }]}>Cancelar conexión</Text>
              </TouchableOpacity>
              <ReportButton
                contentId={id}
                contentType="chat"
                reportedUserId={id}
                currentUserId={currentUserId || ''}
                buttonStyle="mt-2 bg-yellow-500 w-full font-JakartaMedium"
                buttonText="Reportar chat"
              />
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.optionButton, { marginTop: 10, backgroundColor: '#6D29D2' }]}
              >
                <Text style={[styles.optionText, { color: 'white' }]}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal de opciones de reporte */}
        <Modal
          visible={showReportOptions}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            setShowReportOptions(false);
            setSelectedMessage(null);
          }}
        >
          <TouchableOpacity
            className="flex-1 bg-black/50 justify-center items-center"
            activeOpacity={1}
            onPress={() => {
              setShowReportOptions(false);
              setSelectedMessage(null);
            }}
          >
            <View className="bg-white rounded-lg w-[80%] p-4">
              <Text className="text-lg font-bold mb-4">Opciones de mensaje</Text>
              
              {selectedMessage && (
                <ReportButton
                  contentId={selectedMessage.id}
                  contentType={selectedMessage.tipo_contenido === 'video' ? 'video_chat' : selectedMessage.tipo_contenido}
                  reportedUserId={selectedMessage.emisor_id}
                  currentUserId={currentUserId || ''}
                  buttonStyle="bg-red-500 w-full mb-2"
                  buttonText={`Reportar ${
                    selectedMessage.tipo_contenido === 'texto' ? 'mensaje' :
                    selectedMessage.tipo_contenido === 'audio' ? 'audio' :
                    selectedMessage.tipo_contenido === 'imagen' ? 'imagen' :
                    selectedMessage.tipo_contenido === 'video_chat' ? 'video' : 'archivo'
                  }`}
                />
              )}
              
              <TouchableOpacity
                onPress={() => {
                  setShowReportOptions(false);
                  setSelectedMessage(null);
                }}
                className="bg-gray-200 p-3 rounded-lg"
              >
                <Text className="text-center font-medium">Cancelar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {error && (
          <View className="absolute top-0 w-full bg-red-500 p-2">
            <Text className="text-white text-center">{error}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  threeDotsButton: {
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: '80%',
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: '#1C1C1E'
  },
  optionButton: {
    padding: 15,
    width: "100%",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: '#F2F2F7'
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600"
  }
});
