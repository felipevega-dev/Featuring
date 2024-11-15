import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

interface SelectionButtonProps {
  title: string;
  isSelected: boolean;
  onPress: () => void;
  selectedColor: string;
  unselectedColor: string;
}

export function SelectionButton({ title, isSelected, onPress, selectedColor, unselectedColor }: SelectionButtonProps) {
  return (
    <TouchableOpacity
      className={`p-4 mx-1 border-2 rounded-full ${
        isSelected
          ? `bg-${selectedColor} border-${selectedColor}-700`
          : `bg-${unselectedColor} border-${unselectedColor}-400`
      }`}
      onPress={onPress}
    >
      <Text
        className={`${
          isSelected
            ? "text-white"
            : `text-${selectedColor}-700`
        } font-JakartaSemiBold`}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}
