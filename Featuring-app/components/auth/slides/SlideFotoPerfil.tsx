import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PreguntasState, PreguntasAction } from '@/types/preguntas';
import { commonStyles } from '@/styles/commonStyles';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

interface SlideFotoPerfilProps {
  state: PreguntasState;
  dispatch: React.Dispatch<PreguntasAction>;
  onValidationComplete: (isValid: boolean) => void;
}

export function SlideFotoPerfil({ state, dispatch, onValidationComplete }: SlideFotoPerfilProps) {
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);

  useEffect(() => {
    onValidationComplete(true); // Siempre es válido, ya que la foto de perfil es opcional
  }, []);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const uri = result.assets[0].uri;
        setLocalImageUri(uri);

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("No se encontró el usuario");

        const fileName = `${Date.now()}.jpg`;
        const filePath = `${user.id}/${fileName}`;

        const { error } = await supabase.storage
          .from('fotoperfil')
          .upload(filePath, {
            uri,
            name: fileName,
            type: 'image/jpeg',
          });

        if (error) {
          console.error('Error uploading image:', error);
          Alert.alert("Error", "No se pudo subir la imagen de perfil");
          return;
        }

        // Construir URL pública manualmente
        const publicUrl = `https://jvtgpbgnxevfazwzbhtr.supabase.co/storage/v1/object/public/fotoperfil/${filePath}`;
        console.log('Public URL:', publicUrl);

        await updateProfileImage(user.id, publicUrl);
        dispatch({ type: 'SET_PROFILE_IMAGE', payload: publicUrl });
      }
    } catch (error) {
      console.error('Error in handlePickImage:', error);
      Alert.alert("Error", "No se pudo seleccionar la imagen de perfil");
    }
  };

  const updateProfileImage = async (userId: string, imageUrl: string) => {
    console.log('Updating profile image with URL:', imageUrl);
    const { error } = await supabase
      .from('perfil')
      .update({ foto_perfil: imageUrl })
      .eq('id', userId);

    if (error) {
      console.error('Error updating profile image:', error);
      Alert.alert("Error", "No se pudo actualizar la imagen de perfil en la base de datos");
    } else {
      console.log('Profile image updated successfully');
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
        {state.profileImage ? (
          <Image
            source={{ uri: state.profileImage }}
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
