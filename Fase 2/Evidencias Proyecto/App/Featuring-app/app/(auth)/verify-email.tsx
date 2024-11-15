import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Alert,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { images } from "@/constants";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";

export default function VerifyEmail() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [remainingTime, setRemainingTime] = useState(200);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert("Error", "Por favor ingresa el código de verificación");
      return;
    }

    setIsLoading(true);
    try {
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email: email as string,
        token: otp.trim(),
        type: "signup"
      });
      if (verifyError) {
        console.error("Error detallado de verificación:", {
          message: verifyError.message,
          status: verifyError.status,
          name: verifyError.name,
          details: verifyError
        });

        if (verifyError.message.includes("expired")) {
          Alert.alert(
            "Error",
            "El código ha expirado. Por favor, solicita uno nuevo."
          );
        } else if (verifyError.message.includes("invalid")) {
          Alert.alert(
            "Error",
            "Código de verificación inválido. Por favor, revisa el código e intenta de nuevo."
          );
        } else {
          throw verifyError;
        }
        return;
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      Alert.alert(
        "Éxito",
        "Tu correo ha sido verificado exitosamente",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/(auth)/preguntas");
            }
          }
        ]
      );
    } catch (error: any) {
      console.error("Error completo:", error);
      console.error("Tipo de error:", error.constructor.name);
      console.error("Mensaje de error:", error.message);
      if (error.status) console.error("Status:", error.status);
      if (error.statusText) console.error("StatusText:", error.statusText);

      Alert.alert(
        "Error",
        "No se pudo verificar el correo. Por favor, intenta de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (isResending) return;
    
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email as string,
        options: {
          emailRedirectTo: undefined
        }
      });

      if (error) {
        console.error("Error al reenviar código:", error);
        throw error;
      }

      setRemainingTime(200);
      Alert.alert("Éxito", "Se ha enviado un nuevo código de verificación");
    } catch (error: any) {
      console.error("Error en reenvío:", error);
      Alert.alert("Error", "No se pudo reenviar el código de verificación");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white px-4 py-8">
        <View className="items-center mb-8">
          <Image source={images.FeatLogo} className="w-[180px] h-[100px]" />
          <Text className="text-xl font-bold text-primary-600 mt-4">
            Verificación de Correo
          </Text>
        </View>

        <Text className="text-center text-gray-600 mb-6">
          Hemos enviado un código de verificación a{"\n"}
          <Text className="font-bold">{email}</Text>
        </Text>

        <InputField
          label="Código de Verificación"
          placeholder="Ingresa el código"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={7}
        />

        <CustomButton
          title="Verificar"
          onPress={handleVerifyOtp}
          disabled={isLoading}
          className="mt-4"
        />

        <View className="mt-6">
          <Text className="text-center text-gray-500 mb-2">
            Tiempo restante: {formatTime(remainingTime)}
          </Text>
          
          <TouchableOpacity 
            onPress={handleResendCode}
            disabled={remainingTime > 0 || isResending}
          >
            <Text className="text-center text-secondary-600 text-base">
              ¿No recibiste el código?{" "}
              <Text 
                className={`font-bold ${
                  remainingTime > 0 || isResending 
                    ? "text-gray-400" 
                    : "text-secondary-600"
                }`}
              >
                Reenviar
              </Text>
            </Text>
          </TouchableOpacity>

          {remainingTime === 0 && (
            <CustomButton
              title={isResending ? "Enviando..." : "Reenviar código"}
              onPress={handleResendCode}
              disabled={isResending}
              bgVariant="outline"
              className="mt-4"
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
} 