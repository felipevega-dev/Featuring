import React from 'react';
import { View, Text } from 'react-native';

interface RewardCardProps {
  nivel: string;
  puntosNecesarios: number;
  puntosActuales: number;
  beneficios: string[];
}

export function RewardCard({ nivel, puntosNecesarios, puntosActuales, beneficios }: RewardCardProps) {
  const isUnlocked = puntosActuales >= puntosNecesarios;

  return (
    <View 
      className={`bg-white rounded-lg p-4 mb-4 ${
        isUnlocked ? 'border-2 border-green-500' : ''
      }`}
    >
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-lg font-bold">{nivel}</Text>
        <Text className="text-primary-600">
          {isUnlocked ? '¡Desbloqueado!' : `${puntosNecesarios} puntos`}
        </Text>
      </View>
      {beneficios.map((beneficio, idx) => (
        <Text key={idx} className="text-gray-600 ml-4">• {beneficio}</Text>
      ))}
    </View>
  );
} 