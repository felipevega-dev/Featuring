import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { PreguntasState, PreguntasAction } from '@/types/preguntas';
import { useLocation } from '@/hooks/useLocation';

interface SlideUbicacionProps {
  state: PreguntasState;
  dispatch: React.Dispatch<PreguntasAction>;
}

export function SlideUbicacion({ state, dispatch }: SlideUbicacionProps) {
  const { location } = state;
  const { requestLocationPermission } = useLocation();

  const handleRequestLocation = async () => {
    const newLocation = await requestLocationPermission();
    if (newLocation) {
      dispatch({ type: 'SET_LOCATION', payload: newLocation });
    }
  };

  return (
    <View className="flex-1 justify-center items-center mb-10 pb-10 p-4">
      <Text className="text-2xl text-primary-700 font-JakartaBold mb-6">
        ¿Deseas acceder a tu ubicación?
      </Text>
      <Text className="text-center text-primary-700 mt-4 px-4">
        Al permitir el acceso a tu ubicación, podemos mejorar tu experiencia en la aplicación.
      </Text>
      <TouchableOpacity
        className="bg-primary-500 border-2 border-primary-700 p-3 mt-4 rounded-md"
        onPress={handleRequestLocation}
      >
        <Text className="text-white">Permitir ubicación</Text>
      </TouchableOpacity>
      {location && (
        <Text className="text-center text-primary-700 mt-4">
          Ubicación: {location.ubicacion}
        </Text>
      )}
    </View>
  );
}
