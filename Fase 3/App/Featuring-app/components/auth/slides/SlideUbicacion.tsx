import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    onValidationComplete(!!location);
  }, [location]);

  const handleRequestLocation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newLocation = await requestLocationPermission();
      if (newLocation) {
        dispatch({ type: 'SET_LOCATION', payload: newLocation });
      } else {
        setError('No se pudo obtener la ubicación. Por favor, inténtalo de nuevo.');
      }
    } catch (err) {
      setError('Error al solicitar permisos de ubicación. Por favor, inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center items-center px-4 py-6 sm:py-8 md:py-10 mb-14">
      <View className="mb-4 sm:mb-6 md:mb-8">
        <Ionicons name="location" size={60} color="#6D29D2" />
      </View>
      <Text className="text-xl sm:text-2xl md:text-3xl text-primary-700 font-JakartaBold mb-4 sm:mb-6 md:mb-8 text-center">
        Habilita tu ubicación
      </Text>
      <Text className="text-center text-primary-700 text-base sm:text-lg mb-6 sm:mb-8">
        Necesitamos tu ubicación para mejorar tu experiencia en la aplicación y permitirte colaborar con otros artistas cercanos.
      </Text>
      <TouchableOpacity
        className="bg-primary-500 px-6 py-3 rounded-full mb-4 sm:mb-6"
        onPress={handleRequestLocation}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="text-white font-JakartaBold text-base sm:text-lg">
            {location ? "Actualizar ubicación" : "Permitir ubicación"}
          </Text>
        )}
      </TouchableOpacity>
      {location && (
        <View className="bg-primary-100 p-4 rounded-lg mb-4">
          <Text className="text-center text-secondary-700 font-JakartaMedium text-sm sm:text-base">
            Ubicación obtenida: {location.ubicacion}
          </Text>
        </View>
      )}
      {error && (
        <Text className="text-center text-danger-600 mt-2 text-sm sm:text-base">
          {error}
        </Text>
      )}
      {!location && (
        <Text className="text-center text-danger-600 mt-2 text-sm sm:text-base">
          Debes habilitar la ubicación para continuar.
        </Text>
      )}
    </View>
  );
}
