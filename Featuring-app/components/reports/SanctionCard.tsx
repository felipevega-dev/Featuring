import React from 'react';
import { View, Text } from 'react-native';

interface SanctionCardProps {
  tipo: string;
  motivo: string;
  duracion?: number;
  fecha: string;
  getSanctionColor: (tipo: string) => string;
}

export function SanctionCard({ tipo, motivo, duracion, fecha, getSanctionColor }: SanctionCardProps) {
  return (
    <View className="bg-white p-3 rounded-lg shadow mb-3">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <View className={`self-start px-2 py-1 rounded-full ${getSanctionColor(tipo)}`}>
            <Text className="text-xs font-medium">
              {tipo.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')}
            </Text>
          </View>
          <Text className="text-gray-600 text-sm mt-2">
            <Text className="font-medium">Motivo: </Text>
            {motivo}
          </Text>
          {duracion && (
            <Text className="text-gray-500 text-sm mt-1">
              <Text className="font-medium">Duración: </Text>
              {duracion} días
            </Text>
          )}
          <Text className="text-gray-400 text-xs mt-2">
            {fecha}
          </Text>
        </View>
      </View>
    </View>
  );
} 