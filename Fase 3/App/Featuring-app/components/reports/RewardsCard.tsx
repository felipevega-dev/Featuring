import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface RewardCardProps {
  nivel: string;
  puntosNecesarios: number;
  puntosActuales: number;
  beneficios: string[];
  isNext?: boolean;
}

const getNivelColor = (nivel: string) => {
  switch (nivel.toLowerCase()) {
    case 'bronce':
      return {
        border: 'border-[#CD7F32]',
        text: 'text-[#CD7F32]',
        bg: 'bg-[#CD7F32]',
        bgLight: 'bg-[#CD7F32]/10'
      };
    case 'plata':
      return {
        border: 'border-[#C0C0C0]',
        text: 'text-[#808080]',
        bg: 'bg-[#C0C0C0]',
        bgLight: 'bg-[#C0C0C0]/10'
      };
    case 'oro':
      return {
        border: 'border-[#FFD700]',
        text: 'text-[#DAA520]',
        bg: 'bg-[#FFD700]',
        bgLight: 'bg-[#FFD700]/10'
      };
    default:
      return {
        border: 'border-gray-300',
        text: 'text-gray-600',
        bg: 'bg-gray-300',
        bgLight: 'bg-gray-100'
      };
  }
};

export function RewardCard({ 
  nivel, 
  puntosNecesarios, 
  puntosActuales, 
  beneficios,
  isNext 
}: RewardCardProps) {
  const isUnlocked = puntosActuales >= puntosNecesarios;
  const progress = Math.min((puntosActuales / puntosNecesarios) * 100, 100);
  const colors = getNivelColor(nivel);

  return (
    <View 
      className={`bg-white p-3 rounded-lg shadow-sm mb-2 border ${
        isUnlocked ? colors.border : 
        isNext ? 'border-primary-300' : 'border-gray-200'
      }`}
      style={{ minHeight: 120 }} // Asegurar altura mínima consistente
    >
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
          <Text className={`text-lg font-bold ${colors.text}`}>{nivel}</Text>
          {isUnlocked && (
            <Ionicons 
              name="checkmark-circle" 
              size={20} 
              color="#10B981" 
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
        <Text className={isUnlocked ? 'text-green-600' : colors.text}>
          {isUnlocked ? '¡Desbloqueado!' : `${puntosNecesarios} puntos`}
        </Text>
      </View>

      {!isUnlocked && (
        <View className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
          <View 
            className={`h-full ${colors.bg} rounded-full`}
            style={{ width: `${progress}%` }}
          />
        </View>
      )}

      <View className={`rounded-lg p-2 ${isUnlocked ? colors.bgLight : 'bg-gray-50'}`}>
        {beneficios.map((beneficio, idx) => (
          <View key={idx} className="flex-row items-center mt-1">
            <Ionicons 
              name={isUnlocked ? "checkmark-circle" : "radio-button-off"} 
              size={16} 
              color={isUnlocked ? "#10B981" : "#6B7280"}
              style={{ marginRight: 8 }}
            />
            <Text className={`${isUnlocked ? 'font-medium ' + colors.text : 'text-gray-600'}`}>
              {beneficio}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
} 