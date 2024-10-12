import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useValidateUsername } from '@/hooks/useValidateUsername';
import { PreguntasState, PreguntasAction } from '@/types/preguntas';

interface SlideUsernameProps {
  state: PreguntasState;
  dispatch: React.Dispatch<PreguntasAction>;
}

export function SlideUsername({ state, dispatch }: SlideUsernameProps) {
  const { username, telefono } = state;
  const { usernameError, validateUsername } = useValidateUsername();

  return (
    <View className="flex-1 justify-center items-center mb-10 p-4">
      <Text className="text-2xl text-primary-700 font-JakartaBold mb-6">
        Ingresa tu información
      </Text>
      <TextInput
        className="border-2 rounded-full bg-primary-200 border-primary-500 p-4 w-full mb-4"
        placeholder="Tu nombre artístico (username)"
        value={username}
        onChangeText={(text) => {
          dispatch({ type: 'SET_USERNAME', payload: text });
          validateUsername(text);
        }}
      />
      {usernameError ? (
        <Text className="text-danger-600 mt-2 mb-4">{usernameError}</Text>
      ) : null}
      <TextInput
        className="border-2 rounded-full bg-primary-200 border-primary-500 p-4 w-full mb-4"
        placeholder="Número de teléfono"
        value={telefono}
        onChangeText={(text) => dispatch({ type: 'SET_TELEFONO', payload: text })}
        keyboardType="phone-pad"
        maxLength={11}
      />
      <View className="mb-3 mt-4">
        <FontAwesome name="user-circle" size={80} color="#6D29D2" />
      </View>
    </View>
  );
}
