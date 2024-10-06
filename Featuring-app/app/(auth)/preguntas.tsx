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

const { height, width } = Dimensions.get("window");

export default function Preguntas() {
  const swiperRef = useRef<Swiper>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState<"generos" | "habilidades">("generos");

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

  const [habilidadesMusicales, setHabilidadesMusicales] = useState([
    "Canto", "Guitarra", "Piano", "Batería", "Bajo", "Violín", "Saxofón", "Trompeta",
    "Flauta", "Ukulele", "DJ", "Producción", "Composición", "Arreglos"
  ]);
  const [habilidadesMusicalesSeleccionadas, setHabilidadesMusicalesSeleccionadas] = useState<string[]>([]);

  const [generosMusicales, setGenerosMusicales] = useState([
    "Pop", "Rock", "Hip Hop", "R&B", "Jazz", "Clásica", "Electrónica", "Reggaeton",
    "Country", "Folk", "Blues", "Metal", "Punk", "Indie", "Salsa", "Reggae"
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
    <View className="flex-row flex-wrap justify-center">
      {habilidadesMusicales.map((habilidad) => (
        <TouchableOpacity
          key={habilidad}
          onPress={() => toggleHabilidadMusical(habilidad)}
          className={`m-2 p-3 rounded-full ${
            habilidadesMusicalesSeleccionadas.includes(habilidad)
              ? "bg-blue-500"
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
  ), [habilidadesMusicalesSeleccionadas, toggleHabilidadMusical]);

  const renderGenerosMusicales = useCallback(() => (
    <View className="flex-row flex-wrap justify-center">
      {generosMusicales.map((genero) => (
        <TouchableOpacity
          key={genero}
          onPress={() => toggleGeneroMusical(genero)}
          className={`m-2 p-3 rounded-full ${
            generosMusicalesSeleccionados.includes(genero)
              ? "bg-blue-500"
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

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      SaveProfile();
    } else {
      swiperRef.current?.scrollBy(1);
    }
  }, [isLastSlide, activeIndex, username, telefono, genero, habilidadesMusicalesSeleccionadas, generosMusicalesSeleccionados, descripcion, profileImage, location]);

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

  const openModal = (content: "generos" | "habilidades") => {
    setModalContent(content);
    setModalVisible(true);
  };

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
              dot={<View className="w-[32px] h-[4px] mx-1 bg-[#E2E8F0] rounded-full" />}
              activeDot={<View className="w-[32px] h-[4px] mx-1 bg-[#6D29D2] rounded-full" />}
              index={activeIndex}
              onIndexChanged={setActiveIndex}
              showsPagination={true}
              paginationStyle={{ top: 10, bottom: undefined }}
              style={{ height: height - 250 }}
            >
              {/* Slide 1 - Username y Teléfono */}
              <View className="flex-1 justify-center items-center mb-10">
                <Text className="text-lg text-blue-500 font-bold mb-4">Ingresa tu información</Text>
                <TextInput
                  className="border-1 rounded-full bg-blue-200 border-blue-500 p-3 w-3/4 mb-4"
                  placeholder="Tu nombre artístico (username)"
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    validateUsername(text);
                  }}
                />
                {usernameError ? (
                  <Text className="text-red-500 mt-2">{usernameError}</Text>
                ) : null}
                <TextInput
                  className="border-1 rounded-full bg-blue-200 border-blue-500 p-3 w-3/4 mb-4"
                  placeholder="Número de teléfono"
                  value={telefono}
                  onChangeText={setTelefono}
                  keyboardType="phone-pad"
                />
                <Image
                  source={images.IconoMusical}
                  className="w-4/5 h-24 mb-10 mt-10"
                  resizeMode="contain"
                />
              </View>

              {/* Slide 2 - Género */}
              <View className="flex-1 justify-center items-center mb-10">
                <Text className="text-lg text-blue-500 font-bold mb-5">
                  Selecciona tu género
                </Text>
                <View className="flex flex-row mb-10">
                  <TouchableOpacity
                    className={`p-3 mx-2 border-1 rounded-full ${
                      genero === "Masculino" ? "bg-blue-500" : "bg-gray-200 "
                    }`}
                    onPress={() => setGenero("Masculino")}
                  >
                    <Text
                      className={`${
                        genero === "Masculino" ? "text-white" : "text-blue-500"
                      } font-semibold`}
                    >
                      Masculino
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`p-3 mx-2 border-1 rounded-full ${
                      genero === "Femenino" ? "bg-pink-500" : "bg-gray-200"
                    }`}
                    onPress={() => setGenero("Femenino")}
                  >
                    <Text
                      className={`${
                        genero === "Femenino" ? "text-white" : "text-pink-500"
                      } font-semibold`}
                    >
                      Femenino
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`p-3 mx-2 border-1 rounded-full ${
                      genero === "Otro" ? "bg-gray-500 " : "bg-gray-200"
                    }`}
                    onPress={() => setGenero("Otro")}
                  >
                    <Text
                      className={`${
                        genero === "Otro" ? "text-white" : "text-gray-500"
                      } font-semibold`}
                    >
                      Otro
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

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
                      placeholder="Día"
                      zIndex={3000}
                      zIndexInverse={1000}
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
                    />
                  </View>
                </View>
                <Image
                  source={images.IconoMusical}
                  className="w-5/5 h-24 mb-10 mt-10"
                  resizeMode="contain"
                />
              </View>

              {/* Slide 4 - Habilidades Musicales */}
              <View className="flex-1 justify-start items-center mt-8">
                <Text className="text-lg text-blue-500 font-bold mb-4">
                  Selecciona tus habilidades musicales
                </Text>
                {renderHabilidadesMusicales()}
                <TouchableOpacity
                  onPress={() => openModal("habilidades")}
                  className="mt-4 p-2 bg-purple-500 rounded-full"
                >
                  <Text className="text-white text-center">Ver más</Text>
                </TouchableOpacity>
              </View>

              {/* Slide 5 - Géneros musicales */}
              <View className="flex-1 justify-start items-center mt-8">
                <Text className="text-lg text-blue-500 font-bold mb-4">
                  Selecciona tus 5 géneros musicales favoritos
                </Text>
                {renderGenerosMusicales()}
                <TouchableOpacity
                  onPress={() => openModal("generos")}
                  className="mt-4 p-2 bg-purple-500 rounded-full"
                >
                  <Text className="text-white text-center">Ver más</Text>
                </TouchableOpacity>
              </View>

              {/* Slide 6 - Foto de perfil */}
              <View className="flex-1 justify-center items-center mb-10 pb-10">
                <Text className="text-lg text-blue-500 font-bold">
                  Selecciona tu foto de perfil
                </Text>
                <TouchableOpacity
                  onPress={pickImage}
                  className="mt-4 rounded-lg border-2 border-blue-500 p-3"
                >
                  {profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      style={{ width: 200, height: 200, borderRadius: 100 }}
                    />
                  ) : (
                    <View className="w-[200px] h-[200px] bg-gray-300 rounded-full flex items-center justify-center">
                      <Text className="text-gray-600">
                        Toca para seleccionar
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Slide 7 - Descripción */}
              <View className="flex-1 justify-center items-center mb-10 pb-10">
                <Text className="text-lg text-blue-500 font-bold ">
                  Agrega una descripción
                </Text>
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
              </View>

              {/* Slide 8 - Acceso a la Ubicación */}
              <View className="flex-1 justify-center items-center mb-10 pb-10">
                <Text className="text-lg text-blue-500 font-bold">
                  ¿Deseas acceder a tu ubicación?
                </Text>
                <Text className="text-center text-blue-500 mt-4 px-4">
                  Al permitir el acceso a tu ubicación, podemos mejorar tu
                  experiencia en la aplicación.
                </Text>
                <TouchableOpacity
                  className="bg-purple-500 border-2 border-purple-700 p-3 mt-4 rounded-md"
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

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white p-5 rounded-lg w-5/6 max-h-5/6">
            <Text className="text-lg text-blue-500 font-bold mb-4">
              {modalContent === "generos"
                ? "Todos los géneros musicales"
                : "Todas las habilidades musicales"}
            </Text>
            <ScrollView>
              {modalContent === "generos"
                ? renderGenerosMusicales()
                : renderHabilidadesMusicales()}
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
    </SafeAreaView>
  );
}