import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { FontAwesome } from "@expo/vector-icons";

interface Props {
  onSubmit: (content: string, imageUri: string | null) => void;
}

export default function AddPostForm({ onSubmit }: Props) {
  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Función para abrir el selector de imágenes
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets) {
      setImageUri(result.assets[0].uri);
    }
  };

  return (
    <View className="p-4 bg-white shadow-md rounded-lg">
      {/* Cuadro de texto estilizado */}
      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="Escribe algo..."
        multiline
        className="border border-gray-300 p-4 rounded-lg mb-4 text-base"
        style={{ height: 100 }}
      />

      {/* Mostrar imagen seleccionada */}
      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          className="w-full h-40 rounded-lg mb-4"
        />
      )}

      {/* Botón para seleccionar imagen */}
      <TouchableOpacity
        onPress={pickImage}
        className="flex-row items-center bg-gray-200 py-2 px-4 rounded-lg mb-4"
      >
        <FontAwesome name="image" size={20} color="gray" />
        <Text className="ml-2 text-gray-600">Añadir imagen</Text>
      </TouchableOpacity>

      {/* Botón para publicar */}
      <TouchableOpacity
        onPress={() => {
          onSubmit(content, imageUri);
          setContent("");
          setImageUri(null);
        }}
        className="bg-blue-500 py-3 rounded-lg"
      >
        <Text className="text-center text-white text-lg font-semibold">
          Publicar
        </Text>
      </TouchableOpacity>
    </View>
  );
}
