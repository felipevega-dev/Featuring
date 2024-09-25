import React, { useState } from "react";
import { View, Text, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { icons } from "@/constants";

const Profile = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/sign-in");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    try {
      await user?.updatePassword({ newPassword });
      Alert.alert("Éxito", "Contraseña actualizada correctamente");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error al cambiar la contraseña:", error);
      Alert.alert("Error", "No se pudo actualizar la contraseña");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 p-5">
        <Text className="text-2xl font-bold text-center mb-5">Perfil</Text>

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

        <View className="mb-5">
          <Text className="text-lg font-semibold mb-2">Cambiar Contraseña</Text>
          <InputField
            label="Nueva Contraseña"
            placeholder="Ingresa tu nueva contraseña"
            icon={icons.lock}
            secureTextEntry={true}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <InputField
            label="Confirmar Contraseña"
            placeholder="Confirma tu nueva contraseña"
            icon={icons.lock}
            secureTextEntry={true}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <CustomButton
            title="Cambiar Contraseña"
            onPress={handleChangePassword}
            className="mt-3 bg-blue-500"
          />
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
