import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";

interface UploadVideoModalProps {
  isVisible: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export default function UploadVideoModal({
  isVisible,
  onClose,
  onUploadSuccess,
}: UploadVideoModalProps) {
  const [title, setTitle] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setVideoFile(asset.uri);
        setVideoFileName(asset.uri.split("/").pop() || null);
      }
    } catch (error) {
      console.error("Error picking video:", error);
      Alert.alert("Error", "No se pudo seleccionar el video");
    }
  };

  const uploadVideo = async () => {
    if (!title || !videoFile || !videoFileName || !descripcion) {
      Alert.alert("Error", "Por favor, completa todos los campos");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No se encontró el usuario");

      const fileExt = videoFileName.split(".").pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(filePath, {
          uri: videoFile ,
          type: "video/mp4",
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("videos").getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("video").insert({
        usuario_id: user.id,
        titulo: title,
        url: publicUrl,
        descripcion: descripcion,
      });

      if (insertError) throw insertError;

      Alert.alert("Éxito", "Tu video ha sido subido");
      onUploadSuccess();
      onClose();
    } catch (error) {
      console.error("Error uploading video:", error);
      Alert.alert("Error", "No se pudo subir el video");
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
        <View className="bg-white p-5 rounded-lg w-5/6">
          <Text className="text-xl font-JakartaBold text-primary-700 mb-4">Subir Video</Text>

          <TextInput
            className="border border-general-300 rounded-md p-2 mb-2"
            placeholder="Título del video"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            className="border border-general-300 rounded-md p-2 mb-2"
            placeholder="Descripción del video"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
          />

          <TouchableOpacity
            onPress={pickVideo}
            className="bg-primary-500 p-2 rounded-md mb-2"
          >
            <Text className="text-white text-center font-JakartaBold">Seleccionar Video</Text>
          </TouchableOpacity>

          {videoFileName && (
            <Text className="mb-2 text-general-200">Video seleccionado: {videoFileName}</Text>
          )}

          <TouchableOpacity
            onPress={uploadVideo}
            className="bg-secondary-500 p-2 rounded-md mb-2"
          >
            <Text className="text-white text-center font-JakartaBold">Subir Video</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            className="bg-danger-500 p-2 rounded-md"
          >
            <Text className="text-white text-center font-JakartaBold">Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
