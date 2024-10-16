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
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { supabase } from "@/lib/supabase";
import { generosMusicalesCompletos } from '@/constants/musicData';
import { Cancion } from "@/types/db_types";

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
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
        <View className="bg-white p-5 rounded-lg w-5/6 max-h-5/6">
          <ScrollView>
            <Text className="text-xl font-bold mb-4">Editar Canción</Text>

            <TextInput
              className="border border-gray-300 rounded-md p-2 mb-2"
              placeholder="Título de la canción"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              className="border border-gray-300 rounded-md p-2 mb-2"
              placeholder="Descripción de la canción"
              value={contenido}
              onChangeText={setContenido}
              multiline
            />

            <Text className="mb-2">Género musical:</Text>
            <Picker
              selectedValue={genre}
              onValueChange={(itemValue) => setGenre(itemValue)}
              className="border border-gray-300 rounded-md mb-4"
            >
              {generosMusicalesCompletos.map((genero) => (
                <Picker.Item key={genero} label={genero} value={genero} />
              ))}
            </Picker>

            <TouchableOpacity
              onPress={pickAudio}
              className="bg-blue-500 p-2 rounded-md mb-2"
            >
              <Text className="text-white text-center">Cambiar Audio</Text>
            </TouchableOpacity>
            {audioFileName && (
              <Text className="mb-2">
                Nuevo audio seleccionado: {audioFileName}
              </Text>
            )}

            <TouchableOpacity
              onPress={pickImage}
              className="bg-green-500 p-2 rounded-md mb-2"
            >
              <Text className="text-white text-center">Cambiar Portada</Text>
            </TouchableOpacity>
            {coverImage && (
              <View>
                <Image
                  source={{ uri: coverImage }}
                  style={{ width: 100, height: 100, marginBottom: 10 }}
                />
                <Text className="mb-2">
                  Nueva imagen seleccionada: {coverImageName}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={updateSong}
              className="bg-purple-500 p-2 rounded-md mb-2"
            >
              <Text className="text-white text-center">Actualizar Canción</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              className="bg-red-500 p-2 rounded-md"
            >
              <Text className="text-white text-center">Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
