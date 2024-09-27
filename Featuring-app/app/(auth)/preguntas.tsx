import React, { useRef, useState, useCallback, useEffect } from 'react';
import { SafeAreaView, Text, TextInput, View, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Dimensions, ScrollView, Keyboard, Alert, Image } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Swiper from 'react-native-swiper';
import { useRouter } from 'expo-router';
import { images } from "@/constants";
import CustomButton from "@/components/CustomButton";
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const { height, width } = Dimensions.get('window');

export default function Preguntas() {
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
  const generosMusicales = ['Rock', 'Pop', 'Hip-hop', 'Jazz', 'Clásica', 'Reggaetón', 'Salsa', 'Blues', 'Country', 'Electrónica'];
  const tiposMusico = ['Cantante', 'Músico de Instrumento', 'Compositor', 'Productor'];
  const isLastSlide = activeIndex === 7;
  const isFirstSlide = activeIndex === 0;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

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

  const renderGenerosMusicales = useCallback(() => (
    <FlatList
      data={generosMusicales}
      numColumns={2}
      keyExtractor={(item) => item}
      renderItem={({ item }) => (
        <TouchableOpacity
          className={`p-2 m-2 border ${generosMusicalesSeleccionados.includes(item) ? 'bg-purple-500' : 'bg-gray-200'}`}
          onPress={() => toggleGeneroMusical(item)}
        >
          <Text className="text-black">{item}</Text>
        </TouchableOpacity>
      )}
    />
  ), [generosMusicalesSeleccionados, toggleGeneroMusical]);

  const renderTiposMusico = useCallback(() => (
    <FlatList
      data={tiposMusico}
      keyExtractor={(item) => item}
      renderItem={({ item }) => (
        <TouchableOpacity
          className={`p-2 m-2 border ${tipoMusico === item ? 'bg-purple-500' : 'bg-gray-200'}`}
          onPress={() => setTipoMusico(item)}
        >
          <Text className="text-black">{item}</Text>
        </TouchableOpacity>
      )}
    />
  ), [tipoMusico]);

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
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'No se puede acceder a la ubicación');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setLocation(location);
    Alert.alert('Ubicación obtenida', 'Gracias por compartir tu ubicación');
  };

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      console.log({ nombre, genero, fechaNacimiento, generosMusicalesSeleccionados, descripcion, redesSociales, profileImage, location });
      router.replace('/(auth)/sign-up');
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

  const handleBack = useCallback(() => {
    if (!isFirstSlide) {
      swiperRef.current?.scrollBy(-1);
    }
  }, [isFirstSlide]);

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
              {/* Slide 1 - Nombre */}
              <View className="flex-1 justify-center items-center mt-8">
                <Text className="text-lg font-bold">Ingresa tu nombre</Text>
                <TextInput
                  className="border p-3 w-3/4 mt-4"
                  placeholder="Tu nombre"
                  value={nombre}
                  onChangeText={setNombre}
                />
              </View>

              {/* Slide 2 - Género */}
              <View className="flex-1 justify-center items-center mt-8">
                <Text className="text-lg font-bold">Selecciona tu género</Text>
                <View className="flex flex-row mt-4">
                  <TouchableOpacity
                    className={`p-3 mx-2 border ${genero === 'Masculino' ? 'bg-purple-500' : 'bg-gray-200'}`}
                    onPress={() => setGenero('Masculino')}
                  >
                    <Text className="text-black">Masculino</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`p-3 mx-2 border ${genero === 'Femenino' ? 'bg-purple-500' : 'bg-gray-200'}`}
                    onPress={() => setGenero('Femenino')}
                  >
                    <Text className="text-black">Femenino</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`p-3 mx-2 border ${genero === 'Otro' ? 'bg-purple-500' : 'bg-gray-200'}`}
                    onPress={() => setGenero('Otro')}
                  >
                    <Text className="text-black">Otro</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Slide 3 - Fecha de Nacimiento */}
              <View className="flex-1 justify-center items-center mt-8">
                <Text className="text-lg font-bold">Selecciona tu fecha de nacimiento</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} className="border p-3 mt-4">
                  <Text className="text-black">{fechaNacimiento.toLocaleDateString()}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={fechaNacimiento}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      if (date) {
                        setFechaNacimiento(date);
                      }
                      setShowDatePicker(false);
                    }}
                  />
                )}
              </View>

              {/* Slide 4 - Tipo de Músico */}
              <View className="flex-1 justify-center items-center mt-8">
                <Text className="text-lg font-bold">Selecciona tu tipo de músico</Text>
                <View className="mt-4 flex-1">{renderTiposMusico()}</View>
              </View>

              {/* Slide 5 - Géneros musicales */}
              <View className="flex-1 justify-center items-center mt-8">
                <Text className="text-lg font-bold">Selecciona tus 5 géneros musicales favoritos</Text>
                <View className="mt-4 flex-1">{renderGenerosMusicales()}</View>
              </View>

              {/* Slide 6 - Foto de perfil */}
              <View className="flex-1 justify-center items-center mt-8">
                <Text className="text-lg font-bold">Selecciona tu foto de perfil</Text>
                <TouchableOpacity onPress={pickImage} className="mt-4">
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
              <View className="flex-1 justify-center items-center mt-8">
                <Text className="text-lg font-bold">Descripción y Redes Sociales</Text>
                <TextInput
                  className="border p-3 w-3/4 mt-4"
                  placeholder="Descripción"
                  value={descripcion}
                  onChangeText={setDescripcion}
                  multiline
                />
                <TextInput
                  className="border p-3 w-3/4 mt-4"
                  placeholder="Redes Sociales (ej: Instagram, Twitter)"
                  value={redesSociales}
                  onChangeText={setRedesSociales}
                />
              </View>

              {/* Slide 8 - Acceso a la Ubicación */}
              <View className="flex-1 justify-center items-center mt-8">
                <Text className="text-lg font-bold">¿Deseas acceder a tu ubicación?</Text>
                <Text className="text-center mt-4 px-4">
                  Al permitir el acceso a tu ubicación, podemos mejorar tu experiencia en la aplicación.
                </Text>
                <TouchableOpacity 
                  className="bg-purple-500 p-3 mt-4 rounded-md"
                  onPress={requestLocationPermission}
                >
                  <Text className="text-white">Permitir ubicación</Text>
                </TouchableOpacity>
              </View>
            </Swiper>
          </View>
        </ScrollView>

        {/* Botones para navegar */}
        {!keyboardVisible && (
          <View className="w-full absolute bottom-10 flex flex-row justify-between items-center px-4">
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