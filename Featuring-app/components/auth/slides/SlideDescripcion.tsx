import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PreguntasState, PreguntasAction } from '@/types/preguntas';

interface SlideDescripcionProps {
  state: PreguntasState;
  dispatch: React.Dispatch<PreguntasAction>;
  onValidationComplete: (isValid: boolean) => void;
}

export function SlideDescripcion({ state, dispatch, onValidationComplete }: SlideDescripcionProps) {
  const { descripcion } = state;
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    onValidationComplete(true);
  }, []);

  const handleDescripcionChange = (text: string) => {
    if (text.length <= 300) {
      dispatch({ type: 'SET_DESCRIPCION', payload: text });
      setCharCount(text.length);
    }
  };

  return (
    <View className="flex-1 justify-start items-center px-4 py-6 sm:py-8 md:py-10 mt-20">
      <View className="mb-4 sm:mb-6 md:mb-8">
        <Ionicons name="create-outline" size={60} color="#6D29D2" />
      </View>
      <Text className="text-xl sm:text-2xl md:text-3xl text-primary-700 font-JakartaBold mb-4 sm:mb-6 md:mb-8 text-center">
        Agrega una descripción
      </Text>
      <View className="w-full mb-4">
        <TextInput
          className="border-2 rounded-lg border-primary-500 bg-primary-100 p-4 text-base sm:text-lg font-JakartaMedium text-primary-700"
          placeholder="Describe tu perfil musical (máximo 300 caracteres)"
          value={descripcion}
          onChangeText={handleDescripcionChange}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={300}
        />
        <Text className="text-right text-primary-600 mt-2 font-JakartaMedium text-sm sm:text-base">
          {charCount}/300
        </Text>
      </View>
    </View>
  );
}
