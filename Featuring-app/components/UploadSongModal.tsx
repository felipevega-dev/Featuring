import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { supabase } from "@/lib/supabase";
import { Ionicons } from '@expo/vector-icons';
import GenreSelectionModal from './GenreSelectionModal';
import CollaboratorSelectionModal from './CollaboratorSelectionModal';

interface UploadSongModalProps {
  isVisible: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

interface Colaborador {
  usuario_id: string;
  username: string;
  foto_perfil: string | null;
}

export default function UploadSongModal({
  isVisible,
  onClose,
  onUploadSuccess,
}: UploadSongModalProps) {
  const [title, setTitle] = useState("");
  const [contenido, setContenido] = useState("");
  const [genre, setGenre] = useState("");
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImageName, setCoverImageName] = useState<string | null>(null);
  const [isGenreModalVisible, setIsGenreModalVisible] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<Colaborador | null>(null);
  const [isCollaboratorModalVisible, setIsCollaboratorModalVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const handleCollaboratorSelect = (colaborador: Colaborador) => {
    setSelectedCollaborator(colaborador);
    setIsCollaboratorModalVisible(false);
  };

  const sanitizeFileName = (fileName: string): string => {
    return fileName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  };

  const getFileNameWithoutExtension = (fileName: string): string => {
    return fileName.replace(/\.[^/.]+$/, "");
  };

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const fileName = result.assets[0].name;
        if (fileUri && fileName) {
          setAudioFile(fileUri);
          setAudioFileName(sanitizeFileName(fileName));
          // Set the title to the original file name without extension
          setTitle(getFileNameWithoutExtension(fileName));
        }
      }
    } catch (error) {
      console.error("Error picking audio:", error);
      Alert.alert("Error", "No se pudo seleccionar el archivo de audio");
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const fileName = fileUri.split("/").pop() || "cover.jpg";
        if (fileUri) {
          setCoverImage(fileUri);
          setCoverImageName(sanitizeFileName(fileName));
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen de portada");
    }
  };

  const uploadSong = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No se encontró el usuario");

      if (
        !title ||
        !audioFile ||
        !coverImage ||
        !audioFileName ||
        !coverImageName ||
        !contenido ||
        !genre
      ) {
        Alert.alert("Error", "Por favor, completa todos los campos obligatorios");
        return;
      }

      const sanitizedAudioFileName = sanitizeFileName(audioFileName);
      const sanitizedCoverImageName = sanitizeFileName(coverImageName);

      // Subir archivo de audio
      const formData = new FormData();
      formData.append('file', {
        uri: audioFile,
        name: sanitizedAudioFileName,
        type: 'audio/mpeg'
      } as any);

      const { data: audioData, error: audioUploadError } = await supabase.storage
        .from("canciones")
        .upload(`${user.id}/${sanitizedAudioFileName}`, formData);
      if (audioUploadError) throw audioUploadError;

      // Obtener URL pública del archivo de audio
      const {
        data: { publicUrl: audioPublicUrl },
      } = supabase.storage
        .from("canciones")
        .getPublicUrl(`${user.id}/${sanitizedAudioFileName}`);

      // Subir imagen de portada
      const imageFormData = new FormData();
      imageFormData.append('file', {
        uri: coverImage,
        name: sanitizedCoverImageName,
        type: 'image/jpeg'
      } as any);

      const { data: imageData, error: imageUploadError } = await supabase.storage
        .from("caratulas")
        .upload(`${user.id}/${sanitizedCoverImageName}`, imageFormData);
      if (imageUploadError) throw imageUploadError;

      // Obtener URL pública de la imagen de portada
      const {
        data: { publicUrl: imagePublicUrl },
      } = supabase.storage
        .from("caratulas")
        .getPublicUrl(`${user.id}/${sanitizedCoverImageName}`);

      // Crear entrada en la tabla cancion
      const { data: songData, error: songError } = await supabase
        .from("cancion")
        .insert({
          usuario_id: user.id,
          titulo: title,
          archivo_audio: audioPublicUrl,
          caratula: imagePublicUrl,
          contenido: contenido,
          genero: genre,
        })
        .select()
        .single();
      if (songError) throw songError;

      // Si hay un colaborador seleccionado, crear la colaboración
      if (selectedCollaborator) {
        const { error: collaborationError } = await supabase
          .from("colaboracion")
          .insert({
            cancion_id: songData.id,
            usuario_id: user.id,
            usuario_id2: selectedCollaborator.usuario_id,
            estado: 'pendiente'
          });

        if (collaborationError) throw collaborationError;

        // Crear notificación para el colaborador
        const { error: notificationError } = await supabase
          .from("notificacion")
          .insert({
            usuario_id: selectedCollaborator.usuario_id,
            usuario_origen_id: user.id,
            tipo_notificacion: 'solicitud_colaboracion',
            contenido_id: songData.id,
            mensaje: `${title} - Solicitud de colaboración pendiente`,
            leido: false
          });

        if (notificationError) throw notificationError;
      }

      Alert.alert("Éxito", "Tu canción ha sido subida");
      onUploadSuccess();
      onClose();
    } catch (error) {
      console.error("Error uploading song:", error);
      Alert.alert("Error", "No se pudo subir la canción");
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={false}>
      <View className="flex-1 bg-primary-900">
        <ScrollView className="flex-1">
          <View className="p-4">
            <View className="flex-row justify-between items-center mb-4">
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={uploadSong}>
                <Text className="text-white font-bold text-lg">Guardar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={pickImage} className="items-center mb-6">
              {coverImage ? (
                <View className="relative w-40 h-40">
                  <Image
                    source={{ uri: coverImage }}
                    className="w-full h-full rounded-lg"
                  />
                  <View className="absolute inset-0 bg-black bg-opacity-50 rounded-lg items-center justify-center">
                    <Ionicons name="camera" size={40} color="white" />
                  </View>
                </View>
              ) : (
                <View className="w-40 h-40 bg-primary-700 rounded-lg items-center justify-center">
                  <Ionicons name="camera" size={40} color="white" />
                </View>
              )}
            </TouchableOpacity>

            <Text className="text-primary-300 text-sm mb-1">Título</Text>
            <TextInput
              className="border-b border-primary-700 text-white p-2 mb-4"
              placeholder="Título"
              placeholderTextColor="#666"
              value={title}
              onChangeText={setTitle}
            />

            <Text className="text-primary-300 text-sm mb-1">Género</Text>
            <TouchableOpacity 
              onPress={() => setIsGenreModalVisible(true)}
              className="border-b border-primary-700 p-2 mb-4"
            >
              <Text className="text-white">{genre || "Elige un género"}</Text>
            </TouchableOpacity>

            <Text className="text-primary-300 text-sm mb-1">Descripción</Text>
            <TextInput
              className="border-b border-primary-700 text-white p-2 mb-4"
              placeholder="Describe tu pista"
              placeholderTextColor="#666"
              value={contenido}
              onChangeText={setContenido}
              multiline
            />

            <TouchableOpacity
              onPress={pickAudio}
              className="bg-secondary-500 p-3 rounded-full mb-4"
            >
              <Text className="text-white text-center">Seleccionar Audio</Text>
            </TouchableOpacity>

            <View className="mb-4">
              <Text className="text-primary-300 text-sm mb-1">Colaborador (opcional)</Text>
              <TouchableOpacity 
                onPress={() => setIsCollaboratorModalVisible(true)}
                className="bg-primary-700 p-3 rounded-lg flex-row justify-between items-center"
              >
                <Text className="text-white">
                  {selectedCollaborator ? selectedCollaborator.username : "Seleccionar colaborador"}
                </Text>
                {selectedCollaborator && (
                  <TouchableOpacity 
                    onPress={() => setSelectedCollaborator(null)}
                    className="ml-2"
                  >
                    <Ionicons name="close-circle" size={20} color="white" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      <GenreSelectionModal
        isVisible={isGenreModalVisible}
        onClose={() => setIsGenreModalVisible(false)}
        selectedGenre={genre}
        onSelectGenre={(selectedGenre) => {
          setGenre(selectedGenre);
          setIsGenreModalVisible(false);
        }}
      />

      {currentUserId && (
        <CollaboratorSelectionModal
          isVisible={isCollaboratorModalVisible}
          onClose={() => setIsCollaboratorModalVisible(false)}
          onSelect={handleCollaboratorSelect}
          currentUserId={currentUserId}
        />
      )}
    </Modal>
  );
}
