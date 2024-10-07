import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { styled } from 'nativewind';
import { supabase } from "@/lib/supabase";
import * as ImagePicker from 'expo-image-picker';
import { icons } from "@/constants";
import DropDownPicker from 'react-native-dropdown-picker';

const StyledView = styled(View)
const StyledText = styled(Text)
const StyledTextInput = styled(TextInput)
const StyledTouchableOpacity = styled(TouchableOpacity)
const StyledImage = styled(Image)
const StyledScrollView = styled(ScrollView)

interface Perfil {
  username: string;
  full_name: string;
  foto_perfil: string | null;
  sexo: string;
  edad: number;
  ubicacion: string;
  biografia: string;
  generos: string[];
  habilidades: string[];
}

const EditarPerfil = () => {
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [generoOpen, setGeneroOpen] = useState(false);
  const [generoItems, setGeneroItems] = useState([
    { label: 'Masculino', value: 'masculino' },
    { label: 'Femenino', value: 'femenino' },
    { label: 'Otro', value: 'otro' }
  ]);

  useEffect(() => {
    fetchPerfil();
  }, []);

  const fetchPerfil = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase
        .from('perfil')
        .select(`
          username,
          foto_perfil,
          sexo,
          edad,
          ubicacion,
          biografia,
          perfil_genero (genero),
          perfil_habilidad (habilidad)
        `)
        .eq('usuario_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setPerfil({
          ...data,
          full_name: user.user_metadata?.full_name || '',
          generos: data.perfil_genero.map(g => g.genero),
          habilidades: data.perfil_habilidad.map(h => h.habilidad)
        });
        setFotoPerfil(data.foto_perfil);
      }
    } catch (error) {
      console.error("Error al obtener el perfil:", error);
      Alert.alert("Error", "No se pudo cargar el perfil del usuario");
    }
  };

  const cambiarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Se necesita permiso para acceder a la galería');
        return;
      }

      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        setFotoPerfil(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al cambiar la foto de perfil:', error);
      Alert.alert('Error', 'No se pudo cambiar la foto de perfil');
    }
  };

  const actualizarPerfil = async () => {
    if (!perfil) return;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No se encontró un usuario autenticado');

      const { error: updateError } = await supabase
        .from('perfil')
        .update({
          foto_perfil: fotoPerfil,
          sexo: perfil.sexo,
          edad: perfil.edad,
          ubicacion: perfil.ubicacion,
          biografia: perfil.biografia,
        })
        .eq('usuario_id', user.id);

      if (updateError) throw updateError;

      // Actualizar géneros y habilidades
      await supabase.from('perfil_genero').delete().eq('perfil_id', user.id);
      await supabase.from('perfil_habilidad').delete().eq('perfil_id', user.id);

      for (const genero of perfil.generos) {
        await supabase.from('perfil_genero').insert({ perfil_id: user.id, genero });
      }

      for (const habilidad of perfil.habilidades) {
        await supabase.from('perfil_habilidad').insert({ perfil_id: user.id, habilidad });
      }

      Alert.alert("Éxito", "Perfil actualizado correctamente");
      router.back();
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      Alert.alert("Error", "No se pudo actualizar el perfil");
    }
  };

  if (!perfil) {
    return <View><Text>Cargando...</Text></View>;
  }

  return (
    <StyledScrollView className="flex-1 bg-white">
      <StyledView className="p-6">
        <Stack.Screen options={{ title: 'Editar Perfil', headerShown: false }} />
        
        <StyledTouchableOpacity 
          className="absolute top-2 left-2 z-10"
          onPress={() => router.back()}
        >
          <Image source={icons.back} className="w-6 h-6" />
        </StyledTouchableOpacity>

        <StyledText className="text-2xl font-bold mb-6 text-center">Editar Perfil</StyledText>
        
        <StyledView className="items-center mb-6">
          <StyledImage
            source={{ uri: fotoPerfil || 'https://via.placeholder.com/150' }}
            className="w-24 h-24 rounded-full mb-2"
          />
          <StyledTouchableOpacity onPress={cambiarFoto}>
            <StyledText className="text-blue-500">Cambiar foto</StyledText>
          </StyledTouchableOpacity>
        </StyledView>
        
        <StyledView className="mb-4">
          <StyledText className="text-lg font-bold mb-2">Nombre de usuario:</StyledText>
          <StyledTextInput
            className="border border-gray-300 p-2 rounded-md"
            value={perfil.username}
            onChangeText={(text) => setPerfil({...perfil, username: text})}
          />
        </StyledView>

        <StyledView className="mb-4">
          <StyledText className="text-lg font-bold mb-2">Nombre completo:</StyledText>
          <StyledTextInput
            className="border border-gray-300 p-2 rounded-md"
            value={perfil.full_name}
            onChangeText={(text) => setPerfil({...perfil, full_name: text})}
          />
        </StyledView>

        <StyledView className="mb-4">
          <StyledText className="text-lg font-bold mb-2">Género:</StyledText>
          <DropDownPicker
            open={generoOpen}
            value={perfil.sexo}
            items={generoItems}
            setOpen={setGeneroOpen}
            setValue={(value) => setPerfil({...perfil, sexo: value() as string})}
            setItems={setGeneroItems}
          />
        </StyledView>

        <StyledView className="mb-4">
          <StyledText className="text-lg font-bold mb-2">Edad:</StyledText>
          <StyledTextInput
            className="border border-gray-300 p-2 rounded-md"
            value={perfil.edad.toString()}
            onChangeText={(text) => setPerfil({...perfil, edad: parseInt(text) || 0})}
            keyboardType="numeric"
          />
        </StyledView>

        <StyledView className="mb-4">
          <StyledText className="text-lg font-bold mb-2">Ubicación:</StyledText>
          <StyledTextInput
            className="border border-gray-300 p-2 rounded-md"
            value={perfil.ubicacion}
            onChangeText={(text) => setPerfil({...perfil, ubicacion: text})}
          />
        </StyledView>

        <StyledView className="mb-4">
          <StyledText className="text-lg font-bold mb-2">Biografía:</StyledText>
          <StyledTextInput
            className="border border-gray-300 p-2 rounded-md"
            value={perfil.biografia}
            onChangeText={(text) => setPerfil({...perfil, biografia: text})}
            multiline
            numberOfLines={4}
          />
        </StyledView>

        {/* Aquí puedes agregar campos para editar géneros y habilidades */}

        <StyledTouchableOpacity 
          className="bg-blue-500 p-4 rounded-md items-center mt-6"
          onPress={actualizarPerfil}
        >
          <StyledText className="text-white font-bold text-lg">Guardar Cambios</StyledText>
        </StyledTouchableOpacity>
      </StyledView>
    </StyledScrollView>
  );
};

export default EditarPerfil;