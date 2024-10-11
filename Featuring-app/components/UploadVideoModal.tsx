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
        setVideoFileName(asset.uri.split("/").pop());
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
          uri: videoFile,
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
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            padding: 20,
            borderRadius: 10,
            width: "80%",
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
            Subir Video
          </Text>

          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "gray",
              borderRadius: 5,
              padding: 10,
              marginBottom: 10,
            }}
            placeholder="Título del video"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={{
              borderWidth: 1,
              borderColor: "gray",
              borderRadius: 5,
              padding: 10,
              marginBottom: 10,
            }}
            placeholder="Descripción del video"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
          />

          <TouchableOpacity
            onPress={pickVideo}
            style={{
              backgroundColor: "blue",
              padding: 10,
              borderRadius: 5,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>
              Seleccionar Video
            </Text>
          </TouchableOpacity>

          {videoFileName && (
            <Text style={{ marginBottom: 10 }}>
              Video seleccionado: {videoFileName}
            </Text>
          )}

          <TouchableOpacity
            onPress={uploadVideo}
            style={{
              backgroundColor: "green",
              padding: 10,
              borderRadius: 5,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>
              Subir Video
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            style={{ backgroundColor: "red", padding: 10, borderRadius: 5 }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
