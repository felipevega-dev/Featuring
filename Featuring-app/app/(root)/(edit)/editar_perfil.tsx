import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';

const StyledView = styled(View)
const StyledText = styled(Text)
const StyledTextInput = styled(TextInput)
const StyledTouchableOpacity = styled(TouchableOpacity)
const StyledImage = styled(Image)
const StyledScrollView = styled(ScrollView)

const generosMusicales = ['Rock', 'Pop', 'Hip-hop', 'Jazz', 'Clásica', 'Reggaetón', 'Salsa', 'Blues', 'Country', 'Electrónica', 'K-pop', 'J-pop', 'Disco', 'Techno', 'House', 'Dubstep', 'Drum and Bass', 'Gospel', 'Grunge', 'New Wave', 'Alternativo', 'Experimental'];
const tiposMusico = ['Cantante', 'Músico de Instrumento', 'Compositor', 'Productor', 'DJ', 'Guitarrista', 'Baterista', 'Bajista', 'Tecladista', 'Percusionista', 'Indie', 'Rapero', 'Bailarin', 'Liricista', 'Beatmaker', 'Corista'];

const EditarPerfil = () => {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [nombreArtistico, setNombreArtistico] = useState('');
  const [genero, setGenero] = useState('');
  const [edad, setEdad] = useState('');
  const [biografia, setBiografia] = useState('');
  const [habilidades, setHabilidades] = useState<string[]>([]);
  const [generos, setGeneros] = useState<string[]>([]);
  const [fotoPerfil, setFotoPerfil] = useState('https://via.placeholder.com/150');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'habilidades' | 'generos'>('habilidades');

  const abrirModal = (tipo: 'habilidades' | 'generos') => {
    setModalType(tipo);
    setModalVisible(true);
  };

  const InputField = ({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default' }) => (
    <StyledView className="mb-4">
      <StyledText className="text-lg font-bold mb-2">{label}</StyledText>
      <StyledTextInput
        className={`border border-gray-300 p-3 rounded-md ${multiline ? 'h-24' : ''}`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </StyledView>
  );

  const MultiInputField = ({ label, items, addItem, removeItem }) => (
    <StyledView className="mb-4">
      <StyledText className="text-sm font-bold mb-2 text-gray-500">{label}</StyledText>
      <StyledTouchableOpacity 
        className="border border-blue-500 rounded-full py-2 px-4 mb-2"
        onPress={addItem}
      >
        <StyledText className="text-blue-500 text-center">Agrega un(a) {label.toLowerCase().slice(0, -1)} +</StyledText>
      </StyledTouchableOpacity>
      <StyledView className="flex-row flex-wrap">
        {items.map((item, index) => (
          <StyledView key={index} className="bg-purple-200 rounded-full px-3 py-1 m-1 flex-row items-center">
            <StyledText className="text-purple-700">{item}</StyledText>
            <StyledTouchableOpacity onPress={() => removeItem(item)} className="ml-2">
              <Ionicons name="close" size={20} color="purple" />
            </StyledTouchableOpacity>
          </StyledView>
        ))}
      </StyledView>
    </StyledView>
  );

  const agregarItem = (item: string) => {
    if (modalType === 'habilidades') {
      if (!habilidades.includes(item)) {
        setHabilidades([...habilidades, item]);
      }
    } else {
      if (!generos.includes(item)) {
        setGeneros([...generos, item]);
      }
    }
    setModalVisible(false);
  };

  const eliminarHabilidad = (habilidad: string) => {
    setHabilidades(habilidades.filter(h => h !== habilidad));
  };

  const eliminarGenero = (genero: string) => {
    setGeneros(generos.filter(g => g !== genero));
  };

  const cambiarFoto = () => {
    // Aquí iría la lógica para seleccionar una nueva foto
    console.log('Cambiar foto de perfil');
  };

  return (
    <StyledScrollView className="flex-1 bg-white">
      <StyledView className="p-6 mt-10">
        <Stack.Screen options={{ title: 'Editar Perfil', headerShown: false }} />
        
        <StyledTouchableOpacity 
          className="absolute top-2 left-2 z-10"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </StyledTouchableOpacity>

        <StyledText className="text-2xl font-bold mb-6 text-center">Editar Perfil</StyledText>
        
        <StyledView className="items-center mb-6">
          <StyledImage
            source={{ uri: fotoPerfil }}
            className="w-24 h-24 rounded-full mb-2"
          />
          <StyledTouchableOpacity onPress={cambiarFoto}>
            <StyledText className="text-blue-500">Cambiar foto</StyledText>
          </StyledTouchableOpacity>
        </StyledView>
        
        <InputField label="Nombre:" value={nombre} onChangeText={setNombre} placeholder="Tu nombre completo" />
        <InputField label="Nombre Artístico:" value={nombreArtistico} onChangeText={setNombreArtistico} placeholder="Tu nombre artístico" />
        <InputField label="Género:" value={genero} onChangeText={setGenero} placeholder="Tu género" />
        <InputField label="Edad:" value={edad} onChangeText={setEdad} placeholder="Tu edad" keyboardType="numeric" />
        <InputField label="Biografía:" value={biografia} onChangeText={setBiografia} placeholder="Cuéntanos sobre ti" multiline={true} />
        
        <MultiInputField 
          label="Habilidad " 
          items={habilidades} 
          addItem={() => abrirModal('habilidades')}
          removeItem={eliminarHabilidad}
        />

        <MultiInputField 
          label="Generos favoritos" 
          items={generos} 
          addItem={() => abrirModal('generos')}
          removeItem={eliminarGenero}
        />

        <StyledTouchableOpacity 
          className="bg-blue-500 p-4 rounded-md items-center mt-6"
          onPress={() => console.log('Guardar cambios')}
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
  <StyledView className="flex-1 justify-end">
    <StyledView className="bg-white rounded-t-3xl shadow-lg">
      <StyledView className="p-4 border-b border-gray-200">
        <StyledText className="text-xl font-bold text-center">
          {modalType === 'habilidades' ? 'Selecciona una habilidad' : 'Selecciona un género'}
        </StyledText>
        <StyledTouchableOpacity 
          className="absolute right-4 top-4"
          onPress={() => setModalVisible(false)}
        >
          <Ionicons name="close" size={24} color="black" />
        </StyledTouchableOpacity>
      </StyledView>
      <ScrollView className="max-h-72">
        {(modalType === 'habilidades' ? tiposMusico : generosMusicales).map((item, index) => (
          <StyledTouchableOpacity 
            key={index} 
            className="py-2 px-4 border-b border-gray-200"
            onPress={() => agregarItem(item)}
          >
            <StyledText className="text-sm">{item}</StyledText>
          </StyledTouchableOpacity>
        ))}
      </ScrollView>
    </StyledView>
  </StyledView>
</Modal>
    </StyledScrollView>
  );
};

// ... (InputField y MultiInputField permanecen iguales)

export default EditarPerfil;