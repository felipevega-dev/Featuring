import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PreguntasState, PreguntasAction } from '@/types/preguntas';
import { useLocation } from '@/hooks/useLocation';

interface SlideUbicacionProps {
  state: PreguntasState;
  dispatch: React.Dispatch<PreguntasAction>;
  onValidationComplete: (isValid: boolean) => void;
}

export function SlideUbicacion({ state, dispatch, onValidationComplete }: SlideUbicacionProps) {
  const { location } = state;
  const { requestLocationPermission } = useLocation();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onValidationComplete(!!location);
  }, [location]);

  const handleRequestLocation = async () => {
    try {
      const newLocation = await requestLocationPermission();
      if (newLocation) {
        dispatch({ type: 'SET_LOCATION', payload: newLocation });
        setError(null);
      } else {
        setError('No se pudo obtener la ubicación. Por favor, inténtalo de nuevo.');
      }
    } catch (err) {
      setError('Error al solicitar permisos de ubicación. Por favor, inténtalo de nuevo.');
    }
  };

  return (
    <View className="flex-1 justify-center items-center mb-10 pb-10 p-4">
      <Ionicons name="location" size={80} color="#6D29D2" />
      <Text className="text-2xl text-primary-700 font-JakartaBold mb-6 text-center">
        Habilita tu ubicación
      </Text>
      <Text className="text-center text-primary-700 mt-4 px-4 mb-6">
        Necesitamos tu ubicación para mejorar tu experiencia en la aplicación y permitirte colaborar con otros artistas cercanos. Esta información es esencial para nuestra funcionalidad de colaboración.
      </Text>
      <TouchableOpacity
        className="bg-primary-500 border-2 border-primary-700 p-3 mt-4 rounded-md"
        onPress={handleRequestLocation}
      >
        <Text className="text-white font-JakartaBold">Permitir ubicación</Text>
      </TouchableOpacity>
      {location && (
        <Text className="text-center text-primary-700 mt-4">
          Ubicación obtenida: {location.ubicacion}
        </Text>
      )}
      {error && (
        <Text className="text-center text-danger-600 mt-4">
          {error}
        </Text>
      )}
      {!location && (
        <Text className="text-center text-danger-600 mt-4">
          Debes habilitar la ubicación para continuar.
        </Text>
      )}
    </View>
  );
}
