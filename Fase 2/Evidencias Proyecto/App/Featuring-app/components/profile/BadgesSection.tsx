import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BadgesSectionProps {
  insignias: {
    id: number;
    nombre: string;
    descripcion: string;
    nivel: string;
  }[];
  tituloActivo?: {
    id: number;
    nombre: string;
    descripcion: string;
    nivel: string;
  };
}

export function BadgesSection({ insignias, tituloActivo }: BadgesSectionProps) {
  const getBadgeColor = (nivel: string) => {
    switch (nivel) {
      case 'bronce':
        return {
          bg: 'bg-[#CD7F32]/10',
          text: 'text-[#CD7F32]',
          icon: '#CD7F32'
        };
      case 'plata':
        return {
          bg: 'bg-[#C0C0C0]/10',
          text: 'text-[#808080]',
          icon: '#C0C0C0'
        };
      case 'oro':
        return {
          bg: 'bg-[#FFD700]/10',
          text: 'text-[#DAA520]',
          icon: '#FFD700'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-600',
          icon: '#808080'
        };
    }
  };

  return (
    <View className="mt-4">
      {tituloActivo && (
        <View className="mb-4">
          <Text className="text-lg font-bold mb-2">Título Activo</Text>
          <View className={`p-3 rounded-lg ${getBadgeColor(tituloActivo.nivel).bg}`}>
            <Text className={`font-bold ${getBadgeColor(tituloActivo.nivel).text}`}>
              {tituloActivo.nombre}
            </Text>
            <Text className="text-gray-600 text-sm mt-1">
              {tituloActivo.descripcion}
            </Text>
          </View>
        </View>
      )}

      {insignias.length > 0 && (
        <View>
          <Text className="text-lg font-bold mb-2">Insignias</Text>
          <View className="space-y-2">
            {insignias.map((insignia) => (
              <View 
                key={insignia.id} 
                className={`p-3 rounded-lg ${getBadgeColor(insignia.nivel).bg}`}
              >
                <View className="flex-row items-center">
                  <Ionicons 
                    name="shield-checkmark" 
                    size={24} 
                    color={getBadgeColor(insignia.nivel).icon}
                  />
                  <Text className={`font-bold ml-2 ${getBadgeColor(insignia.nivel).text}`}>
                    {insignia.nombre}
                  </Text>
                </View>
                <Text className="text-gray-600 text-sm mt-1">
                  {insignia.descripcion}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
} 