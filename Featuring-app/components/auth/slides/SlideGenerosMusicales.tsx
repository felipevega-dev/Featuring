import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PreguntasState, PreguntasAction } from '@/types/preguntas';
import { generosMusicalesCompletos } from '@/constants/musicData';

interface SlideGenerosMusicalesProps {
  state: PreguntasState;
  dispatch: React.Dispatch<PreguntasAction>;
}

export function SlideGenerosMusicales({ state, dispatch }: SlideGenerosMusicalesProps) {
  const { generosMusicales } = state;

  const toggleGeneroMusical = (genero: string) => {
    const updatedGeneros = generosMusicales.includes(genero)
      ? generosMusicales.filter(item => item !== genero)
      : [...generosMusicales, genero].slice(0, 5);
    dispatch({ type: 'SET_GENEROS_MUSICALES', payload: updatedGeneros });
  };

  return (
    <View className="flex-1 justify-start items-center mt-8 p-4">
      <Text className="text-2xl text-primary-700 font-JakartaBold mb-6">
        Selecciona tus 5 géneros musicales favoritos
      </Text>
      <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-row flex-wrap justify-center">
          {generosMusicalesCompletos.map((genero) => (
            <TouchableOpacity
              key={genero}
              onPress={() => toggleGeneroMusical(genero)}
              className={`m-2 p-3 rounded-full ${
                generosMusicales.includes(genero)
                  ? "bg-secondary-600"
                  : "bg-gray-200"
              }`}
            >
              <Text
                className={`text-center ${
                  generosMusicales.includes(genero)
                    ? "text-white"
                    : "text-gray-800"
                }`}
              >
                {genero}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <Ionicons name="musical-note" size={80} color="#6D29D2" />
    </View>
  );
}
