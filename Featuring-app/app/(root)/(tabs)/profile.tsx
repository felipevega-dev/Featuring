import React, { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import CustomButton from "@/components/CustomButton";

const Profile = () => {
  const { signOut } = useAuth();
  const { user } = useUser();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/sign-in");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 p-4">
        <Text className="text-2xl font-JakartaSemiBold text-center mb-4">
          Perfil
        </Text>

        <View className="mb-5">
          <Text className="text-lg font-semibold mb-2">Nombre</Text>
          <Text className="text-base">
            {user?.firstName} {user?.lastName}
          </Text>
        </View>

        <View className="mb-5">
          <Text className="text-lg font-semibold mb-2">Email</Text>
          <Text className="text-base">
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>

        <CustomButton
          title="Cerrar Sesión"
          onPress={handleSignOut}
          className="bg-red-500 mt-5"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
