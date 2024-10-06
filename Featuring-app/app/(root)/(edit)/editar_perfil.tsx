import React, { useState, useEffect ,useRef, useCallback  } from 'react';
import {KeyboardAvoidingView, Platform, Alert, View, Text, TextInput, TouchableOpacity, Image, ScrollView, Modal } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { styled } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import { supabase } from "@/lib/supabase";
import { useAuth } from "@clerk/clerk-expo";
import { useUser } from "@clerk/clerk-expo";
import * as ImagePicker from 'expo-image-picker';

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

  const nombreRef = useRef<TextInput>(null);
  const nombreArtisticoRef = useRef<TextInput>(null);
  const biografiaRef = useRef<TextInput>(null);
  const { user } = useUser();
  const [fechaNacimientoModalVisible, setFechaNacimientoModalVisible] = useState(false);
  const [diaOpen, setDiaOpen] = useState(false);
  const [mesOpen, setMesOpen] = useState(false);
  const [anioOpen, setAnioOpen] = useState(false);
  const [dia, setDia] = useState(null);
  const [mes, setMes] = useState(null);
  const [anio, setAnio] = useState(null);
  const [genero, setGenero] = useState('');
  const [generoOpen, setGeneroOpen] = useState(false);
  const [generoItems, setGeneroItems] = useState([
    { label: 'Masculino', value: 'masculino' },
    { label: 'Femenino', value: 'femenino' },
    { label: 'Otro', value: 'otro' }
  ]);

  // Generar opciones para día, mes y año
  const dias = Array.from({ length: 31 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }));
  const meses = [
    { label: 'Enero', value: 1 },
    { label: 'Febrero', value: 2 },
    { label: 'Marzo', value: 3 },
    { label: 'Abril', value: 4 },
    { label: 'Mayor', value: 5 },
    { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 },
    { label: 'Agosto', value: 8 },
    { label: 'Septiembre', value: 9 },
    { label: 'Octubre', value: 10 },
    { label: 'Noviembre', value: 11 },
    { label: 'Diciembre', value: 12 }
  ];
  const anios = Array.from({ length: 100 }, (_, i) => ({ label: `${2023 - i}`, value: 2023 - i }));

  useEffect(() => {
    if (dia && mes && anio) {
      const fechaNacimiento = new Date(anio, mes - 1, dia);
      const hoy = new Date();
      let edadCalculada = hoy.getFullYear() - fechaNacimiento.getFullYear();
      const m = hoy.getMonth() - fechaNacimiento.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
        edadCalculada--;
      }
      setEdad(edadCalculada.toString());
    }
  }, [dia, mes, anio]);

  const confirmarFechaNacimiento = () => {
    setFechaNacimientoModalVisible(false);
    // Aquí puedes usar la edad calculada (variable 'edad') como necesites
  };
  const abrirModalFechaNacimiento = () => {
    setFechaNacimientoModalVisible(true);
  };
  const InputField = useCallback(({ 
    label, 
    value, 
    onChangeText, 
    placeholder, 
    multiline = false, 
    keyboardType = 'default', 
    inputRef, 
    onSubmitEditing
  }) => (
    <StyledView className="mb-4">
      <StyledText className="text-lg font-bold mb-2">{label}</StyledText>
      <StyledTextInput
        className={`border border-gray-300 p-3 rounded-md ${multiline ? 'h-24' : ''}`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        multiline={multiline}
        keyboardType={keyboardType}
        ref={inputRef}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={!onSubmitEditing}
      />
    </StyledView>
  ), []);

  const handleTextChange = useCallback((setter) => (text) => {
    setter(text);
  }, []);

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

  
  
  const cambiarFoto = async () => {
    try {
      // Solicitar permiso para acceder a la galería
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Se necesita permiso para acceder a la galería');
        return;
      }
  
      // Abrir el selector de imágenes
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Cambiado a [1, 1] para una imagen cuadrada
        quality: 1,
      });
  
      if (!result.canceled && result.assets && result.assets[0].uri) {
        // Actualizar el estado local con la URI de la nueva imagen
        setFotoPerfil(result.assets[0].uri);
        
        console.log('Nueva foto de perfil seleccionada:', result.assets[0].uri);
        Alert.alert('Éxito', 'Foto de perfil seleccionada correctamente');
        
        // Aquí podrías llamar a una función para subir la imagen a tu servidor o a Supabase
        // Por ejemplo: await subirImagenASupabase(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al cambiar la foto de perfil:', error);
      Alert.alert('Error', 'No se pudo cambiar la foto de perfil');
    }
  };
  const actualizarPerfil = async () => {
    try {
      // Primero, obtén el ID del usuario actual de Supabase
const { data: { user }, error: userError } = await supabase.auth.getUser();

if (userError) {
  throw userError;
}

if (!user) {
  throw new Error('No se encontró un usuario autenticado');
}

// Ahora, obtén el ID del perfil existente usando el ID del usuario de Supabase
let { data: perfilExistente, error: perfilCheckError } = await supabase
  .from('perfil')
  .select('id')
  .eq('usuario_id', user.id)
  .single();

if (perfilCheckError) {
  throw perfilCheckError;
}

if (!perfilExistente) {
  throw new Error('No se encontró un perfil para este usuario');
}

// Ahora puedes usar perfilExistente.id para las operaciones subsiguientes
      // Construir la fecha de nacimiento
      const fechaNacimiento = dia && mes && anio ? new Date(anio, mes - 1, dia).toISOString() : null;
  
      const perfilData = {
        nombre_completo: nombreArtistico,
        sexo: genero,
        fecha_nacimiento: fechaNacimiento,
        biografia: biografia,
        foto_perfil: fotoPerfil,
        edad: edad,
      };
  
      console.log("Datos del perfil a actualizar:", JSON.stringify(perfilData, null, 2));
  
      const { data: perfilActualizado, error: perfilError } = await supabase
        .from("perfil")
        .update(perfilData)
        .eq('id', perfilExistente.id)
        .select()
        .single();
  
      if (perfilError) {
        console.error("Error al actualizar en Supabase:", perfilError);
        throw perfilError;
      }
  
      console.log("Actualización exitosa. Datos actualizados:", perfilActualizado);
  
      // Actualizar las habilidades del usuario
      await supabase
        .from("perfil_habilidad")
        .delete()
        .eq('perfil_id', perfilExistente.id);
  
      for (const habilidad of habilidades) {
        const perfil_habilidadData = {
          perfil_id: perfilExistente.id,
          habilidad: habilidad
        };
        
        const { error: perfil_habilidadError } = await supabase
          .from("perfil_habilidad")
          .insert(perfil_habilidadData);
  
        if (perfil_habilidadError) {
          console.error("Error al insertar habilidad en Supabase:", perfil_habilidadError);
        }
      }
  
      // Actualizar los géneros musicales favoritos
      await supabase
        .from("perfil_genero_musical")
        .delete()
        .eq('perfil_id', perfilExistente.id);
  
      for (const generoMusical of generos) {
        const perfil_generoData = {
          perfil_id: perfilExistente.id,
          genero: generoMusical
        };
        
        const { error: perfil_generoError } = await supabase
          .from("perfil_genero")
          .insert(perfil_generoData);
  
        if (perfil_generoError) {
          console.error("Error al insertar género musical en Supabase:", perfil_generoError);
        }
      }
  
      Alert.alert("Éxito", "Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      Alert.alert("Error", "Hubo un problema al actualizar el perfil. Por favor, intenta de nuevo.");
    }
  };
  return (
    <KeyboardAvoidingView 
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    style={{ flex: 1 }}
  >
    <StyledScrollView keyboardShouldPersistTaps="handled" className="flex-1 bg-white">
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
        
           
          <StyledView className="p-6 mt-10">
            {/* ... (contenido existente) */}
            
            <InputField 
              label="Nombre Artístico:" 
              value={nombreArtistico} 
              onChangeText={handleTextChange(setNombreArtistico)}
              placeholder="Tu nombre artístico"
              inputRef={nombreArtisticoRef}
              onSubmitEditing={() => biografiaRef.current?.focus()}
            />

           
            <InputField 
              label="Biografía:" 
              value={biografia} 
              onChangeText={handleTextChange(setBiografia)}
              placeholder="Cuéntanos sobre ti" 
              multiline={true}
              inputRef={biografiaRef}
              onSubmitEditing={() => {}} // Función vacía para el último campo
            />


            {/* ... (resto del contenido) */}

          </StyledView>

        <View className="mb-4">
          <StyledText className="text-lg font-bold mb-2">Género:</StyledText>
          <DropDownPicker
            open={generoOpen}
            value={genero}
            items={generoItems}
            setOpen={setGeneroOpen}
            setValue={setGenero}
            setItems={setGeneroItems}
            placeholder="Selecciona tu género"
            containerStyle={{ height: 40 }}
            style={{ backgroundColor: '#fafafa' }}
            dropDownStyle={{ backgroundColor: '#fafafa' }}
            zIndex={3000}
            zIndexInverse={1000}
          />
        </View>

      

        <StyledTouchableOpacity 
            className="border border-blue-500 rounded-full py-2 px-4 mb-2"
            onPress={abrirModalFechaNacimiento}
              >
            <StyledText className="text-blue-500 text-center">
              {dia && mes && anio ? `${dia}/${mes}/${anio}` : 'Seleccionar fecha de nacimiento'}
            </StyledText>
      </StyledTouchableOpacity>

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
  onPress={actualizarPerfil}
>
  <StyledText className="text-white font-bold text-lg">Guardar Cambios</StyledText>
</StyledTouchableOpacity>

      </StyledView>





      <Modal
  animationType="slide"
  transparent={true}
  visible={fechaNacimientoModalVisible}
  onRequestClose={() => setFechaNacimientoModalVisible(false)}
>
  <StyledView className="flex-1 justify-end">
    <StyledView className="bg-white rounded-t-3xl shadow-lg">
      <StyledView className="p-4 border-b border-gray-200">
        <StyledText className="text-xl font-bold text-center">
          Fecha de Nacimiento
        </StyledText>
        <StyledTouchableOpacity 
          className="absolute right-4 top-4"
          onPress={() => setFechaNacimientoModalVisible(false)}
        >
          <Ionicons name="close" size={24} color="black" />
        </StyledTouchableOpacity>
      </StyledView>
      <StyledView className="p-4">
        <StyledView className="flex-row justify-between">
          <StyledView className="w-1/4">
            <DropDownPicker
              open={diaOpen}
              value={dia}
              items={dias}
              setOpen={setDiaOpen}
              setValue={setDia}
              zIndex={3000}
              zIndexInverse={1000}
              placeholder="Día"
            />
          </StyledView>
          <StyledView className="w-2/5">
            <DropDownPicker
              open={mesOpen}
              value={mes}
              items={meses}
              setOpen={setMesOpen}
              setValue={setMes}
              zIndex={2000}
              zIndexInverse={2000}
              placeholder="Mes"
            />
          </StyledView>
          <StyledView className="w-1/3">
            <DropDownPicker
              open={anioOpen}
              value={anio}
              items={anios}
              setOpen={setAnioOpen}
              setValue={setAnio}
              zIndex={1000}
              zIndexInverse={3000}
              placeholder="Año"
            />
          </StyledView>
        </StyledView>
        {edad && (
          <StyledText className="mt-4 text-center text-lg">
            Edad calculada: {edad} años
          </StyledText>
        )}
        <StyledTouchableOpacity 
          className="mt-4 bg-blue-500 p-2 rounded-md"
          onPress={confirmarFechaNacimiento}
        >
          <StyledText className="text-white text-center">Confirmar</StyledText>
        </StyledTouchableOpacity>
      </StyledView>
    </StyledView>
  </StyledView>
</Modal>
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
    </KeyboardAvoidingView>

  );

};


export default EditarPerfil;