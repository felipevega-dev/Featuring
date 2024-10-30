import React, { useState, useEffect, useRef } from "react";
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
import * as FileSystem from "expo-file-system";
import AudioPlayer from '@/components/AudioPlayer';
import * as DocumentPicker from 'expo-document-picker';
import { useUnreadMessages } from '@/contexts/UnreadMessagesContext';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Message {
  id: number;
  emisor_id: string;
  receptor_id: string;
  contenido: string;
  tipo_contenido: "texto" | "audio" | "imagen" | "video" | "archivo";
  url_contenido: string | null;
  fecha_envio: string;
}

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

  const [isBlocked, setIsBlocked] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const { updateUnreadMessagesCount } = useUnreadMessages();

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // 1. Obtener usuario y datos iniciales
        await getCurrentUser();
        
        if (currentUserId) {
          // 2. Cargar todos los datos iniciales inmediatamente
          await Promise.all([
            fetchMessages(),
            getOtherUserInfo(),
            checkIfUserIsBlocked(id).then(setIsBlocked),
            markMessagesAsRead()
          ]);

          // 3. Configurar suscripción en tiempo real
          const channel = supabase
            .channel(`chat-${id}-${currentUserId}`)
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'mensaje',
                filter: `or(emisor_id.eq.${id},receptor_id.eq.${id})`,
              },
              async (payload) => {
                console.log('Nuevo mensaje recibido:', payload);
                await fetchMessages();
                
                const newMsg = payload.new as Message;
                if (newMsg.receptor_id === currentUserId) {
                  await markMessagesAsRead();
                  updateUnreadMessagesCount();
                }

                if (flatListRef.current) {
                  flatListRef.current.scrollToOffset({ offset: 0, animated: true });
                }
              }
            )
            .subscribe();

          // 4. Iniciar el refresco automático después de la carga inicial
          refreshInterval = setInterval(async () => {
            await fetchMessages();
          }, 5000);

          return () => {
            channel.unsubscribe();
          };
        }
      } catch (error) {
        console.error('Error en la inicialización:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Forzar una recarga inmediata al entrar
    initialize();

    // Limpieza al desmontar
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [currentUserId, id]); // Añadimos currentUserId como dependencia

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
    if (!currentUserId) return;
    
    try {
      const { data: blockedUsers = [] } = await supabase
        .from("bloqueo")
        .select("bloqueado_id")
        .eq("usuario_id", currentUserId);

      const blockedUserIds = blockedUsers?.map(user => user.bloqueado_id) || [];

      const { data, error } = await supabase
        .from("mensaje")
        .select("*")
        .or(
          `and(emisor_id.eq.${currentUserId},receptor_id.eq.${id}),and(emisor_id.eq.${id},receptor_id.eq.${currentUserId})`
        )
        .not("emisor_id", "in", `(${blockedUserIds.join(",")})`)
        .order("fecha_envio", { ascending: false });

      if (error) throw error;

      // Comparar los nuevos mensajes con los actuales antes de actualizar
      setMessages(prevMessages => {
        const hasChanges = JSON.stringify(prevMessages) !== JSON.stringify(data);
        return hasChanges ? [...(data || [])] : prevMessages;
      });
    } catch (error) {
      console.error("Error al obtener mensajes:", error);
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
    }
  };

  const sendAudioMessage = async (uri: string) => {
    try {
      if (!currentUserId) {
        throw new Error("Usuario no autenticado");
      }

      const fileName = `audio_${Date.now()}.m4a`;
      const filePath = `${currentUserId}/${fileName}`;

      const fileContent = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const blob = new Blob([Buffer.from(fileContent, 'base64')], { type: 'audio/m4a' });

      const { data, error } = await supabase.storage
        .from("audio_messages")
        .upload(filePath, blob, {
          contentType: "audio/m4a",
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("audio_messages")
        .getPublicUrl(filePath);

      console.log("Audio uploaded, public URL:", publicUrl);
      await sendMessage("Audio message", "audio", publicUrl);
    } catch (error) {
      console.error("Error sending audio message:", error);
    }
  };

  const sendMessage = async (
    content: string,
    tipo: "texto" | "audio" | "imagen" | "video" | "archivo",
    url?: string
  ) => {
    if ((!content.trim() && tipo === "texto") || !currentUserId) return;

    try {
      const { data, error } = await supabase
        .from("mensaje")
        .insert({
          emisor_id: currentUserId,
          receptor_id: id,
          contenido: content.trim(),
          tipo_contenido: tipo,
          url_contenido: url || null,
        })
        .select();

      if (error) throw error;
      setNewMessage("");
      
      // No necesitamos actualizar messages aquí ya que la suscripción lo manejará
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
      Alert.alert("Error", "No se pudo enviar el mensaje");
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
      const fileContent = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const blob = new Blob([Buffer.from(fileContent, 'base64')], { 
        type: tipo === 'imagen' ? "image/jpeg" : "video/mp4" 
      });

      const fileName = `${tipo}_${Date.now()}.${uri.split('.').pop()}`;
      const filePath = `${currentUserId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from("chat_media")
        .upload(filePath, blob, {
          contentType: tipo === 'imagen' ? "image/jpeg" : "video/mp4",
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("chat_media")
        .getPublicUrl(filePath);

      console.log(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} uploaded, public URL:`, publicUrl);
      await sendMessage(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} message`, tipo, publicUrl);
    } catch (error) {
      console.error(`Error sending ${tipo} message:`, error);
      Alert.alert("Error", `No se pudo enviar el ${tipo}`);
    }
  };

  const handleVideoPress = (uri: string) => {
    // Aquí puedes usar un componente de video o abrir el video en un navegador
    // Por ejemplo, usando un modal o un navegador externo
    Linking.openURL(uri); // Abre el video en el navegador
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync();
      
      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        await sendFileMessage(file.uri, file.name);
      }
    } catch (err) {
      console.error('Error al seleccionar el archivo:', err);
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

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.emisor_id === currentUserId;

    // Función para formatear la hora
    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    return (
      <TouchableOpacity
        onLongPress={() => setSelectedMessage(item)}
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
          {item.tipo_contenido === 'video' && item.url_contenido && (
            <Video
              source={{ uri: item.url_contenido }}
              style={{ width: '100%', height: 200, borderRadius: 10 }}
              useNativeControls
              resizeMode={Video.RESIZE_MODE_CONTAIN}
              isLooping
            />
          )}
          {item.tipo_contenido === 'archivo' && item.url_contenido && (
            <TouchableOpacity onPress={() => Linking.openURL(item.url_contenido!)}>
              <Text className={`${isCurrentUser ? 'text-white' : 'text-primary-700'} font-JakartaMedium`}>
                {item.contenido}
              </Text>
            </TouchableOpacity>
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
  };

  const blockUser = async (userIdToBlock: string) => {
    try {
        if (!currentUserId) {
            throw new Error("Usuario no autenticado");
        }

        const { data, error } = await supabase
            .from("bloqueo")
            .insert({
                usuario_id: currentUserId,
                bloqueado_id: userIdToBlock,
            });

        if (error) throw error;

        console.log("Usuario bloqueado:", data);
        Alert.alert("Éxito", "Usuario bloqueado correctamente.");
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

        const { error } = await supabase
            .from("bloqueo")
            .delete()
            .match({
                usuario_id: currentUserId,
                bloqueado_id: userIdToUnblock,
            });

        if (error) throw error;

        console.log("Usuario desbloqueado");
        Alert.alert("Éxito", "Usuario desbloqueado correctamente.");
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

  if (isLoading) {
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
              source={{ uri: otherUserAvatar }}
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
              onPress={pickDocument}
              className="bg-primary-500 rounded-full p-2 mr-2"
            >
              <FontAwesome name="paperclip" size={20} color="white" />
            </TouchableOpacity>
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
                onPress={toggleBlockUser}
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>
                  {isBlocked ? "Desbloquear" : "Bloquear"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.optionButton}
              >
                <Text style={styles.optionText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Fondo semi-transparente
  },
  modalContent: {
    width: 300,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  optionButton: {
    padding: 10,
    width: "100%",
    alignItems: "center",
  },
  optionText: {
    fontSize: 16,
  },
});
