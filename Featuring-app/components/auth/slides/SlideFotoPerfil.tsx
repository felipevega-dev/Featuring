import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PreguntasState, PreguntasAction } from '@/types/preguntas';
import { useImagePicker } from '@/hooks/useImagePicker';
import { commonStyles } from '@/styles/commonStyles';

interface SlideFotoPerfilProps {
  state: PreguntasState;
  dispatch: React.Dispatch<PreguntasAction>;
}

export function SlideFotoPerfil({ state, dispatch }: SlideFotoPerfilProps) {
  const { profileImage } = state;
  const { pickImage } = useImagePicker();

  const handlePickImage = async () => {
    const image = await pickImage();
    if (image) {
      dispatch({ type: 'SET_PROFILE_IMAGE', payload: image });
    }
  };

  return (
    <View className="flex-1 justify-center items-center mb-32 pb-10 p-4">
      <Text className={commonStyles.slideTitle}>
        Selecciona tu foto de perfil
      </Text>
      <TouchableOpacity
        onPress={handlePickImage}
        className="mt-4 rounded-full border-4 border-primary-500 p-2"
      >
        {profileImage ? (
          <Image
            source={{ uri: profileImage }}
            style={{ width: 200, height: 200, borderRadius: 100 }}
          />
        ) : (
          <View className="w-[200px] h-[200px] bg-primary-200 rounded-full flex items-center justify-center">
            <Text className="text-primary-600 font-JakartaMedium">
              Toca para seleccionar
            </Text>
            <Ionicons name="camera" size={50} color="#6D29D2" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}
