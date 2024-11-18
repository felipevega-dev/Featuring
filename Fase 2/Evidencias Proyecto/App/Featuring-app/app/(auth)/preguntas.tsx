import React, { useRef, useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Image,
  Alert,
} from "react-native";
import Swiper from "react-native-swiper";
import { router } from "expo-router";
import { images } from "@/constants";
import CustomButton from "@/components/CustomButton";
import { useKeyboardVisibility } from "@/hooks/useKeyboardVisibility";
import { usePreguntasState } from "@/hooks/usePreguntasState";
import { saveProfile } from "@/utils/profileUtils";
import {
  SlideUsername,
  SlideGenero,
  SlideFechaNacimiento,
  SlideHabilidadesMusicales,
  SlideGenerosMusicales,
  SlideFotoPerfil,
  SlideDescripcion,
  SlideUbicacion,
} from "@/components/auth/slides";
import { checkPhoneNumberExists, checkUsernameExists } from '@/utils/profileUtils';
import { supabase } from "@/lib/supabase";

const { width, height } = Dimensions.get("window");

export default function Preguntas() {
  const swiperRef = useRef<Swiper>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const keyboardVisible = useKeyboardVisibility();
  const { state, dispatch } = usePreguntasState();
  const [slideValidations, setSlideValidations] = useState<boolean[]>(new Array(8).fill(false));

  const isFirstSlide = activeIndex === 0;
  const isLastSlide = activeIndex === 7;

  const updateSlideValidation = (index: number, isValid: boolean) => {
    setSlideValidations(prev => {
      const newValidations = [...prev];
      newValidations[index] = isValid;
      return newValidations;
    });
  };

  const uploadProfileImage = async (imageUri: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No se encontró el usuario");

      const fileExt = imageUri.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('fotoperfil')
        .upload(filePath, {
          uri: imageUri,
          name: fileName,
          type: `image/${fileExt}`,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Devolvemos solo el path relativo, no la URL completa
      return filePath;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleNext = async () => {
    if (isLastSlide) {
      if (validateAllFields()) {
        try {
          let profileImagePath = state.profileImage;
          if (profileImagePath && profileImagePath.startsWith('file://')) {
            // Si la imagen es local, súbela al storage
            profileImagePath = await uploadProfileImage(profileImagePath);
          }

          // Actualiza el estado con el nuevo path de la imagen
          dispatch({ type: 'SET_PROFILE_IMAGE', payload: profileImagePath });

          // Guarda el perfil con el nuevo path de la imagen
          await saveProfile({ ...state, profileImage: profileImagePath });
          router.replace("/(root)/(tabs)/home");
        } catch (error) {
          console.error("Error al guardar el perfil:", error);
          Alert.alert("Error", "Hubo un problema al guardar tu perfil. Por favor, inténtalo de nuevo.");
        }
      } else {
        Alert.alert("Campos incompletos", "Por favor, completa todos los campos antes de continuar.");
      }
    } else if (slideValidations[activeIndex]) {
      if (activeIndex === 0) {
        // Validación adicional para el primer slide (username y teléfono)
        const usernameExists = await checkUsernameExists(state.username);
        const phoneExists = await checkPhoneNumberExists(state.telefono);
        
        if (usernameExists) {
          Alert.alert("Error", "Este nombre de usuario ya está en uso. Por favor, elige otro.");
          return;
        }
        if (phoneExists) {
          Alert.alert("Error", "Este número de teléfono ya está registrado. Por favor, usa otro.");
          return;
        }
      }
      swiperRef.current?.scrollBy(1);
    } else {
      const slideMessages = [
        "Por favor, ingresa un nombre de usuario y número de teléfono válidos.",
        "Selecciona tu género.",
        "Ingresa una fecha de nacimiento válida.",
        "Sube una foto de perfil.",
        "Escribe una breve descripción sobre ti.",
        "Selecciona al menos una habilidad musical.",
        "Elige al menos un género musical.",
        "Proporciona tu ubicación."
      ];
      Alert.alert("Información incompleta", slideMessages[activeIndex]);
    }
  };

  const validateAllFields = () => {
    return slideValidations.every(isValid => isValid);
  };

  const handleBack = () => {
    if (!isFirstSlide) {
      swiperRef.current?.scrollBy(-1);
    }
  };

  useEffect(() => {
    if (!state.nacionalidad) {
      dispatch({ type: 'SET_NACIONALIDAD', payload: 'Chile' });
    }
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
      
          <View className="flex-1">
            <View className="relative w-full h-[100px] mt-10 flex items-center justify-center">
              <Image
                source={images.FeatLogo}
                className="z-0 w-[180px] h-[100px]"
              />
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
              style={{ height: height - 120 }}
            >
              <SlideUsername 
                state={state} 
                dispatch={dispatch} 
                onValidationComplete={(isValid) => updateSlideValidation(0, isValid)}
              />
              <SlideGenero 
                state={state} 
                dispatch={dispatch} 
                onValidationComplete={(isValid) => updateSlideValidation(1, isValid)}
              />
              <SlideFechaNacimiento 
                state={state} 
                dispatch={dispatch} 
                onValidationComplete={(isValid) => updateSlideValidation(2, isValid)}
              />
              <SlideFotoPerfil 
                state={state} 
                dispatch={dispatch} 
                onValidationComplete={(isValid) => updateSlideValidation(3, isValid)}
              />
              <SlideDescripcion 
                state={state} 
                dispatch={dispatch} 
                onValidationComplete={(isValid) => updateSlideValidation(4, isValid)}
              />
              <SlideHabilidadesMusicales 
                state={state} 
                dispatch={dispatch} 
                onValidationComplete={(isValid) => updateSlideValidation(5, isValid)}
              />
              <SlideGenerosMusicales 
                state={state} 
                dispatch={dispatch} 
                onValidationComplete={(isValid) => updateSlideValidation(6, isValid)}
              />
              <SlideUbicacion 
                state={state} 
                dispatch={dispatch} 
                onValidationComplete={(isValid) => updateSlideValidation(7, isValid)}
              />
            </Swiper>
          </View>


        {!keyboardVisible && (
          <View className="w-full absolute bottom-2 flex flex-row justify-between items-center px-4">
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
