import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PreguntasState, PreguntasAction } from '@/types/preguntas';
import * as ImagePicker from 'expo-image-picker';

interface SlideFotoPerfilProps {
  state: PreguntasState;
  dispatch: React.Dispatch<PreguntasAction>;
  onValidationComplete: (isValid: boolean) => void;
}

export function SlideFotoPerfil({ state, dispatch, onValidationComplete }: SlideFotoPerfilProps) {
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    onValidationComplete(true); // Siempre es válido, ya que la foto de perfil es opcional
  }, []);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setLocalImageUri(uri);
        dispatch({ type: 'SET_PROFILE_IMAGE', payload: uri });
      }
    } catch (error) {
      console.error('Error in handlePickImage:', error);
      Alert.alert("Error", "No se pudo seleccionar la imagen de perfil");
    }
  };

  const imageSize = Math.min(width * 0.6, height * 0.3);

  return (
    <View className="flex-1 justify-center items-center px-4 py-6 sm:py-8 md:py-10 mb-10">
      <Text className="text-xl sm:text-2xl md:text-3xl text-primary-700 font-JakartaBold mb-6 sm:mb-8 md:mb-10 text-center">
        Selecciona tu foto de perfil
      </Text>
      <TouchableOpacity
        onPress={handlePickImage}
        className="mb-6 sm:mb-8 md:mb-10"
      >
        {localImageUri ? (
          <Image
            source={{ uri: localImageUri }}
            style={{ width: imageSize, height: imageSize, borderRadius: imageSize / 2 }}
          />
        ) : (
          <View 
            style={{ 
              width: imageSize, 
              height: imageSize, 
              borderRadius: imageSize / 2 
            }} 
            className="bg-primary-200 flex items-center justify-center"
          >
            <Ionicons name="camera" size={imageSize * 0.3} color="#6D29D2" />
          </View>
        )}
      </TouchableOpacity>
      <Text className="text-base sm:text-lg md:text-xl text-primary-600 font-JakartaMedium text-center">
        Toca para {localImageUri ? 'cambiar' : 'seleccionar'} tu foto
      </Text>
      {localImageUri && (
        <TouchableOpacity
          onPress={() => {
            setLocalImageUri(null);
            dispatch({ type: 'SET_PROFILE_IMAGE', payload: null });
          }}
          className="mt-4 bg-danger-500 px-4 py-2 rounded-full"
        >
          <Text className="text-white font-JakartaMedium">Eliminar foto</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
