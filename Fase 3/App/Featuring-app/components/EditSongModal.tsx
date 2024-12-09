import React, { useState } from "react";
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
import { Cancion } from "@/types/db_types";
import GenreSelectionModal from './GenreSelectionModal';

interface EditSongModalProps {
  isVisible: boolean;
  onClose: () => void;
  onEditSuccess: () => void;
  cancion: Cancion;
}

export default function EditSongModal({
  isVisible,
  onClose,
  onEditSuccess,
  cancion,
}: EditSongModalProps) {
  const [title, setTitle] = useState(cancion.titulo);
  const [contenido, setContenido] = useState(cancion.contenido);
  const [genre, setGenre] = useState(cancion.genero);
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(cancion.caratula);
  const [coverImageName, setCoverImageName] = useState<string | null>(null);
  const [isGenreModalVisible, setIsGenreModalVisible] = useState(false);

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
          setAudioFileName(fileName);
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
          setCoverImageName(fileName);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen de portada");
    }
  };

  const updateSong = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No se encontró el usuario");

      let audioPublicUrl = cancion.archivo_audio;
      let imagePublicUrl = cancion.caratula;

      // Si se seleccionó un nuevo archivo de audio, súbelo
      if (audioFile && audioFileName) {
        const sanitizedAudioFileName = sanitizeFileName(audioFileName);
        const existingAudioFileName = cancion.archivo_audio?.split("/").pop();

        if (existingAudioFileName === sanitizedAudioFileName) {
          // Reemplazar el archivo existente
          const { error: audioUploadError } = await supabase.storage
            .from("canciones")
            .update(
              `${user.id}/${sanitizedAudioFileName}`,
              {
                uri: audioFile,
                name: sanitizedAudioFileName,
                type: "audio/*",
              },
              {
                upsert: true,
              }
            );
          if (audioUploadError) throw audioUploadError;
        } else {
          // Subir como un nuevo archivo
          const { error: audioUploadError } = await supabase.storage
            .from("canciones")
            .upload(`${user.id}/${sanitizedAudioFileName}`, {
              uri: audioFile,
              name: sanitizedAudioFileName,
              type: "audio/*",
            });
          if (audioUploadError) throw audioUploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("canciones")
          .getPublicUrl(`${user.id}/${sanitizedAudioFileName}`);
        audioPublicUrl = publicUrl;
      }

      // Si se seleccionó una nueva imagen de portada, súbela
      if (coverImage && coverImageName) {
        const sanitizedCoverImageName = sanitizeFileName(coverImageName);
        const existingCoverImageName = cancion.caratula?.split("/").pop();

        if (existingCoverImageName === sanitizedCoverImageName) {
          // Reemplazar el archivo existente
          const { error: imageUploadError } = await supabase.storage
            .from("caratulas")
            .update(
              `${user.id}/${sanitizedCoverImageName}`,
              {
                uri: coverImage,
                name: sanitizedCoverImageName,
                type: "image/*",
              },
              {
                upsert: true,
              }
            );
          if (imageUploadError) throw imageUploadError;
        } else {
          // Subir como un nuevo archivo
          const { error: imageUploadError } = await supabase.storage
            .from("caratulas")
            .upload(`${user.id}/${sanitizedCoverImageName}`, {
              uri: coverImage,
              name: sanitizedCoverImageName,
              type: "image/*",
            });
          if (imageUploadError) throw imageUploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("caratulas")
          .getPublicUrl(`${user.id}/${sanitizedCoverImageName}`);
        imagePublicUrl = publicUrl;
      }

      // Actualizar la entrada en la tabla cancion
      const { data: songData, error: songError } = await supabase
        .from("cancion")
        .update({
          titulo: title,
          archivo_audio: audioPublicUrl,
          caratula: imagePublicUrl,
          contenido: contenido,
          genero: genre,
        })
        .eq("id", cancion.id)
        .select()
        .single();

      if (songError) throw songError;

      Alert.alert("Éxito", "Tu canción ha sido actualizada");
      onEditSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating song:", error);
      Alert.alert("Error", "No se pudo actualizar la canción");
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
              <TouchableOpacity onPress={updateSong}>
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
              placeholder="Título de la canción"
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
              <Text className="text-white text-center">Cambiar Audio</Text>
            </TouchableOpacity>
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
    </Modal>
  );
}
