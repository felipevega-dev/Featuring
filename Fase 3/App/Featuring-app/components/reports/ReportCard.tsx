import React from 'react';
import { View, Text } from 'react-native';

interface ReportCardProps {
  username: string;
  razon: string;
  tipo: string;
  estado: string;
  fecha: string;
  getStatusColor: (estado: string) => string;
}

export function ReportCard({ username, razon, tipo, estado, fecha, getStatusColor }: ReportCardProps) {
  return (
    <View className="bg-white p-2.5 rounded-lg shadow-sm mb-2">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className="font-semibold text-gray-900 text-base">
            Contra: {username}
          </Text>
          <Text className="text-gray-600 text-sm mt-1">
            Razón: {razon}
          </Text>
          <Text className="text-gray-500 text-sm">
            Tipo: {tipo}
          </Text>
          <Text className="text-gray-400 text-xs mt-1">
            {fecha}
          </Text>
        </View>
        <View className={`px-2 py-1 rounded-full ${getStatusColor(estado)}`}>
          <Text className="text-xs font-medium capitalize">
            {estado}
          </Text>
        </View>
      </View>
    </View>
  );
} 