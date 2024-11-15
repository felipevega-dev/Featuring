import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface ProfileVideoCardProps {
  id: number;
  descripcion: string;
  likes_count: number;
  created_at: string;
}

export default function ProfileVideoCard({
  id,
  descripcion,
  likes_count,
  created_at
}: ProfileVideoCardProps) {
  const handlePress = () => {
    router.push({
      pathname: "/(root)/(tabs)/watch",
      params: { scrollToId: id.toString(), tab: 'videos' }
    });
  };

  return (
    <TouchableOpacity 
      className="bg-white rounded-lg shadow-md mb-4 p-4"
      onPress={handlePress}
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-1 mr-4">
          <Text className="font-JakartaSemiBold text-md mb-2 text-primary-700" numberOfLines={2}>
            {descripcion}
          </Text>
          <View className="flex-row justify-between items-center">
            <Text className="text-xs text-general-200">
              {new Date(created_at).toLocaleDateString()}
            </Text>
            <View className="flex-row items-center">
              <Text className="text-xs text-primary-500 mr-2">
                {likes_count} likes
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#6D29D2" />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}