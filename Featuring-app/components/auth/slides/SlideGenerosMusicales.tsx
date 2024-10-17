import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      {generosMusicales.length === 0 && (
        <Text className="text-danger-600 mt-2">
          Por favor, selecciona al menos un género musical.
        </Text>
      )}
      <Ionicons name="musical-note" size={80} color="#6D29D2" />
    </View>
  );
}
