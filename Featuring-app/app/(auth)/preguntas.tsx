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
import { phoneNumberMaxLength } from '@/utils/countryCodes';
import { checkPhoneNumberExists, checkUsernameExists } from '@/utils/profileUtils';

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

  const handleNext = async () => {
    if (isLastSlide) {
      if (validateAllFields()) {
        await saveProfile(state);
        router.replace("/(root)/(tabs)/home");
      } else {
        Alert.alert("Error", "Por favor, completa todos los campos antes de continuar.");
      }
    } else if (slideValidations[activeIndex]) {
      swiperRef.current?.scrollBy(1);
    } else {
      // Aquí podrías mostrar una alerta específica para cada slide si lo deseas
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
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
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
              style={{ height: height - 250 }}
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
              <SlideHabilidadesMusicales 
                state={state} 
                dispatch={dispatch} 
                onValidationComplete={(isValid) => updateSlideValidation(3, isValid)}
              />
              <SlideGenerosMusicales 
                state={state} 
                dispatch={dispatch} 
                onValidationComplete={(isValid) => updateSlideValidation(4, isValid)}
              />
              <SlideFotoPerfil 
                state={state} 
                dispatch={dispatch} 
                onValidationComplete={(isValid) => updateSlideValidation(5, isValid)}
              />
              <SlideDescripcion 
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
