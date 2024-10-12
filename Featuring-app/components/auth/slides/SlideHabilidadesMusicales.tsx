import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PreguntasState, PreguntasAction } from '@/types/preguntas';
import { habilidadesMusicalesCompletas } from '@/constants/musicData';

interface SlideHabilidadesMusicalesProps {
  state: PreguntasState;
  dispatch: React.Dispatch<PreguntasAction>;
}

export function SlideHabilidadesMusicales({ state, dispatch }: SlideHabilidadesMusicalesProps) {
  const { habilidadesMusicales } = state;

  const toggleHabilidadMusical = (habilidad: string) => {
    const updatedHabilidades = habilidadesMusicales.includes(habilidad)
      ? habilidadesMusicales.filter(item => item !== habilidad)
      : [...habilidadesMusicales, habilidad].slice(0, 5);
    dispatch({ type: 'SET_HABILIDADES_MUSICALES', payload: updatedHabilidades });
  };

  return (
    <View className="flex-1 justify-start items-center mt-8 p-4">
      <Text className="text-2xl text-primary-700 font-JakartaBold mb-6">
        Selecciona tus habilidades musicales
      </Text>
      <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-row flex-wrap justify-center">
          {habilidadesMusicalesCompletas.map((habilidad) => (
            <TouchableOpacity
              key={habilidad}
              onPress={() => toggleHabilidadMusical(habilidad)}
              className={`m-2 p-3 rounded-full ${
                habilidadesMusicales.includes(habilidad)
                  ? "bg-secondary-600"
                  : "bg-gray-200"
              }`}
            >
              <Text
                className={`text-center ${
                  habilidadesMusicales.includes(habilidad)
                    ? "text-white"
                    : "text-gray-800"
                }`}
              >
                {habilidad}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <View className="mt-5">
        <MaterialCommunityIcons name="music-clef-treble" size={60} color="#00BFA5" />
      </View>
    </View>
  );
}
