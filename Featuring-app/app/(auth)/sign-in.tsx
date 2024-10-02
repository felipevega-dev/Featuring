import { ScrollView, View, Text, Image, Alert, TouchableOpacity } from "react-native";
import { icons, images } from "@/constants";
import { useCallback, useState, useEffect } from "react";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import CustomCheckbox from "@/components/CustomCheckbox";
import { Link, useRouter } from "expo-router";
import OAuth from "@/components/OAuth";
import { useSignIn, useAuth } from "@clerk/clerk-expo";
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { getToken } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('savedEmail');
        const savedPassword = await AsyncStorage.getItem('savedPassword');
        const savedRememberMe = await AsyncStorage.getItem('rememberMe');

        if (savedEmail && savedPassword && savedRememberMe === 'true') {
          setForm({ email: savedEmail, password: savedPassword });
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Error al cargar datos guardados:', error);
      }
    };

    loadSavedData();
  }, []);

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) {
      console.log("SignIn no está cargado aún");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Iniciando proceso de inicio de sesión");
      const completeSignIn = await signIn.create({
        identifier: form.email.trim(),
        password: form.password,
      });

      console.log("Estado del inicio de sesión:", completeSignIn.status);

      if (completeSignIn.status !== "complete") {
        console.log("Inicio de sesión incompleto");
        throw new Error("Inicio de sesión fallido");
      }

      console.log("Estableciendo sesión activa");
      await setActive({ session: completeSignIn.createdSessionId });
      
      console.log("Obteniendo token");
      const token = await getToken();
      
      if (!token) {
        console.log("No se pudo obtener el token");
        throw new Error("No se pudo obtener el token de autenticación");
      }

      if (rememberMe) {
        await AsyncStorage.setItem('savedEmail', form.email);
        await AsyncStorage.setItem('savedPassword', form.password);
        await AsyncStorage.setItem('rememberMe', 'true');
      } else {
        await AsyncStorage.removeItem('savedEmail');
        await AsyncStorage.removeItem('savedPassword');
        await AsyncStorage.setItem('rememberMe', 'false');
      }

      console.log("Inicio de sesión exitoso, redirigiendo a home");
      router.replace("/(auth)/preguntas");
    } catch (err) {
      console.error("Error durante el inicio de sesión:", err);
      Alert.alert("Error", err instanceof Error ? err.message : "Ocurrió un error durante el inicio de sesión");
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, signIn, form.email, form.password, router, getToken, setActive, rememberMe]);

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[140px] mt-20 flex items-center justify-center">
          <Image source={images.FeatLogo} className="z-0 w-[180px] h-[100px]" />
        </View>
        <View className="flex flex-col items-center">
          <Text className="text-lg font-JakartaSemiBold text-primary-500">
            Login
          </Text>
        </View>
        <View className="p-5">
          <InputField
            label="Email"
            placeholder="Ingresa tu correo"
            icon={icons.email}
            value={form.email}
            onChangeText={(value) => setForm({ ...form, email: value.trim() })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View className="relative">
            <InputField
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              icon={icons.lock}
              secureTextEntry={!showPassword}
              value={form.password}
              onChangeText={(value) => setForm({ ...form, password: value })}
            />
            <TouchableOpacity
              className="absolute right-3 top-1/2"
              onPress={() => setShowPassword(!showPassword)}
            >
              <Image 
                source={showPassword ? icons.hidePassword : icons.showPassword} 
                className="w-6 h-6"
              />
            </TouchableOpacity>
          </View>
          <CustomCheckbox
            title="Recordar mis datos"
            checked={rememberMe}
            onPress={() => setRememberMe(!rememberMe)}
          />
          <CustomButton
            title="Iniciar Sesión"
            onPress={onSignInPress}
            className="mt-6"
            disabled={isLoading}
          />
          {/* OAuth */}
          <OAuth />
          <Link
            href="/sign-up"
            className="text-xl text-center text-general-200 "
          >
            <View className="flex flex-col items-center">
              <Text className="font-JakartaMedium">¿No tienes cuenta?</Text>
              <Text className="font-JakartaMedium text-primary-500">
                Regístrate
              </Text>
            </View>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignIn;