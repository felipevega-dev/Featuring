import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { icons } from "@/constants";

interface ProfileSongCardProps {
  id: number;
  titulo: string;
  genero: string;
  caratula: string | null;
  created_at: string;
  likes_count: number;
}

const ProfileSongCard: React.FC<ProfileSongCardProps> = ({
  id,
  titulo,
  genero,
  caratula,
  created_at,
  likes_count
}) => {
  const handlePress = () => {
    router.push({
      pathname: "/(root)/(tabs)/comunidad",
      params: { 
        scrollToId: id.toString()
      }
    });
  };

  return (
    <TouchableOpacity 
      className="bg-white rounded-lg shadow-md mb-4 p-4"
      onPress={handlePress}
    >
      <View className="flex-row">
        <Image
          source={{ 
            uri: caratula || "https://via.placeholder.com/100"
          }}
          className="w-20 h-20 rounded-lg"
          resizeMode="cover"
        />
        <View className="flex-1 ml-4">
          <Text className="font-JakartaSemiBold text-md mb-1 text-primary-700">
            {titulo}
          </Text>
          <Text className="text-xs mb-1 text-secondary-500">
            {genero}
          </Text>
          <View className="flex-row justify-between items-center mt-2">
            <Text className="text-xs text-general-200">
              {new Date(created_at).toLocaleDateString('es-ES', { 
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
            <View className="flex-row items-center">
              <View className="flex-row items-center mr-2">
                <Image
                  source={icons.hearto}
                  className="w-4 h-4 mr-1"
                  style={{ tintColor: "#6D29D2" }}
                />
                <Text className="text-xs text-primary-500">
                  {likes_count}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6D29D2" />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ProfileSongCard; 