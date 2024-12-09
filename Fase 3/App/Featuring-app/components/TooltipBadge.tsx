import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TooltipBadgeProps {
  nivel: 'bronce' | 'plata' | 'oro';
  descripcion: string;
}

export function TooltipBadge({ nivel, descripcion }: TooltipBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getBadgeColor = (nivel: string) => {
    switch (nivel) {
      case 'oro':
        return '#FFD700';
      case 'plata':
        return '#C0C0C0';
      default:
        return '#CD7F32';
    }
  };

  return (
    <>
      <TouchableOpacity 
        onPress={() => setShowTooltip(true)}
        className="ml-2"
      >
        <Ionicons 
          name="shield-checkmark" 
          size={24} 
          color={getBadgeColor(nivel)}
        />
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