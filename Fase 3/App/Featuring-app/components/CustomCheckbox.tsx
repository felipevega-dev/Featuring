import React from "react";
import { TouchableOpacity, View, Text } from "react-native";

interface CustomCheckboxProps {
  title: string;
  checked: boolean;
  onPress: () => void;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  title,
  checked,
  onPress,
}) => {
  return (
    <TouchableOpacity 
      className="flex flex-row items-center justify-end my-2" 
      onPress={onPress}
    >
      <Text className="text-base text-general-200 mr-2 font-JakartaMedium">
        {title}
      </Text>
      <View 
        className={`w-5 h-5 border-2 border-primary-500 rounded-sm justify-center items-center ${
          checked ? 'bg-secondary-600' : 'bg-white'
        }`}
      >
        {checked && (
          <View className="w-3 h-3 bg-secondary-400 rounded-sm" />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default CustomCheckbox;
