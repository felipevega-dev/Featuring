import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PreguntasState, PreguntasAction } from '@/types/preguntas';
import { habilidadesMusicalesCompletas } from '@/constants/musicData';

interface SlideHabilidadesMusicalesProps {
  state: PreguntasState;
  dispatch: React.Dispatch<PreguntasAction>;
  onValidationComplete: (isValid: boolean) => void;
}

export function SlideHabilidadesMusicales({ state, dispatch, onValidationComplete }: SlideHabilidadesMusicalesProps) {
  const { habilidadesMusicales } = state;

  useEffect(() => {
    onValidationComplete(habilidadesMusicales.length > 0);
  }, [habilidadesMusicales]);

  const toggleHabilidadMusical = (habilidad: string) => {
    let updatedHabilidades;
    if (habilidadesMusicales.includes(habilidad)) {
      updatedHabilidades = habilidadesMusicales.filter(item => item !== habilidad);
    } else {
      if (habilidadesMusicales.length >= 5) {
        Alert.alert("Límite alcanzado", "Puedes seleccionar un máximo de 5 habilidades musicales.");
        return;
      }
      updatedHabilidades = [...habilidadesMusicales, habilidad];
    }
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
      {habilidadesMusicales.length === 0 && (
        <Text className="text-danger-600 mt-2">
          Por favor, selecciona al menos una habilidad musical.
        </Text>
      )}
      <View className="mt-5">
        <MaterialCommunityIcons name="music-clef-treble" size={60} color="#00BFA5" />
      </View>
    </View>
  );
}
