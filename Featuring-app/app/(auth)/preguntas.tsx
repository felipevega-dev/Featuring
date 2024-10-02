import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Modal, SafeAreaView, Text, TextInput, View, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Keyboard, Alert, Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Swiper from 'react-native-swiper';
import { useRouter } from 'expo-router';
import { images } from "@/constants";
import CustomButton from "@/components/CustomButton";
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase'; 
import { useAuth } from "@clerk/clerk-expo";
import { useUser } from "@clerk/clerk-expo";
import DropDownPicker from 'react-native-dropdown-picker';

//Obtener dimensiones de la pantalla
const { height, width } = Dimensions.get('window');



//Funcion principal
export default function Preguntas() {
  //Variables para el dropdown de la fecha de nacimiento
  const [dia, setDia] = useState(1);
  const [mes, setMes] = useState(1);
  const [anio, setAnio] = useState(2000);

  const [diaOpen, setDiaOpen] = useState(false);
  const [mesOpen, setMesOpen] = useState(false);
  const [anioOpen, setAnioOpen] = useState(false);

  const dias = Array.from({ length: 31 }, (_, i) => ({ label: `${i + 1}`, value: i + 1 }));
  const meses = [
    { label: 'Enero', value: 1 },
    { label: 'Febrero', value: 2 },
    // ... otros meses ...
    { label: 'Diciembre', value: 12 },
  ];
  const anios = Array.from({ length: 100 }, (_, i) => ({ label: `${2023 - i}`, value: 2023 - i }));
  //Variables para el dropdown de la fecha de nacimiento


  const [modalVisible, setModalVisible] = useState(false);  // Modal para mostrar los generos o tipos de musicos
  const [modalContent, setModalContent] = useState<'generos' | 'tipos'>('generos'); // Modal para mostrar los generos o tipos de musicos

  const initialItemsCount = 8; // Número de items a mostrar inicialmente


  /* Variables */
  const { user } = useUser();
  const router = useRouter();
  const swiperRef = useRef<Swiper>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [nombre, setNombre] = useState('');
  const [genero, setGenero] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tipoMusico, setTipoMusico] = useState('');
  const [generosMusicalesSeleccionados, setGenerosMusicalesSeleccionados] = useState<string[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [redesSociales, setRedesSociales] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const generosMusicales = ['Rock', 'Pop', 'Hip-hop', 'Jazz', 'Clásica', 'Reggaetón', 'Salsa', 'Blues', 'Country', 'Electrónica',  'K-pop', 'J-pop', 'Disco', 'Techno', 'House', 'Dubstep', 'Drum and Bass', 
    'Gospel', 'Grunge', 'New Wave', 'Alternativo', 'Experimental', ];
  const tiposMusico = ['Cantante', 'Músico de Instrumento', 'Compositor', 'Productor', 'DJ', 'Guitarrista', 'Baterista', 'Bajista', 'Tecladista', 'Percusionista','Indie','Rapero','Bailarin','Liricista', 'Beatmaker','Corista'];
  
  const isLastSlide = activeIndex === 7;
  const isFirstSlide = activeIndex === 0;
  const { userId: clerkUserId } = useAuth();
  /* Variables */


  /* Funciones */


  //Obtener el estado del teclado
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  //Funcion para seleccionar los generos musicales
  const toggleGeneroMusical = useCallback((genero: string) => {
    setGenerosMusicalesSeleccionados((prev) => {
      if (prev.includes(genero)) {
        return prev.filter((item) => item !== genero);
      }
      if (prev.length < 5) {
        return [...prev, genero];
      }
      return prev;
    });
  }, []);

  //Funcion para renderizar los generos musicales
  const renderGenerosMusicales = useCallback((inModal: boolean) => (
    <View className="flex-row flex-wrap justify-center">
      {(inModal ? generosMusicales : generosMusicales.slice(0, initialItemsCount)).map((genero) => (
        <TouchableOpacity
          key={genero}
          onPress={() => toggleGeneroMusical(genero)}
          className={`m-2 p-3 rounded-full ${
            generosMusicalesSeleccionados.includes(genero)
              ? 'bg-blue-500'
              : 'bg-gray-200'
          }`}
        >
          <Text className={`text-center ${
            generosMusicalesSeleccionados.includes(genero) ? 'text-white' : 'text-gray-800'
          }`}>
            {genero}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  ), [generosMusicalesSeleccionados]);


  //Funcion para renderizar los tipos de musicos
  const renderTiposMusico = useCallback((inModal: boolean) => (
    <View className="flex-row flex-wrap justify-center">
      {(inModal ? tiposMusico : tiposMusico.slice(0, initialItemsCount)).map((tipo) => (
        <TouchableOpacity
          key={tipo}
          onPress={() => setTipoMusico(tipo)}
          className={`m-2 p-3 rounded-full ${
            tipoMusico === tipo
              ? 'bg-blue-500'
              : 'bg-gray-200'
          }`}
        >
          <Text className={`text-center ${
            tipoMusico === tipo ? 'text-white' : 'text-gray-800'
          }`}>
            {tipo}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  ), [tipoMusico]);

//Funcion para abrir el modal
  const openModal = (content: 'generos' | 'tipos') => {
    setModalContent(content);
    setModalVisible(true);
  };


  //Funcion para seleccionar la foto de perfil
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  //Funcion para solicitar el permiso de la ubicacion
  const requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'No se puede acceder a la ubicación');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setLocation(location);
    Alert.alert('Ubicación obtenida', 'Gracias por compartir tu ubicación');
  };

  //Funcion para avanzar a la siguiente pagina
  const handleNext = useCallback(() => {
    if (isLastSlide) {
      SaveProfile();
      console.log({ nombre, genero, fechaNacimiento, generosMusicalesSeleccionados, descripcion, redesSociales, profileImage, location });
      router.replace('/');
    } else {
      switch (activeIndex) {
        case 0:
          if (nombre.trim() === '') {
            Alert.alert("Error", "Por favor, ingresa tu nombre.");
            return;
          }
          break;
        case 1:
          if (genero === '') {
            Alert.alert("Error", "Por favor, selecciona tu género.");
            return;
          }
          break;
        case 2:
          // No need to validate date of birth as it always has a default value
          break;
        case 3:
          if (tipoMusico === '') {
            Alert.alert("Error", "Por favor, selecciona tu tipo de músico.");
            return;
          }
          break;
        case 4:
          if (generosMusicalesSeleccionados.length === 0) {
            Alert.alert("Error", "Por favor, selecciona al menos un género musical.");
            return;
          }
          break;
        case 5:
          if (!profileImage) {
            Alert.alert("Error", "Por favor, selecciona una foto de perfil.");
            return;
          }
          break;
        case 6:
          if (descripcion.trim() === '') {
            Alert.alert("Error", "Por favor, ingresa una descripción.");
            return;
          }
          break;
      }
      swiperRef.current?.scrollBy(1);
    }
  }, [isLastSlide, activeIndex, nombre, genero, tipoMusico, generosMusicalesSeleccionados, descripcion, profileImage, location, router]);

  //Funcion para regresar a la pagina anterior
  const handleBack = useCallback(() => {
    if (!isFirstSlide) {
      swiperRef.current?.scrollBy(-1);
    }
  }, [isFirstSlide]);


  //Funcion para obtener la fecha de nacimiento
  const getFechaNacimiento = () => {
    return new Date(anio, mes - 1, dia);
  };
  //Funcion para calcular la edad
  const calcularEdad = (dia: number, mes: number, anio: number): number => {
    const fechaNacimiento = new Date(anio, mes - 1, dia); // Nota: mes - 1 porque en JavaScript los meses van de 0 a 11
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const m = hoy.getMonth() - fechaNacimiento.getMonth();
    
    if (m < 0 || (m === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  };
  //Funcion para guardar el perfil
  const SaveProfile = async () => {
    try {
      console.log("Iniciando SaveProfile");
      const edad = calcularEdad(dia, mes, anio);
      const fechaNacimiento = getFechaNacimiento();
      if (!user || !user.id) {
        console.log("Error: No se pudo obtener la información del usuario de Clerk");
        Alert.alert("Error", "No se pudo obtener la información del usuario.");
        return;
      }

      console.log("Usuario de Clerk obtenido:", user.id);

      // Verificar si el usuario ya existe en la tabla usuarios de Supabase
      let { data: existingUser, error: userCheckError } = await supabase
        .from('usuario')
        .select('id')
        .eq('clerk_id', user.id)
        .single();

      if (userCheckError && userCheckError.code !== 'PGRST116') {
        throw userCheckError;
      }

      let supabaseUserId;

      if (!existingUser) {
        // Si el usuario no existe, lo creamos
        const { data: newUser, error: insertError } = await supabase
          .from('usuario')
          .insert({ clerk_id: user.id })
          .select('id')
          .single();

        if (insertError) throw insertError;
        supabaseUserId = newUser.id;
      } else {
        supabaseUserId = existingUser.id;
      }

      const perfilData = {
        usuario_id: supabaseUserId,
        clerk_id: user.id,
        nombre_completo: nombre,
        sexo: genero,
        fecha_nacimiento: fechaNacimiento.toISOString(),
        biografia: descripcion,
        redes_sociales: redesSociales,
        foto_perfil: profileImage,
        ubicacion: location ? `${location.coords.latitude},${location.coords.longitude}` : null,
        edad: edad,
       
      };

      console.log("Datos del perfil a insertar:", JSON.stringify(perfilData, null, 2));

      const { data, error } = await supabase
        .from("perfil")
        .insert(perfilData);

      if (error) {
        console.error("Error al insertar en Supabase:", error);
        throw error;
      }

      console.log("Inserción exitosa. Datos insertados:", data);

      Alert.alert("Éxito", "Perfil guardado correctamente");
      router.push("/(root)/(tabs)/home");
    } catch (error) {
      console.error('Error detallado al guardar el perfil:', error);
      if (error.message) {
        console.error('Mensaje de error:', error.message);
      }
      if (error.details) {
        console.error('Detalles del error:', error.details);
      }
      Alert.alert("Error", "No se pudo guardar el perfil. Por favor, inténtalo de nuevo.");
    }
  };




  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* KeyboardAvoidingView para que el teclado no tape los campos */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
      {/* ScrollView para que el teclado no tape los campos */}
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1">
            <View className="relative w-full h-[100px] mt-10 flex items-center justify-center">
              <Image source={images.FeatLogo} className="z-0 w-[180px] h-[100px]" />
            </View>
            {/* Swiper para las paginas */}
            <Swiper
              ref={swiperRef}
              loop={false}
              scrollEnabled={false}
              dot={<View className="w-[32px] h-[4px] mx-1 bg-[#E2E8F0] rounded-full" />}
              activeDot={<View className="w-[32px] h-[4px] mx-1 bg-[#6D29D2] rounded-full" />}
              index={activeIndex}
              onIndexChanged={setActiveIndex}
              showsPagination={true}
              paginationStyle={{ top: 10, bottom: undefined }}
              style={{ height: height - 250 }}
            >
              {/* Slide 1 - Nombre */}
              <View className="flex-1 justify-center items-center mb-10">
                <Text className="text-lg text-blue-500 font-bold">Ingresa tu nombre artistico</Text>
                <TextInput
                  className="border-1 rounded-full bg-blue-200 border-blue-500 p-3 w-3/4 mt-4"
                  placeholder="Tu nombre artistico"
                  value={nombre}
                  onChangeText={setNombre}
                />
                <Image
                  source={images.IconoMusical}
                  className="w-4/5 h-24 mb-10 mt-10"
                  resizeMode="contain"
                />
              </View>

                  
                      {/* Slide 2 - Género */}
            <View className="flex-1 justify-center items-center mb-10">
              <Text className="text-lg text-blue-500 font-bold mb-5">Selecciona tu género</Text>
              <View className="flex flex-row mb-10">
                <TouchableOpacity
                  className={`p-3 mx-2 border-1 rounded-full ${
                    genero === 'Masculino'
                      ? 'bg-blue-500'
                      : 'bg-gray-200 '
                  }`}
                  onPress={() => setGenero('Masculino')}
                >
                  <Text className={`${
                    genero === 'Masculino' ? 'text-white' : 'text-blue-500'
                  } font-semibold`}>
                    Masculino
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`p-3 mx-2 border-1 rounded-full ${
                    genero === 'Femenino'
                      ? 'bg-pink-500'
                      : 'bg-gray-200'
                  }`}
                  onPress={() => setGenero('Femenino')}
                >
                  <Text className={`${
                    genero === 'Femenino' ? 'text-white' : 'text-pink-500'
                  } font-semibold`}>
                    Femenino
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`p-3 mx-2 border-1 rounded-full ${
                    genero === 'Otro'
                      ? 'bg-gray-500 '
                      : 'bg-gray-200'
                  }`}
                  onPress={() => setGenero('Otro')}
                >
                  <Text className={`${
                    genero === 'Otro' ? 'text-white' : 'text-gray-500'
                  } font-semibold`}>
                    Otro
                  </Text>
                </TouchableOpacity>
              </View>
              <Image
                source={images.IconoMusical}
                className="w-4/5 h-24 mb-10 mt-10"
                resizeMode="contain"
              />
            </View>
        {/* Slide 2 - Género */}

              {/* Slide 3 - Fecha de Nacimiento */}
          <View className="flex-1 justify-center items-center bg-pink-100 p-4">
              <Text className="text-lg text-pink-700 font-bold pb-2 ">Fecha de Nacimiento</Text>
              <View className="flex-row justify-between">
                <View className="w-1/4">
                  <DropDownPicker
                    open={diaOpen}
                    value={dia}
                    items={dias}
                    setOpen={setDiaOpen}
                    setValue={setDia}
                    zIndex={3000}
                    zIndexInverse={1000}
                    style={{backgroundColor: 'pink-200'}}
                    textStyle={{color: 'pink-800'}}
                  />
                </View>
                <View className="w-2/5">
                  <DropDownPicker
                    open={mesOpen}
                    value={mes}
                    items={meses}
                    setOpen={setMesOpen}
                    setValue={setMes}
                    zIndex={2000}
                    zIndexInverse={2000}
                    style={{backgroundColor: 'pink-200'}}
                    textStyle={{color: 'pink-800'}}
                  />
                </View>
                <View className="w-1/3">
                  <DropDownPicker
                    open={anioOpen}
                    value={anio}
                    items={anios}
                    setOpen={setAnioOpen}
                    setValue={setAnio}
                    zIndex={1000}
                    zIndexInverse={3000}
                    style={{backgroundColor: 'pink-200'}}
                    textStyle={{color: 'pink-800'}}
                  />
                </View> 
                
              </View>
              <Image
                source={images.IconoMusical}
                className="w-5/5 h-24 mb-10 mt-10"
                resizeMode="contain"
              />
            </View>
              {/* Slide 3 - Fecha de Nacimiento */}

              {/* Slide 4 - Tipo de Músico */}
      <View className="flex-1 justify-start items-center mt-8">
        <Text className="text-lg text-blue-500 font-bold mb-4">Selecciona tu tipo de músico</Text>
        {renderTiposMusico(false)}
        {tiposMusico.length > initialItemsCount && (
          <TouchableOpacity
            onPress={() => openModal('tipos')}
            className="mt-4 p-2 bg-purple-500 rounded-full"
          >
            <Text className="text-white text-center">Ver más</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slide 5 - Géneros musicales */}
      <View className="flex-1 justify-start items-center mt-8">
        <Text className="text-lg text-blue-500 font-bold mb-4">Selecciona tus 5 géneros musicales favoritos</Text>
        {renderGenerosMusicales(false)}
        {generosMusicales.length > initialItemsCount && (
          <TouchableOpacity
            onPress={() => openModal('generos')}
            className="mt-4 p-2 bg-purple-500 rounded-full"
          >
            <Text className="text-white text-center">Ver más</Text>
          </TouchableOpacity>
        )}
      </View>
              {/* Slide 6 - Foto de perfil */}
              <View className="flex-1 justify-center items-center mb-10 pb-10">
                <Text className="text-lg text-blue-500 font-bold">Selecciona tu foto de perfil</Text>
                <TouchableOpacity onPress={pickImage} className="mt-4 rounded-lg border-2 border-blue-500 p-3">
                  {profileImage ? (
                    <Image source={{ uri: profileImage }} style={{ width: 200, height: 200, borderRadius: 100 }} />
                  ) : (
                    <View className="w-[200px] h-[200px] bg-gray-300 rounded-full flex items-center justify-center">
                      <Text className="text-gray-600">Toca para seleccionar</Text>
                    </View>
                  )}
                </TouchableOpacity>
               
              </View>

             {/* Slide 7 - Descripción y Redes Sociales */}
            <View className="flex-1 justify-center items-center mb-10 pb-10">
              <Text className="text-lg text-blue-500 font-bold ">Descripción y Redes Sociales</Text>
              <View className="w-3/4">
                <TextInput
                  className="border-2 rounded-lg border-blue-500 p-3 mt-4"
                  placeholder="Describe tu perfil musical (máximo 300 caracteres)"
                  value={descripcion}
                  onChangeText={(text) => setDescripcion(text.slice(0, 300))}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  maxLength={300}
                />
                <Text className="text-right text-gray-500 mt-1">
                  {descripcion.length}/300
                </Text>
              </View>
              <TextInput
                className="border-2 rounded-lg border-blue-500 p-3 w-3/4 mt-4"
                placeholder="Redes Sociales (ej: Instagram, Twitter)"
                value={redesSociales}
                onChangeText={setRedesSociales}
              />
             
            </View>

              {/* Slide 8 - Acceso a la Ubicación */}
              <View className="flex-1 justify-center items-center mb-10 pb-10">
                <Text className="text-lg text-blue-500 font-bold">¿Deseas acceder a tu ubicación?</Text>
                <Text className="text-center text-blue-500 mt-4 px-4">
                  Al permitir el acceso a tu ubicación, podemos mejorar tu experiencia en la aplicación.
                </Text>
                <TouchableOpacity 
                  className="bg-purple-500 border-2 border-purple-700 p-3 mt-4 rounded-md"
                  onPress={requestLocationPermission}
                >
                  <Text className="text-white">Permitir ubicación</Text>
                </TouchableOpacity>
              </View>
              <Image
                  source={images.IconoMusical}
                  className="w-4/5 h-24 mb-10 mt-10"
                  resizeMode="contain"
                />
            </Swiper>
          </View>
        </ScrollView>
        
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
            <View className="bg-white p-5 rounded-lg w-5/6 max-h-5/6">
              <Text className="text-lg text-blue-500 font-bold mb-4">
                {modalContent === 'generos' ? 'Todos los géneros musicales' : 'Todos los tipos de músico'}
              </Text>
              <ScrollView>
                {modalContent === 'generos' ? renderGenerosMusicales(true) : renderTiposMusico(true)}
              </ScrollView>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="mt-4 p-2 bg-purple-500 rounded-full"
              >
                <Text className="text-white text-center">Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Botones para navegar */}
        {!keyboardVisible && (
          <View className="w-full absolute bottom-10 pt-10 flex flex-row justify-between items-center px-4">
            {!isFirstSlide && (
              <CustomButton
                title="Atrás"
                onPress={handleBack}
                style={{ width: (width - 48) / 2 }}
              />
            )}
            <CustomButton
              title={isLastSlide ? 'Finalizar' : 'Siguiente'}
              onPress={handleNext}
              style={{ width: isFirstSlide ? width - 32 : (width - 48) / 2 }}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}