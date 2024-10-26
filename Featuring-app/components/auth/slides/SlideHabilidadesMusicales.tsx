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
    <View className="flex-1 justify-start items-center px-4 py-6 sm:py-8 md:py-10 mb-14">
      <View className="mb-2 sm:mb-6 md:mb-8 mt-2">
        <MaterialCommunityIcons name="music-clef-treble" size={50} color="#00BFA5" />
      </View>
      <Text className="text-xl sm:text-2xl md:text-3xl text-primary-700 font-JakartaBold mb-2 sm:mb-6 md:mb-8 text-center">
        Selecciona tus habilidades musicales
      </Text>
      <ScrollView 
        className="w-full" 
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={true}
      >
        <View className="flex-row flex-wrap justify-center">
          {habilidadesMusicalesCompletas.map((habilidad) => (
            <TouchableOpacity
              key={habilidad}
              onPress={() => toggleHabilidadMusical(habilidad)}
              className={`m-1 sm:m-2 p-2 sm:p-3 rounded-full ${
                habilidadesMusicales.includes(habilidad)
                  ? "bg-secondary-700"
                  : "bg-primary-200"
              }`}
            >
              <Text
                className={`text-center text-sm sm:text-base ${
                  habilidadesMusicales.includes(habilidad)
                    ? "text-white"
                    : "text-primary-700"
                } font-JakartaMedium`}
              >
                {habilidad}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {habilidadesMusicales.length === 0 ? (
        <Text className="text-danger-600 mt-2 text-sm sm:text-base text-center">
          Por favor, selecciona al menos una habilidad musical.
        </Text>
      ) : (
        <>
          <Text className="text-primary-600 mb-2 mt-1 text-sm sm:text-base text-center font-JakartaBold">
            Seleccionadas: {habilidadesMusicales.length}/5
          </Text>
          <View 
            className="w-full"
          >
            <View className="flex-row flex-wrap justify-center">
              {habilidadesMusicales.map((habilidad, index) => (
                <View 
                  key={habilidad} 
                  className="bg-secondary-500 rounded-full py-1 px-1 mr-1 mb-2"
                >
                  <Text className="text-white text-sm font-JakartaMedium">
                    {habilidad}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}
    </View> 
  );
}
