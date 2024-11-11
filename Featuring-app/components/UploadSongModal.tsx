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
  StyleSheet,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { supabase } from "@/lib/supabase";
import { Ionicons } from '@expo/vector-icons';
import GenreSelectionModal from './GenreSelectionModal';
import CollaboratorSelectionModal from './CollaboratorSelectionModal';
import { validateContent } from '@/utils/contentFilter';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import Constants from 'expo-constants';

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

  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
  const [isUploading, setIsUploading] = useState(false);

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
        const asset = result.assets[0];
        
        // Comprimir la imagen antes de guardarla
        const manipResult = await manipulateAsync(
          asset.uri,
          [{ resize: { width: 1080, height: 1080 } }],
          { compress: 0.8, format: SaveFormat.JPEG }
        );

        const fileName = `cover_${Date.now()}.jpg`;
        setCoverImage(manipResult.uri);
        setCoverImageName(fileName);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen de portada");
    }
  };

  const uploadSong = async () => {
    try {
      setIsUploading(true);

      // Validar título
      const titleValidation = validateContent(title, 'titulo');
      if (!titleValidation.isValid) {
        Alert.alert("Error", titleValidation.message);
        return;
      }

      // Validar descripción
      const contentValidation = validateContent(contenido, 'descripcion');
      if (!contentValidation.isValid) {
        Alert.alert("Error", contentValidation.message);
        return;
      }

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

      // Subir archivo de audio usando fetch
      const audioFormData = new FormData();
      audioFormData.append('file', {
        uri: audioFile,
        name: audioFileName,
        type: 'audio/mpeg'
      } as any);

      const audioResponse = await fetch(
        `${supabaseUrl}/storage/v1/object/canciones/${user.id}/${audioFileName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: audioFormData
        }
      );

      if (!audioResponse.ok) throw new Error('Error al subir el audio');

      // Subir imagen de portada usando fetch
      const imageFormData = new FormData();
      imageFormData.append('file', {
        uri: coverImage,
        name: coverImageName,
        type: 'image/jpeg'
      } as any);

      const imageResponse = await fetch(
        `${supabaseUrl}/storage/v1/object/caratulas/${user.id}/${coverImageName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: imageFormData
        }
      );

      if (!imageResponse.ok) throw new Error('Error al subir la imagen');

      // Obtener URLs públicas
      const { data: { publicUrl: audioPublicUrl } } = supabase.storage
        .from("canciones")
        .getPublicUrl(`${user.id}/${audioFileName}`);

      const { data: { publicUrl: imagePublicUrl } } = supabase.storage
        .from("caratulas")
        .getPublicUrl(`${user.id}/${coverImageName}`);

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

      // Manejar colaboración si existe
      if (selectedCollaborator) {
        await handleCollaboration(songData.id, user.id);
      }

      Alert.alert("Éxito", "Tu canción ha sido subida");
      onUploadSuccess();
      onClose();
    } catch (error) {
      console.error("Error uploading song:", error);
      Alert.alert("Error", "No se pudo subir la canción");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCollaboration = async (songId: number, userId: string) => {
    if (!selectedCollaborator) return;

    try {
      const { error: collaborationError } = await supabase
        .from("colaboracion")
        .insert({
          cancion_id: songId,
          usuario_id: userId,
          usuario_id2: selectedCollaborator.usuario_id,
          estado: 'pendiente'
        });

      if (collaborationError) throw collaborationError;

      await supabase
        .from("notificacion")
        .insert({
          usuario_id: selectedCollaborator.usuario_id,
          usuario_origen_id: userId,
          tipo_notificacion: 'solicitud_colaboracion',
          contenido_id: songId,
          mensaje: `${title} - Solicitud de colaboración pendiente`,
          leido: false
        });
    } catch (error) {
      console.error("Error creating collaboration:", error);
      // No lanzamos el error para que no interrumpa la subida de la canción
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
              <TouchableOpacity
                onPress={uploadSong}
                disabled={isUploading}
                style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
              >
                <Text style={styles.uploadButtonText}>
                  {isUploading ? "Subiendo..." : "Guardar"}
                </Text>
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

const styles = StyleSheet.create({
  uploadButton: {
    backgroundColor: '#6D29D2',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  uploadButtonDisabled: {
    backgroundColor: '#9B9B9B',
  },
  uploadButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
