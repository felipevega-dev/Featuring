import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PreguntasState, PreguntasAction } from '@/types/preguntas';
import { generosMusicalesCompletos } from '@/constants/musicData';

interface SlideGenerosMusicalesProps {
  state: PreguntasState;
  dispatch: React.Dispatch<PreguntasAction>;
  onValidationComplete: (isValid: boolean) => void;
}

export function SlideGenerosMusicales({ state, dispatch, onValidationComplete }: SlideGenerosMusicalesProps) {
  const { generosMusicales } = state;

  useEffect(() => {
    onValidationComplete(generosMusicales.length > 0);
  }, [generosMusicales]);

  const toggleGeneroMusical = (genero: string) => {
    let updatedGeneros;
    if (generosMusicales.includes(genero)) {
      updatedGeneros = generosMusicales.filter(item => item !== genero);
    } else {
      if (generosMusicales.length >= 5) {
        Alert.alert("Límite alcanzado", "Puedes seleccionar un máximo de 5 géneros musicales.");
        return;
      }
      updatedGeneros = [...generosMusicales, genero];
    }
    dispatch({ type: 'SET_GENEROS_MUSICALES', payload: updatedGeneros });
  };

  return (
    <View className="flex-1 justify-start items-center px-4 py-6 sm:py-8 md:py-10 mb-14">
      <View className="mb-2 sm:mb-6 md:mb-8 mt-2">
        <MaterialCommunityIcons name="music-clef-treble" size={50} color="#6D29D2" />
      </View>
      <Text className="text-xl sm:text-2xl md:text-3xl text-primary-700 font-JakartaBold mb-2 sm:mb-6 md:mb-8 text-center">
        Selecciona tus géneros musicales favoritos
      </Text>
      <ScrollView 
        className="w-full" 
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={true}
      >
        <View className="flex-row flex-wrap justify-center">
          {generosMusicalesCompletos.map((genero) => (
            <TouchableOpacity
              key={genero}
              onPress={() => toggleGeneroMusical(genero)}
              className={`m-1 sm:m-2 p-2 sm:p-3 rounded-full ${
                generosMusicales.includes(genero)
                  ? "bg-primary-700"
                  : "bg-primary-200"
              }`}
            >
              <Text
                className={`text-center text-sm sm:text-base ${
                  generosMusicales.includes(genero)
                    ? "text-white"
                    : "text-primary-700"
                } font-JakartaMedium`}
              >
                {genero}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      {generosMusicales.length === 0 ? (
        <Text className="text-danger-600 mt-2 text-sm sm:text-base text-center">
          Por favor, selecciona al menos una habilidad musical.
        </Text>
      ) : (
        <>
          <Text className="text-secondary-600 mb-2 mt-1 text-sm sm:text-base text-center font-JakartaBold">
            Seleccionadas: {generosMusicales.length}/5
          </Text>
          <View 
            className="w-full"
          >
            <View className="flex-row flex-wrap justify-center">
              {generosMusicales.map((genero, index) => (
                <View 
                  key={genero} 
                  className="bg-primary-500 rounded-full py-1 px-1 mr-1 mb-2"
                >
                  <Text className="text-white text-sm font-JakartaMedium">
                    {genero}
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
