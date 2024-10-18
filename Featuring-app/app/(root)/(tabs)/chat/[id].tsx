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
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from "expo-file-system";
import AudioPlayer from '@/components/AudioPlayer';

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Message {
  id: number;
  emisor_id: string;
  receptor_id: string;
  contenido: string;
  tipo_contenido: "texto" | "audio" | "imagen" | "video";
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

  useEffect(() => {
    getCurrentUser();
    fetchMessages();
    getOtherUserInfo();
    const subscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensaje",
          filter: `or(emisor_id.eq.${id},receptor_id.eq.${id})`,
        },
        handleNewMessage
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id, currentUserId]);

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
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("mensaje")
        .select("*")
        .or(
          `and(emisor_id.eq.${currentUserId},receptor_id.eq.${id}),and(emisor_id.eq.${id},receptor_id.eq.${currentUserId})`
        )
        .order("fecha_envio", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error al obtener mensajes:", error);
    } finally {
      setIsLoading(false);
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

      const { data, error } = await supabase.storage
        .from("audio_messages")
        .upload(filePath, {
          uri: uri,
          type: "audio/m4a",
          name: fileName,
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
    tipo: "texto" | "audio",
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
      if (data) setMessages((prevMessages) => [data[0], ...prevMessages]);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
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
      if (!currentUserId) {
        throw new Error("Usuario no autenticado");
      }

      const fileName = `${tipo}_${Date.now()}.${uri.split('.').pop()}`;
      const filePath = `${currentUserId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from("chat_media")
        .upload(filePath, {
          uri: uri,
          type: tipo === 'imagen' ? "image/jpeg" : "video/mp4",
          name: fileName,
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

  const renderMessage = ({ item }: { item: Message }) => {
    const isCurrentUser = item.emisor_id === currentUserId;

    return (
      <TouchableOpacity
        onLongPress={() => setSelectedMessage(item)}
        className={`flex-row ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}
      >
        <View
          className={`rounded-lg p-3 ${
            isCurrentUser ? 'bg-primary-500' : 'bg-primary-100'
          } ${['audio', 'imagen', 'video'].includes(item.tipo_contenido) ? 'w-[80%]' : 'max-w-[80%]'}`}
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
            <View>
              <Text className={`${isCurrentUser ? 'text-white' : 'text-primary-700'} font-JakartaMedium`}>
                Video: Toca para reproducir
              </Text>
              {/* Aquí puedes agregar un componente de reproducción de video si lo deseas */}
            </View>
          )}
          <Text
            className={`text-xs mt-1 ${
              isCurrentUser ? 'text-primary-200' : 'text-primary-400'
            }`}
          >
            {new Date(item.fecha_envio).toLocaleTimeString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#6D29D2" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white ">
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
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleBackgroundPress}
          className="flex-1 p-2"
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id.toString()}
            inverted
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "flex-end",
              paddingVertical: 10,
            }}
          />
        </TouchableOpacity>

        <View className="flex-row items-center p-2 bg-white border-t border-primary-200">
          
          <TextInput
            className="flex-1 bg-primary-100 rounded-full px-4 py-2 mr-2 mb-14"
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Escribe un mensaje..."
          />
          <TouchableOpacity
            onPress={pickImage}
            className="bg-primary-500 rounded-full p-2 mr-2 mb-14"
          >
            <FontAwesome name="image" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            className="bg-primary-500 rounded-full p-2 mr-2 mb-14"
          >
            <FontAwesome
              name={isRecording ? "stop" : "microphone"}
              size={20}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => sendMessage(newMessage, "texto")}
            className="bg-primary-500 rounded-full p-2 mb-14"
          >
            <FontAwesome name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
