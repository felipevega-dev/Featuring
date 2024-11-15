import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { PreguntasState, PreguntasAction } from '@/types/preguntas';

interface SlideGeneroProps {
  state: PreguntasState;
  dispatch: React.Dispatch<PreguntasAction>;
  onValidationComplete: (isValid: boolean) => void;
}

export function SlideGenero({ state, dispatch, onValidationComplete }: SlideGeneroProps) {
  const { genero } = state;

  useEffect(() => {
    onValidationComplete(!!genero);
  }, [genero]);

  const handleGeneroSelect = (selectedGenero: string) => {
    dispatch({ type: 'SET_GENERO', payload: selectedGenero });
    onValidationComplete(true);
  };

  return (
    <View className="flex-1 justify-center items-center px-4 py-6 sm:py-8 md:py-10 mb-14">
      <View className="mb-4 sm:mb-6 md:mb-8">
        <FontAwesome name="intersex" size={60} color="#00BFA5" />
      </View>
      <Text className="text-xl sm:text-2xl md:text-3xl text-primary-700 font-JakartaBold mb-6 sm:mb-8 md:mb-10">
        Selecciona tu género
      </Text>
      <View className="flex flex-row justify-center w-full">
        <TouchableOpacity
          className={`px-4 py-3 sm:px-6 sm:py-4 mx-1 sm:mx-2 border-2 rounded-full ${
            genero === "Masculino"
              ? "bg-primary-500 border-primary-700"
              : "bg-primary-200 border-primary-400"
          }`}
          onPress={() => handleGeneroSelect("Masculino")}
        >
          <Text
            className={`${
              genero === "Masculino"
                ? "text-white"
                : "text-primary-700"
            } font-JakartaSemiBold text-sm sm:text-base`}
          >
            Masculino
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`px-4 py-3 sm:px-6 sm:py-4 mx-1 sm:mx-2 border-2 rounded-full ${
            genero === "Femenino"
              ? "bg-secondary-500 border-secondary-700"
              : "bg-primary-200 border-primary-400"
          }`}
          onPress={() => handleGeneroSelect("Femenino")}
        >
          <Text
            className={`${
              genero === "Femenino"
                ? "text-white"
                : "text-secondary-700"
            } font-JakartaSemiBold text-sm sm:text-base`}
          >
            Femenino
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`px-4 py-3 sm:px-6 sm:py-4 mx-1 sm:mx-2 border-2 rounded-full ${
            genero === "Otro"
              ? "bg-general-200 border-general-400"
              : "bg-primary-200 border-primary-400"
          }`}
          onPress={() => handleGeneroSelect("Otro")}
        >
          <Text
            className={`${
              genero === "Otro" ? "text-white" : "text-general-800"
            } font-JakartaSemiBold text-sm sm:text-base`}
          >
            Otro
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
