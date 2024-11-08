import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';

interface TooltipTitleProps {
  nombre: string;
  descripcion: string;
  nivel: 'novato' | 'recurrente' | 'honorario';
}

export function TooltipTitle({ nombre, descripcion, nivel }: TooltipTitleProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getTitleColor = (nivel: string) => {
    switch (nivel) {
      case 'honorario':
        return '#DAA520'; // Oro
      case 'recurrente':
        return '#808080'; // Plata
      default:
        return '#CD7F32'; // Bronce
    }
  };

  return (
    <>
      <TouchableOpacity 
        onPress={() => setShowTooltip(true)}
      >
        <Text className="text-sm text-secondary-600">
          {nombre}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showTooltip}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTooltip(false)}
      >
        <TouchableOpacity 
          activeOpacity={1}
          onPress={() => setShowTooltip(false)}
          className="flex-1 justify-center items-center bg-black/50"
        >
          <View className="bg-white mx-4 p-4 rounded-lg">
            <Text className="text-base text-gray-800">
              {descripcion}
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
} 