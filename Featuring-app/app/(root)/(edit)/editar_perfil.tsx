import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert, Modal, Linking, LogBox } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { styled } from 'nativewind';
import { supabase } from "@/lib/supabase";
import * as ImagePicker from 'expo-image-picker';
import { icons } from "@/constants";
import DropDownPicker from 'react-native-dropdown-picker';
import { FontAwesome } from '@expo/vector-icons';

// Ignorar la advertencia específica
LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

const StyledView = styled(View)
const StyledText = styled(Text)
const StyledTextInput = styled(TextInput)
const StyledTouchableOpacity = styled(TouchableOpacity)
const StyledImage = styled(Image)
const StyledScrollView = styled(ScrollView)

interface Perfil {
  usuario_id: string; // Cambiado de 'id' a 'usuario_id'
  username: string;
  full_name: string;
  foto_perfil: string | null;
  sexo: string;
  edad: number;
  ubicacion: string;
  biografia: string;
  generos: string[];
  habilidades: string[];
  mensaje: string; // Añadimos el campo mensaje
  redes_sociales: { nombre: string; url: string }[];
}

const EditarPerfil = () => {
  const router = useRouter();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<'generos' | 'habilidades' | 'redes_sociales'>('generos');

  const [habilidadesMusicales, setHabilidadesMusicales] = useState([
    "Canto", "Guitarra", "Piano", "Batería", "Bajo", "Violín", "Saxofón", "Trompeta", 
    "Flauta", "Ukulele", "DJ", "Producción", "Composición", "Arreglos", "Percusión", 
    "Armónica", "Contrabajo", "Clarinete", "Oboe", "Cello", "Trombón", "Teclado", 
    "Sintetizador", "Banjo", "Mandolina", "Beatboxing", "Técnico de sonido", "Mezcla", 
    "Masterización", "Improvisación", "Solfeo", "Dirección coral", "Dirección orquestal", 
    "Lectura de partituras", "Orquestación", "Grabación", "Edición de audio"
  ]);

  const [generosMusicales, setGenerosMusicales] = useState([
    "Pop", "Rock", "Hip Hop", "R&B", "Jazz", "Clásica", "Electrónica", "Reggaeton", 
    "Country", "Folk", "Blues", "Metal", "Punk", "Indie", "Salsa", "Reggae", 
    "Trap", "House", "Techno", "Dubstep", "Gospel", "Soul", "Funk", "Bossa Nova", 
    "Flamenco", "Cumbia", "Bachata", "Merengue", "Tango", "Grunge", "Progressive Rock", 
    "Disco", "New Wave", "K-Pop", "J-Pop", "Latin Jazz", "Ska", "Afrobeat", 
    "World Music", "Chillout", "Lo-fi"
  ]);

  const [nuevaRedSocial, setNuevaRedSocial] = useState({ nombre: '', url: '' });
  const [redesSociales] = useState([
    "SoundCloud", "Instagram", "Facebook", "Twitter", "Spotify"
  ]);
  const [modalRedSocialVisible, setModalRedSocialVisible] = useState(false);

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
          usuario_id,
          username,
          foto_perfil,
          sexo,
          edad,
          ubicacion,
          biografia,
          perfil_genero (genero),
          perfil_habilidad (habilidad),
          mensaje,
          red_social (nombre, url)
        `)
        .eq('usuario_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setPerfil({
          ...data,
          full_name: user.user_metadata?.full_name || '',
          generos: data.perfil_genero?.map(g => g.genero) || [],
          habilidades: data.perfil_habilidad?.map(h => h.habilidad) || [],
          redes_sociales: data.red_social?.map(r => ({ nombre: r.nombre, url: r.url })) || [],
          mensaje: data.mensaje || ''
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

      // Actualizar full_name en auth.users
      const { error: updateUserError } = await supabase.auth.updateUser({
        data: { full_name: perfil.full_name }
      });

      if (updateUserError) throw updateUserError;

      // Actualizar el resto de la información en la tabla perfil
      const { error: updateError } = await supabase
        .from('perfil')
        .update({
          username: perfil.username,
          foto_perfil: fotoPerfil,
          sexo: perfil.sexo,
          edad: perfil.edad,
          ubicacion: perfil.ubicacion,
          biografia: perfil.biografia,
          mensaje: perfil.mensaje
        })
        .eq('usuario_id', user.id);

      if (updateError) throw updateError;

      // Actualizar géneros
      await supabase.from('perfil_genero').delete().eq('perfil_id', user.id);
      for (const genero of perfil.generos) {
        await supabase.from('perfil_genero').insert({ perfil_id: user.id, genero });
      }

      // Actualizar habilidades
      await supabase.from('perfil_habilidad').delete().eq('perfil_id', user.id);
      for (const habilidad of perfil.habilidades) {
        await supabase.from('perfil_habilidad').insert({ perfil_id: user.id, habilidad });
      }

      // Actualizar redes sociales
      await supabase.from('red_social').delete().eq('perfil_id', user.id);
      for (const red of perfil.redes_sociales) {
        await supabase.from('red_social').insert({ 
          perfil_id: user.id, 
          nombre: red.nombre, 
          url: red.url 
        });
      }

      Alert.alert("Éxito", "Perfil actualizado correctamente");
      if (router.canGoBack()) {
        router.back();
        // Emitir un evento para actualizar el perfil en la página anterior
        router.setParams({ refreshProfile: Date.now().toString() });
      }
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      Alert.alert("Error", "No se pudo actualizar el perfil");
    }
  };

  const toggleItem = (item: string, type: 'generos' | 'habilidades' | 'redes_sociales') => {
    if (!perfil) return;

    setPerfil(prevPerfil => {
      if (!prevPerfil) return null;

      const currentItems = prevPerfil[type];
      let updatedItems;

      if (currentItems.includes(item)) {
        updatedItems = currentItems.filter(i => i !== item);
      } else if (currentItems.length < 5) {
        updatedItems = [...currentItems, item];
      } else {
        Alert.alert("Límite alcanzado", `Solo puedes seleccionar un máximo de 5 ${type}.`);
        return prevPerfil;
      }

      return {
        ...prevPerfil,
        [type]: updatedItems
      };
    });
  };

  const agregarRedSocial = (nombreRed: string) => {
    if (!perfil) return;

    if (perfil.redes_sociales.length >= 3) {
      Alert.alert("Límite alcanzado", "Solo puedes agregar un máximo de 3 redes sociales.");
      return;
    }

    setNuevaRedSocial(prev => ({ ...prev, nombre: nombreRed }));
    setModalRedSocialVisible(false);
  };

  const validarURL = (nombre: string, url: string): boolean => {
    const patrones = {
      'SoundCloud': /^https?:\/\/(www\.)?soundcloud\.com\/.+/i,
      'Instagram': /^https?:\/\/(www\.)?instagram\.com\/.+/i,
      'Facebook': /^https?:\/\/(www\.)?facebook\.com\/.+/i,
      'Twitter': /^https?:\/\/(www\.)?twitter\.com\/.+/i,
      'Spotify': /^https?:\/\/open\.spotify\.com\/.+/i,
    };

    const patron = patrones[nombre as keyof typeof patrones];
    return patron ? patron.test(url) : false;
  };

  const guardarRedSocial = () => {
    if (!perfil) return;

    if (nuevaRedSocial.nombre.trim() === '' || nuevaRedSocial.url.trim() === '') {
      Alert.alert("Error", "Por favor, ingresa tanto el nombre como la URL de la red social.");
      return;
    }

    if (!validarURL(nuevaRedSocial.nombre, nuevaRedSocial.url)) {
      Alert.alert("Error", `La URL ingresada no es válida para ${nuevaRedSocial.nombre}.`);
      return;
    }

    setPerfil(prevPerfil => ({
      ...prevPerfil,
      redes_sociales: [...prevPerfil.redes_sociales, nuevaRedSocial]
    }));
    setNuevaRedSocial({ nombre: '', url: '' });
  };

  const eliminarRedSocial = (index: number) => {
    if (!perfil) return;

    Alert.alert(
      "Eliminar Red Social",
      "¿Estás seguro de que quieres eliminar esta red social?",
      [
        {
          text: "Cancelar",
          style: "cancel"
        },
        { 
          text: "Eliminar", 
          onPress: () => {
            setPerfil(prevPerfil => ({
              ...prevPerfil,
              redes_sociales: prevPerfil.redes_sociales.filter((_, i) => i !== index)
            }));
          },
          style: "destructive"
        }
      ]
    );
  };

  const getRedSocialIcon = (nombre: string) => {
    switch (nombre.toLowerCase()) {
      case 'soundcloud':
        return 'soundcloud';
      case 'instagram':
        return 'instagram';
      case 'facebook':
        return 'facebook';
      case 'twitter':
        return 'twitter';
      case 'spotify':
        return 'spotify';
      default:
        return ''; // Retornamos una cadena vacía en lugar de 'link'
    }
  };

  const handleRedSocialPress = (url: string) => {
    Linking.openURL(url).catch((err) => console.error('Error al abrir el enlace:', err));
  };

  const handleRedSocialLongPress = (index: number) => {
    eliminarRedSocial(index);
  };

  const renderSelectedItems = (items: string[], type: 'generos' | 'habilidades') => (
    <View className="flex-row flex-wrap mt-2">
      {items.map((item, index) => (
        <View key={index} className={`m-1 p-2 rounded-full ${type === 'generos' ? 'bg-secondary-500' : 'bg-secondary-500'}`}>
          <Text className="text-white font-JakartaMedium">{item}</Text>
        </View>
      ))}
    </View>
  );

  const renderModalContent = () => {
    const items = modalContent === 'generos' ? generosMusicales : 
                  modalContent === 'habilidades' ? habilidadesMusicales : 
                  redesSociales;
    const selectedItems = modalContent === 'generos' ? perfil?.generos : 
                          modalContent === 'habilidades' ? perfil?.habilidades :
                          perfil?.redes_sociales;

    return (
      <View className="flex-1">
        <Text className="text-lg font-bold mb-2 text-primary-700">
          {selectedItems?.length || 0}/5 seleccionados
        </Text>
        <View className="flex-row flex-wrap justify-start">
          {items.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => toggleItem(item, modalContent)}
              className={`m-1 p-2 rounded-full ${
                selectedItems?.includes(item) 
                  ? "bg-primary-500" 
                  : "bg-general-300"
              }`}
            >
              <Text className={`text-sm ${
                selectedItems?.includes(item) ? "text-white" : "text-primary-700"
              }`}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Agregar esta función para manejar la selección de género
  const handleGeneroSelection = (selectedGenero: string) => {
    if (perfil) {
      setPerfil({...perfil, sexo: selectedGenero});
    }
  };

  if (!perfil) {
    return <View><Text>Cargando...</Text></View>;
  }

  return (
    <StyledScrollView className="flex-1 bg-white">
      <StyledView className="p-6 mt-4">
        <Stack.Screen options={{ title: 'Editar Perfil', headerShown: false }} />
    
        <StyledText className="text-2xl font-bold mb-3 text-center">Editar Perfil</StyledText>
        <StyledTouchableOpacity 
          className="absolute top-14 left-4 z-4"
          onPress={() => router.back()}
        >
          <Image source={icons.backArrow} className="w-8 h-8" style={{ tintColor: '#6D29D2' }} />
        </StyledTouchableOpacity>
        
        <StyledView className="items-center mb-2">
          <StyledImage
            source={{ uri: fotoPerfil || 'https://via.placeholder.com/150' }}
            className="w-24 h-24 rounded-full mb-3"
          />
          <StyledTouchableOpacity onPress={cambiarFoto}>
            <StyledText className="text-secondary-500">Cambiar foto</StyledText>
          </StyledTouchableOpacity>
        </StyledView>
        
        <StyledView className="mb-2">
          <StyledText className="text-lg font-bold mb-2 text-primary-700">Nombre de usuario:</StyledText>
          <StyledTextInput
            className="border border-gray-300 p-2 rounded-md"
            value={perfil.username}
            onChangeText={(text) => setPerfil({...perfil, username: text})}
          />
        </StyledView>

        <StyledView className="mb-2">
          <StyledText className="text-lg font-bold mb-2 text-primary-700">Nombre completo:</StyledText>
          <StyledTextInput
            className="border border-gray-300 p-2 rounded-md"
            value={perfil.full_name}
            onChangeText={(text) => setPerfil({...perfil, full_name: text})}
          />
        </StyledView>

        <StyledView className="mb-2">
          <StyledText className="text-lg font-bold mb-2 text-primary-700">Mensaje del perfil:</StyledText>
          <StyledTextInput
            className="border border-gray-300 p-2 rounded-md"
            value={perfil.mensaje || ''} // Aseguramos que siempre haya un valor
            onChangeText={(text) => setPerfil({...perfil, mensaje: text.slice(0, 100)})}
            maxLength={100}
            multiline
          />
          <StyledText className="text-sm text-gray-500 mt-1">
            {(perfil.mensaje || '').length}/100 caracteres
          </StyledText>
        </StyledView>

        <StyledView className="mb-3">
          <StyledText className="text-lg font-bold mb-2 text-primary-700">Género:</StyledText>
          <View className="flex flex-row">
            <TouchableOpacity
              className={`p-3 border-2 m-2 rounded-full ${
                perfil.sexo === "Masculino" ? "bg-primary-500 border-primary-700" : "bg-primary-200 border-primary-400"
              }`}
              onPress={() => handleGeneroSelection("Masculino")}
            >
              <Text
                className={`${
                  perfil.sexo === "Masculino" ? "text-white" : "text-primary-700"
                } font-JakartaSemiBold`}
              >
                Masculino
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`p-3 border-2 m-2 rounded-full ${
                perfil.sexo === "Femenino" ? "bg-secondary-500 border-secondary-700" : "bg-primary-200 border-primary-400"
              }`}
              onPress={() => handleGeneroSelection("Femenino")}
            >
              <Text
                className={`${
                  perfil.sexo === "Femenino" ? "text-white" : "text-secondary-700"
                } font-JakartaSemiBold`}
              >
                Femenino
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`p-3 border-2 m-2 rounded-full ${
                perfil.sexo === "Otro" ? "bg-general-200 border-general-400" : "bg-primary-200 border-primary-400"
              }`}
              onPress={() => handleGeneroSelection("Otro")}
            >
              <Text
                className={`${
                  perfil.sexo === "Otro" ? "text-white" : "text-general-800"
                } font-JakartaSemiBold`}
              >
                Otro
              </Text>
            </TouchableOpacity>
          </View>
        </StyledView>

        <StyledView className="mb-2">
          <StyledText className="text-lg font-bold mb-2 text-primary-700">Edad:</StyledText>
          <StyledTextInput
            className="border border-gray-300 p-2 rounded-md"
            value={perfil.edad.toString()}
            onChangeText={(text) => {
              const age = parseInt(text) || 0;
              if (age <= 100) {
                setPerfil({...perfil, edad: age});
              }
            }}
            keyboardType="numeric"
            maxLength={3}
          />
        </StyledView>

        <StyledView className="mb-2">
          <StyledText className="text-lg font-bold mb-2 text-primary-700">Ubicación:</StyledText>
          <StyledTextInput
            className="border border-gray-300 p-2 rounded-md"
            value={perfil.ubicacion}
            onChangeText={(text) => setPerfil({...perfil, ubicacion: text})}
          />
        </StyledView>

        <StyledView className="mb-2">
          <StyledText className="text-lg font-bold mb-2 text-primary-700">Biografía:</StyledText>
          <StyledTextInput
            className="border border-gray-300 p-2 rounded-md"
            value={perfil.biografia}
            onChangeText={(text) => setPerfil({...perfil, biografia: text})}
            multiline
            numberOfLines={3}
          />
        </StyledView>

        <StyledView className="mb-4">
          <StyledText className="text-lg font-bold text-primary-700">Géneros Musicales Seleccionados:</StyledText>
          {renderSelectedItems(perfil.generos, 'generos')}
          <StyledTouchableOpacity 
            className="bg-primary-500 p-2 rounded-md mt-2"
            onPress={() => {
              setModalContent('generos');
              setModalVisible(true);
            }}
          >
            <StyledText className="text-white text-center font-JakartaMedium ">Modificar Géneros</StyledText>
          </StyledTouchableOpacity>
        </StyledView>

        <StyledView className="mb-4">
          <StyledText className="text-lg font-bold text-primary-700">Habilidades Musicales Seleccionadas:</StyledText>
          {renderSelectedItems(perfil.habilidades, 'habilidades')}
          <StyledTouchableOpacity 
            className="bg-primary-500 p-2 rounded-md mt-2"
            onPress={() => {
              setModalContent('habilidades');
              setModalVisible(true);
            }}
          >
            <StyledText className="text-white text-center font-JakartaMedium">Modificar Habilidades</StyledText>
          </StyledTouchableOpacity>
        </StyledView>

        <StyledView className="mb-4">
          <StyledText className="text-lg font-bold mb-2 text-blue-600">Redes Sociales (máx. 3):</StyledText>
          <View className="flex-row justify-start mb-2">
            {perfil.redes_sociales.map((red, index) => {
              const iconName = getRedSocialIcon(red.nombre);
              if (iconName) {
                return (
                  <TouchableOpacity 
                    key={index} 
                    onPress={() => handleRedSocialPress(red.url)}
                    onLongPress={() => handleRedSocialLongPress(index)}
                    delayLongPress={500}
                    className="mr-4"
                  >
                    <FontAwesome name={iconName} size={30} color="blue" />
                  </TouchableOpacity>
                );
              }
              return null;
            })}
          </View>
          {perfil.redes_sociales.length < 3 && (
            <View>
              <TouchableOpacity 
                className="bg-blue-500 p-2 rounded-md mb-2"
                onPress={() => setModalRedSocialVisible(true)}
              >
                <Text className="text-white text-center">Agregar Red Social</Text>
              </TouchableOpacity>
              {nuevaRedSocial.nombre && (
                <>
                  <StyledTextInput
                    className="border border-gray-300 p-2 rounded-md mb-2"
                    value={nuevaRedSocial.url}
                    onChangeText={(text) => setNuevaRedSocial(prev => ({ ...prev, url: text }))}
                    placeholder={`URL de ${nuevaRedSocial.nombre}`}
                  />
                  <TouchableOpacity 
                    className="bg-green-500 p-2 rounded-md"
                    onPress={guardarRedSocial}
                  >
                    <Text className="text-white text-center">Guardar Red Social</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </StyledView>

        <StyledTouchableOpacity 
          className="bg-purple-800 p-2 rounded-md items-center mt-2"
          onPress={actualizarPerfil}
        >
          <StyledText className="text-white font-bold text-lg">Guardar Cambios</StyledText>
        </StyledTouchableOpacity>
      </StyledView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black bg-opacity-50">
          <View className="bg-white rounded-t-3xl p-4 h-3/4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-primary-700">
                {modalContent === 'generos' ? 'Modificar Géneros Musicales' : 
                 modalContent === 'habilidades' ? 'Modificar Habilidades Musicales' : 
                 'Modificar Redes Sociales'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Image source={icons.close} className="w-6 h-6" />
              </TouchableOpacity>
            </View>
            <ScrollView className="mb-4">
              {renderModalContent()}
            </ScrollView>
            <TouchableOpacity 
              className="bg-primary-500 p-3 rounded-full"
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-white text-center font-bold">Guardar Cambios</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para seleccionar red social */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalRedSocialVisible}
        onRequestClose={() => setModalRedSocialVisible(false)}
      >
        <View className="flex-1 justify-end bg-black bg-opacity-50">
          <View className="bg-white rounded-t-3xl p-4">
            <Text className="text-lg font-bold mb-4 text-center">Selecciona una Red Social</Text>
            {redesSociales.map((red) => (
              <TouchableOpacity
                key={red}
                className="p-3 border-b border-gray-200"
                onPress={() => agregarRedSocial(red)}
              >
                <Text className="text-center">{red}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              className="mt-4 bg-red-500 p-3 rounded-full"
              onPress={() => setModalRedSocialVisible(false)}
            >
              <Text className="text-white text-center">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </StyledScrollView>
  );
};

export default EditarPerfil;