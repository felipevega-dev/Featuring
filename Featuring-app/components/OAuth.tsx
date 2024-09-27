import { useState, useCallback } from "react";
import { View, Text, Image, Alert } from "react-native";
import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants";
import { useOAuth } from "@clerk/clerk-expo";
import { googleOAuth } from "@/lib/auth";
import { router } from "expo-router";

const OAuth = () => {
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await googleOAuth(startOAuthFlow);

      if (result.code === "session_exists") {
        Alert.alert("Success", "Session exists. Redirecting to home screen.");
        router.push("/(auth)/preguntas")
      } else {
        Alert.alert(result.success ? "Success" : "Error", result.message);
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred during the sign-in process.");
    } finally {
      setIsLoading(false);
    }
  }, [startOAuthFlow]);

  return (
    <View>
      <View className="flex flex-row justify-center items-center mt-1 gap-x-3">
        <View className="flex-1 h-[1px] bg-general-100" />
        <Text className="text-md">O</Text>
        <View className="flex-1 h-[1px] bg-general-100" />
      </View>

      <CustomButton
        title="Inicia sesión con Google"
        className="mt-5 w-full shadow-none"
        IconLeft={() => (
          <Image
            source={icons.google}
            resizeMode="contain"
            className="w-5 h-5 mx-2"
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
