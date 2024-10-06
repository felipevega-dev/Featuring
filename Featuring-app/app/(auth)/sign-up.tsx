import React, { useState } from "react";
import { ScrollView, View, TouchableOpacity, Text, Image, Alert } from "react-native";
import { icons, images } from "@/constants";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import { Link, router } from "expo-router";
import { ReactNativeModal } from "react-native-modal";
import { supabase } from "@/lib/supabase";
import OAuth from "@/components/OAuth";

const USERNAME_MIN_LENGTH = 4;
const USERNAME_MAX_LENGTH = 10;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 14;

export default function SignUp() {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors((prev) => ({ ...prev, email: "Ingresa un correo electrónico válido." }));
    } else {
      setErrors((prev) => ({ ...prev, email: "" }));
    }
  };

  const validatePassword = (password: string) => {
    if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
      setErrors((prev) => ({
        ...prev,
        password: `La contraseña debe tener entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres.`,
      }));
    } else {
      setErrors((prev) => ({ ...prev, password: "" }));
    }
  };

  const onSignUpPress = async () => {
    setTouched({ email: true, password: true });

    if (errors.email || errors.password) {
      Alert.alert("Error", "Por favor, corrige los errores antes de continuar.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden. Por favor, verifica e intenta nuevamente.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (error) throw error;

      if (data.user) {
        setShowSuccessModal(true);
      } else {
        throw new Error("No se pudo crear el usuario");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message || "Ocurrió un error durante el registro");
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[80px] mt-14 flex items-center justify-center">
          <Image source={images.FeatLogo} className="z-0 w-[180px] h-[100px]" />
          <Text className="text-lg font-bold text-primary-500">Registro</Text>
        </View>

        <View className="p-4">
          <InputField
            label="Email"
            placeholder="Ingresa tu correo"
            icon={icons.email}
            value={form.email}
            onChangeText={(value) => {
              setForm({ ...form, email: value.trim() });
              if (!touched.email) setTouched({ ...touched, email: true });
              validateEmail(value.trim());
            }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {touched.email && errors.email ? <Text className="text-red-500 text-sm">{errors.email}</Text> : null}

          <View className="relative">
            <InputField
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              icon={icons.lock}
              secureTextEntry={!showPassword}
              value={form.password}
              onChangeText={(value) => {
                setForm({ ...form, password: value });
                if (!touched.password) setTouched({ ...touched, password: true });
                validatePassword(value);
              }}
            />
            <TouchableOpacity
              className="absolute right-3 top-1/2"
              onPress={() => setShowPassword(!showPassword)}
            >
              <Image source={showPassword ? icons.hidePassword : icons.showPassword} className="w-6 h-6" />
            </TouchableOpacity>
          </View>
          {touched.password && errors.password ? <Text className="text-red-500 text-sm">{errors.password}</Text> : null}

          <View className="relative">
            <InputField
              label="Confirmar Contraseña"
              placeholder="Confirma tu contraseña"
              icon={icons.lock}
              secureTextEntry={!showConfirmPassword}
              value={form.confirmPassword}
              onChangeText={(value) => setForm({ ...form, confirmPassword: value })}
            />
            <TouchableOpacity
              className="absolute right-3 top-1/2"
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Image source={showConfirmPassword ? icons.hidePassword : icons.showPassword} className="w-6 h-6" />
            </TouchableOpacity>
          </View>

          <CustomButton title="Registrarse" onPress={onSignUpPress} className="mt-4" />
          <OAuth/>
          <View className="flex-1 items-center justify-center">
            <Link href="/sign-in">
              <View className="flex flex-col items-center">
                <Text className="font-JakartaMedium text-md">¿Ya estás registrado?</Text>
                <Text className="font-JakartaMedium text-primary-500 text-md">Iniciar Sesión</Text>
              </View>
            </Link>
          </View>
        </View>

        <ReactNativeModal isVisible={showSuccessModal}>
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <Image source={images.check} className="w-[110px] h-[110px] mx-auto my-5" />
            <Text className="text-3xl font-JakartaBold text-center">Verificado</Text>
            <Text className="text-base text-gray-400 font-Jakarta text-center mt-2">
              Has registrado exitosamente tu cuenta.
            </Text>
            <CustomButton
              title="Ir a Preguntas Iniciales"
              onPress={() => {
                setShowSuccessModal(false);
                router.replace("/(auth)/preguntas");
              }}
            />
          </View>
        </ReactNativeModal>
      </View>
    </ScrollView>
  );
}