import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { PreguntasState, PreguntasAction } from '@/types/preguntas';

interface SlideGeneroProps {
  state: PreguntasState;
  dispatch: React.Dispatch<PreguntasAction>;
}

export function SlideGenero({ state, dispatch }: SlideGeneroProps) {
  const { genero } = state;

  return (
    <View className="flex-1 justify-center items-center mb-10 p-4">
      <View className="mb-3">
        <FontAwesome name="intersex" size={80} color="#00BFA5" />
      </View>
      <Text className="text-2xl text-primary-700 font-JakartaBold mb-5">
        Selecciona tu género
      </Text>
      <View className="flex flex-row mb-20">
        <TouchableOpacity
          className={`p-4 mx-1 border-2 rounded-full ${
            genero === "Masculino"
              ? "bg-primary-500 border-primary-700"
              : "bg-primary-200 border-primary-400"
          }`}
          onPress={() => dispatch({ type: 'SET_GENERO', payload: "Masculino" })}
        >
          <Text
            className={`${
              genero === "Masculino"
                ? "text-white"
                : "text-primary-700"
            } font-JakartaSemiBold`}
          >
            Masculino
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`p-4 mx-2 border-2 rounded-full ${
            genero === "Femenino"
              ? "bg-secondary-500 border-secondary-700"
              : "bg-primary-200 border-primary-400"
          }`}
          onPress={() => dispatch({ type: 'SET_GENERO', payload: "Femenino" })}
        >
          <Text
            className={`${
              genero === "Femenino"
                ? "text-white"
                : "text-secondary-700"
            } font-JakartaSemiBold`}
          >
            Femenino
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`p-4 mx-2 border-2 rounded-full ${
            genero === "Otro"
              ? "bg-general-200 border-general-400"
              : "bg-primary-200 border-primary-400"
          }`}
          onPress={() => dispatch({ type: 'SET_GENERO', payload: "Otro" })}
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
  );
}
