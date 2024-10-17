import React, { useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PreguntasState, PreguntasAction } from '@/types/preguntas';

interface SlideDescripcionProps {
  state: PreguntasState;
  dispatch: React.Dispatch<PreguntasAction>;
  onValidationComplete: (isValid: boolean) => void;
}

export function SlideDescripcion({ state, dispatch, onValidationComplete }: SlideDescripcionProps) {
  const { descripcion } = state;

  useEffect(() => {
    onValidationComplete(true); // Siempre es válido, ya que la descripción es opcional
  }, []);

  return (
    <View className="flex-1 justify-center items-center mb-10 pb-10 p-4">
      <Text className="text-2xl text-primary-700 font-JakartaBold mb-6">
        Agrega una descripción
      </Text>
      <View className="w-full">
        <TextInput
          className="border-2 rounded-lg border-primary-500 bg-primary-100 p-4 mt-4"
          placeholder="Describe tu perfil musical (máximo 300 caracteres)"
          value={descripcion}
          onChangeText={(text) => dispatch({ type: 'SET_DESCRIPCION', payload: text.slice(0, 300) })}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          maxLength={300}
        />
        <Text className="text-right text-primary-600 mt-2 font-JakartaMedium">
          {descripcion.length}/300
        </Text>
      </View>
      <Ionicons name="create" size={80} color="#6D29D2" />
    </View>
  );
}
