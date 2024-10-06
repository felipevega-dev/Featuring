import { useState, useCallback } from "react";
import { View, Text, Image, Alert } from "react-native";
import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";

const OAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });

      if (error) throw error;

      // Manejar el éxito de la autenticación
      router.push("/(auth)/preguntas");
    } catch (error) {
      Alert.alert("Error", "An error occurred during the sign-in process.");
    }
  };

  return (
    <View>
      <View className="flex flex-row justify-center items-center gap-x-3">
        <View className="flex-1 h-[1px] bg-general-100" />
        <Text className="text-md">O</Text>
        <View className="flex-1 h-[1px] bg-general-100" />
      </View>
      <CustomButton
        title="Inicia sesión con Google"
        className="mt-4 w-full shadow-none"
        IconLeft={() => (
          <Image
            source={icons.google}
            resizeMode="contain"
            className="w-5 h-5 mx-3"
          />
        )}
        bgVariant="outline"
        textVariant="primary"
        onPress={handleGoogleSignIn}
        disabled={isLoading} // Desactiva el botón si está cargando
      />
    </View>
  );
};

export default OAuth;
