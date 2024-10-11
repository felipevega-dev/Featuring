import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  Modal,
  SafeAreaView,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
  Keyboard,
  Alert,
  Image,
} from "react-native";
import Swiper from "react-native-swiper";
import { router } from "expo-router";
import { images } from "@/constants";
import CustomButton from "@/components/CustomButton";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { supabase } from "@/lib/supabase";
import DropDownPicker from "react-native-dropdown-picker";
import { Ionicons } from '@expo/vector-icons'; 
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const { height, width } = Dimensions.get("window");

export default function Preguntas() {
  const swiperRef = useRef<Swiper>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [telefono, setTelefono] = useState("");
  const [genero, setGenero] = useState("");
  const [dia, setDia] = useState(null);
  const [mes, setMes] = useState(null);
  const [anio, setAnio] = useState(null);
  const [diaOpen, setDiaOpen] = useState(false);
  const [mesOpen, setMesOpen] = useState(false);
  const [anioOpen, setAnioOpen] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [location, setLocation] = useState<(Location.LocationObject & { ubicacion?: string }) | null>(null);



  const [habilidadesMusicalesCompletas, setHabilidadesMusicalesCompletas] = useState([
    "Canto", "Guitarra", "Piano", "Batería", "Bajo", "Violín", "Saxofón", "Trompeta", 
    "Flauta", "Ukulele", "DJ", "Producción", "Composición", "Arreglos", "Percusión", 
    "Armónica", "Contrabajo", "Clarinete", "Oboe", "Cello", "Trombón", "Teclado", 
    "Sintetizador", "Banjo", "Mandolina", "Beatboxing", "Técnico de sonido", "Mezcla", 
    "Masterización", "Improvisación", "Solfeo", "Dirección coral", "Dirección orquestal", 
    "Lectura de partituras", "Orquestación", "Grabación", "Edición de audio"
  ]);
  const [habilidadesMusicalesSeleccionadas, setHabilidadesMusicalesSeleccionadas] = useState<string[]>([]);


  const [generosMusicalesCompletos, setGenerosMusicalesCompletos] = useState([
    "Pop", "Rock", "Hip Hop", "R&B", "Jazz", "Clásica", "Electrónica", "Reggaeton", 
    "Country", "Folk", "Blues", "Metal", "Punk", "Indie", "Salsa", "Reggae", 
    "Trap", "House", "Techno", "Dubstep", "Gospel", "Soul", "Funk", "Bossa Nova", 
    "Flamenco", "Cumbia", "Bachata", "Merengue", "Tango", "Grunge", "Progressive Rock", 
    "Disco", "New Wave", "K-Pop", "J-Pop", "Latin Jazz", "Ska", "Afrobeat", 
    "World Music", "Chillout", "Lo-fi"
  ]);

  const [generosMusicalesSeleccionados, setGenerosMusicalesSeleccionados] = useState<string[]>([]);

  const isFirstSlide = activeIndex === 0;
  const isLastSlide = activeIndex === 7;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);


  const validateUsername = async (username: string) => {
    if (username.length < 4 || username.length > 15) {
      setUsernameError("El nombre de usuario debe tener entre 4 y 15 caracteres");
      return false;
    }
    
    const { data, error } = await supabase
      .from("perfil")
      .select("username")
      .eq("username", username)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error al validar username:", error);
      setUsernameError("Error al validar el nombre de usuario");
      return false;
    }

    if (data) {
      setUsernameError("Este nombre de usuario ya está en uso");
      return false;
    }

    setUsernameError("");
    return true;
  };


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

  const toggleHabilidadMusical = useCallback((habilidad: string) => {
    setHabilidadesMusicalesSeleccionadas((prev) => {
      if (prev.includes(habilidad)) {
        return prev.filter((item) => item !== habilidad);
      }
      if (prev.length < 5) {
        return [...prev, habilidad];
      }
      return prev;
    });
  }, []);

  const renderHabilidadesMusicales = useCallback(() => (
    <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-row flex-wrap justify-center">
        {habilidadesMusicalesCompletas.map((habilidad) => (
          <TouchableOpacity
            key={habilidad}
            onPress={() => toggleHabilidadMusical(habilidad)}
            className={`m-2 p-3 rounded-full ${
              habilidadesMusicalesSeleccionadas.includes(habilidad)
                ? "bg-secondary-600"
                : "bg-gray-200"
            }`}
          >
            <Text className={`text-center ${
              habilidadesMusicalesSeleccionadas.includes(habilidad) ? "text-white" : "text-gray-800"
            }`}>
              {habilidad}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  ), [habilidadesMusicalesSeleccionadas, toggleHabilidadMusical]);

  const renderGenerosMusicales = useCallback(() => (
    <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ flexGrow: 1 }}>
      <View className="flex-row flex-wrap justify-center">
        {generosMusicalesCompletos.map((genero) => (
          <TouchableOpacity
            key={genero}
            onPress={() => toggleGeneroMusical(genero)}
            className={`m-2 p-3 rounded-full ${
              generosMusicalesSeleccionados.includes(genero)
                ? "bg-secondary-600"
                : "bg-gray-200"
            }`}
          >
            <Text className={`text-center ${
              generosMusicalesSeleccionados.includes(genero) ? "text-white" : "text-gray-800"
            }`}>
              {genero}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  ), [generosMusicalesSeleccionados, toggleGeneroMusical]);

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

  const requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "No se puede acceder a la ubicación");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    try {
      const [placeDetails] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (placeDetails) {
        const ubicacion = `${placeDetails.city || ''}, ${placeDetails.country || ''}`.trim();
        setLocation({ ...location, ubicacion });
        Alert.alert("Ubicación obtenida", `Tu ubicación es: ${ubicacion}`);
      } else {
        throw new Error("No se pudo obtener la información de la ubicación");
      }
    } catch (error) {
      console.error("Error al obtener la ubicación:", error);
      Alert.alert("Error", "No se pudo obtener la información de la ubicación");
    }
  };

  // Validación adicional para el número de teléfono
  const validatePhoneNumber = (number: string) => {
    const phoneRegex = /^[0-9]{10,11}$/;
    return phoneRegex.test(number);
  };

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      SaveProfile();
    } else {
      // Validaciones adicionales antes de avanzar
      if (activeIndex === 0 && (!username || !telefono || !validatePhoneNumber(telefono))) {
        Alert.alert("Error", "Por favor, ingresa un nombre de usuario y un número de teléfono válido (10-11 dígitos).");
        return;
      }
      if (activeIndex === 1 && !genero) {
        Alert.alert("Error", "Por favor, selecciona tu género.");
        return;
      }
      if (activeIndex === 2 && (!dia || !mes || !anio)) {
        Alert.alert("Error", "Por favor, selecciona tu fecha de nacimiento completa.");
        return;
      }
      if (activeIndex === 3 && habilidadesMusicalesSeleccionadas.length === 0) {
        Alert.alert("Error", "Por favor, selecciona al menos una habilidad musical.");
        return;
      }
      if (activeIndex === 4 && generosMusicalesSeleccionados.length === 0) {
        Alert.alert("Error", "Por favor, selecciona al menos un género musical.");
        return;
      }
      swiperRef.current?.scrollBy(1);
    }
  }, [isLastSlide, activeIndex, username, telefono, genero, dia, mes, anio, habilidadesMusicalesSeleccionadas, generosMusicalesSeleccionados]);

  const handleBack = useCallback(() => {
    if (!isFirstSlide) {
      swiperRef.current?.scrollBy(-1);
    }
  }, [isFirstSlide]);


  const calcularEdad = (dia: number, mes: number, anio: number): number => {
    const fechaNacimiento = new Date(anio, mes - 1, dia);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const m = hoy.getMonth() - fechaNacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  const SaveProfile = async () => {
    try {
      if (!username || !telefono || !dia || !mes || !anio || !genero) {
        throw new Error("Faltan campos obligatorios");
      }

      const isUsernameValid = await validateUsername(username);
      if (!isUsernameValid) {
        throw new Error("Nombre de usuario inválido");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No se encontró el ID de usuario autenticado");
      }

      const fechaNacimiento = new Date(anio, mes - 1, dia);
      const edad = calcularEdad(dia, mes, anio);

      const perfilData = {
        usuario_id: user.id,
        username,
        fecha_nacimiento: fechaNacimiento.toISOString(),
        biografia: descripcion || null,
        foto_perfil: profileImage || null,
        edad,
        sexo: genero,
        ubicacion: location?.ubicacion || null,
        latitud: location ? location.coords.latitude : null,
        longitud: location ? location.coords.longitude : null,
        numtelefono: telefono || null,
      };

      const { data, error } = await supabase
        .from("perfil")
        .upsert(perfilData)
        .select();

      if (error) {
        throw error;
      }

      // Insertar habilidades
      for (const habilidad of habilidadesMusicalesSeleccionadas) {
        await supabase
          .from("perfil_habilidad")
          .upsert({ perfil_id: user.id, habilidad });
      }

      // Insertar géneros
      for (const genero of generosMusicalesSeleccionados) {
        await supabase
          .from("perfil_genero")
          .upsert({ perfil_id: user.id, genero });
      }

      Alert.alert("Perfil guardado exitosamente");
      router.replace("/(root)/(tabs)/home");
    } catch (error) {
      console.error("Error detallado al guardar el perfil:", error);
      Alert.alert("Error al guardar el perfil", error instanceof Error ? error.message : "Hubo un problema al guardar la información");
    }
  };

  const dias = Array.from({length: 31}, (_, i) => ({label: `${i + 1}`, value: i + 1}));
  const meses = [
    {label: "Enero", value: 1}, {label: "Febrero", value: 2}, {label: "Marzo", value: 3},
    {label: "Abril", value: 4}, {label: "Mayo", value: 5}, {label: "Junio", value: 6},
    {label: "Julio", value: 7}, {label: "Agosto", value: 8}, {label: "Septiembre", value: 9},
    {label: "Octubre", value: 10}, {label: "Noviembre", value: 11}, {label: "Diciembre", value: 12}
  ];
  const anios = Array.from({length: 100}, (_, i) => ({label: `${2023 - i}`, value: 2023 - i}));

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1">
            <View className="relative w-full h-[100px] mt-10 flex items-center justify-center">
              <Image source={images.FeatLogo} className="z-0 w-[180px] h-[100px]" />
            </View>
            <Swiper
              ref={swiperRef}
              loop={false}
              scrollEnabled={false}
              dot={<View className="w-[32px] h-[4px] mx-1 bg-primary-300 rounded-full" />}
              activeDot={<View className="w-[32px] h-[4px] mx-1 bg-primary-700 rounded-full" />}
              index={activeIndex}
              onIndexChanged={setActiveIndex}
              showsPagination={true}
              paginationStyle={{ top: 10, bottom: undefined }}
              style={{ height: height - 250 }}
            >
              {/* Slide 1 - Username y Teléfono */}
              <View className="flex-1 justify-center items-center mb-10 p-4">
                <Text className="text-2xl text-primary-700 font-JakartaBold mb-6">Ingresa tu información</Text>
                <TextInput
                  className="border-2 rounded-full bg-primary-200 border-primary-500 p-4 w-full mb-4"
                  placeholder="Tu nombre artístico (username)"
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    validateUsername(text);
                  }}
                />
                {usernameError ? (
                  <Text className="text-danger-600 mt-2 mb-4">{usernameError}</Text>
                ) : null}
                <TextInput
                  className="border-2 rounded-full bg-primary-200 border-primary-500 p-4 w-full mb-4"
                  placeholder="Número de teléfono"
                  value={telefono}
                  onChangeText={setTelefono}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
                <View className="mb-3 mt-4"><FontAwesome name="user-circle" size={80} color="#6D29D2" /></View>
              </View>

              {/* Slide 2 - Género */}
              <View className="flex-1 justify-center items-center mb-10 p-4">
                <View className="mb-3"><FontAwesome name="intersex" size={80} color="#00BFA5" /></View>
                <Text className="text-2xl text-primary-700 font-JakartaBold mb-5">
                  Selecciona tu género
                </Text>
                <View className="flex flex-row mb-20">
                  <TouchableOpacity
                    className={`p-4 mx-1 border-2 rounded-full ${
                      genero === "Masculino" ? "bg-primary-500 border-primary-700" : "bg-primary-200 border-primary-400"
                    }`}
                    onPress={() => setGenero("Masculino")}
                  >
                    <Text
                      className={`${
                        genero === "Masculino" ? "text-white" : "text-primary-700"
                      } font-JakartaSemiBold`}
                    >
                      Masculino
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`p-4 mx-2 border-2 rounded-full ${
                      genero === "Femenino" ? "bg-secondary-500 border-secondary-700" : "bg-primary-200 border-primary-400"
                    }`}
                    onPress={() => setGenero("Femenino")}
                  >
                    <Text
                      className={`${
                        genero === "Femenino" ? "text-white" : "text-secondary-700"
                      } font-JakartaSemiBold`}
                    >
                      Femenino
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`p-4 mx-2 border-2 rounded-full ${
                      genero === "Otro" ? "bg-general-200 border-general-400" : "bg-primary-200 border-primary-400"
                    }`}
                    onPress={() => setGenero("Otro")}
                  >
                    <Text
                      className={`${
                        genero === "Otro" ? "text-white" : "text-general-800"
                      } font-JakartaSemiBold`}
                    >
                      Otro
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Slide 3 - Fecha de Nacimiento */}
              <View className="flex-1 justify-center items-center bg-white p-4">
                <View className="mb-4"><FontAwesome name="birthday-cake" size={60} color="#6D29D2" /></View>
                <Text className="text-2xl text-primary-700 font-JakartaBold mb-4">Fecha de Nacimiento</Text>
                <View className="flex-row justify-between w-full mb-36">
                  <View className="w-1/4">
                    <DropDownPicker
                      open={diaOpen}
                      value={dia}
                      items={dias}
                      setOpen={setDiaOpen}
                      setValue={setDia}
                      placeholder="Día"
                      zIndex={3000}
                      zIndexInverse={1000}
                      style={{backgroundColor: '#E6E1F1', borderColor: '#6D29D2'}}
                      textStyle={{fontFamily: 'Jakarta-Medium', color: '#4A148C'}}
                      dropDownContainerStyle={{backgroundColor: '#F3F0F8', borderColor: '#6D29D2'}}
                    />
                  </View>
                  <View className="w-2/5">
                    <DropDownPicker
                      open={mesOpen}
                      value={mes}
                      items={meses}
                      setOpen={setMesOpen}
                      setValue={setMes}
                      placeholder="Mes"
                      zIndex={2000}
                      zIndexInverse={2000}
                      style={{backgroundColor: '#E6E1F1', borderColor: '#6D29D2'}}
                      textStyle={{fontFamily: 'Jakarta-Medium', color: '#4A148C'}}
                      dropDownContainerStyle={{backgroundColor: '#F3F0F8', borderColor: '#6D29D2'}}
                    />
                  </View>
                  <View className="w-1/3">
                    <DropDownPicker
                      open={anioOpen}
                      value={anio}
                      items={anios}
                      setOpen={setAnioOpen}
                      setValue={setAnio}
                      placeholder="Año"
                      zIndex={1000}
                      zIndexInverse={3000}
                      style={{backgroundColor: '#E6E1F1', borderColor: '#6D29D2'}}
                      textStyle={{fontFamily: 'Jakarta-Medium', color: '#4A148C'}}
                      dropDownContainerStyle={{backgroundColor: '#F3F0F8', borderColor: '#6D29D2'}}
                    />
                  </View>
                </View>
              </View>

              {/* Slide 4 - Habilidades Musicales */}
              <View className="flex-1 justify-start items-center mt-8 p-4">
                <Text className="text-2xl text-primary-700 font-JakartaBold mb-6">
                  Selecciona tus habilidades musicales 
                </Text>
                {renderHabilidadesMusicales()}
                <View className="mt-5"><MaterialCommunityIcons name="music-clef-treble" size={60} color="#00BFA5" /></View>
              </View>

              {/* Slide 5 - Géneros musicales */}
              <View className="flex-1 justify-start items-center mt-8 p-4">
                <Text className="text-2xl text-primary-700 font-JakartaBold mb-6">
                  Selecciona tus 5 géneros musicales favoritos
                </Text>
                {renderGenerosMusicales()}
                <Ionicons name="musical-note" size={80} color="#6D29D2" />
              </View>

              {/* Slide 6 - Foto de perfil */}
              <View className="flex-1 justify-center items-center mb-32 pb-10 p-4">
                <Text className="text-2xl text-primary-700 font-JakartaBold mb-10">
                  Selecciona tu foto de perfil
                </Text>
                <TouchableOpacity
                  onPress={pickImage}
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

              {/* Slide 7 - Descripción */}
              <View className="flex-1 justify-center items-center mb-10 pb-10 p-4">
                <Text className="text-2xl text-primary-700 font-JakartaBold mb-6">
                  Agrega una descripción
                </Text>
                <View className="w-full">
                  <TextInput
                    className="border-2 rounded-lg border-primary-500 bg-primary-100 p-4 mt-4"
                    placeholder="Describe tu perfil musical (máximo 300 caracteres)"
                    value={descripcion}
                    onChangeText={(text) => setDescripcion(text.slice(0, 300))}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    maxLength={300}
                  />
                  <Text className="text-right text-primary-600 mt-2 font-JakartaMedium">
                    {descripcion.length}/300
                  </Text>
                </View>
                <Ionicons name="create" size={80} color="#6D29D2" />
              </View>

              {/* Slide 8 - Acceso a la Ubicación */}
              <View className="flex-1 justify-center items-center mb-10 pb-10 p-4">
                <Text className="text-2xl text-primary-700 font-JakartaBold mb-6">
                  ¿Deseas acceder a tu ubicación?
                </Text>
                <Text className="text-center text-primary-700 mt-4 px-4">
                  Al permitir el acceso a tu ubicación, podemos mejorar tu
                  experiencia en la aplicación.
                </Text>
                <TouchableOpacity
                  className="bg-primary-500 border-2 border-primary-700 p-3 mt-4 rounded-md"
                  onPress={requestLocationPermission}
                >
                  <Text className="text-white">Permitir ubicación</Text>
                </TouchableOpacity>
              </View>
            </Swiper>
          </View>
        </ScrollView>

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
              title={isLastSlide ? "Finalizar" : "Siguiente"}
              onPress={handleNext}
              style={{ width: isFirstSlide ? width - 32 : (width - 48) / 2 }}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}