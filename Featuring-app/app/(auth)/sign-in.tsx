import { ScrollView, View, Text, Image, Alert, TouchableOpacity } from "react-native";
import { icons, images } from "@/constants";
import { useCallback, useState, useEffect } from "react";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import CustomCheckbox from "@/components/CustomCheckbox";
import { Link, useRouter } from "expo-router";
import OAuth from "@/components/OAuth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from "@/lib/supabase";

interface FormState {
  email: string;
  password: string;
}

const SignIn = () => {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

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

  const checkProfileCompletion = async (userId: string) => {
    const { data, error } = await supabase
      .from('perfil')
      .select('username')
      .eq('usuario_id', userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error al verificar el perfil:', error);
      return false;
    }

  return !!data?.username;
};
const onSignInPress = useCallback(async () => {
  setIsLoading(true);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    if (error) {
      console.error("Error de inicio de sesión:", error.message);
      switch (error.message) {
        case 'Invalid login credentials':
          Alert.alert("Error", "Correo electrónico o contraseña incorrectos");
          break;
        case 'Email not confirmed':
          Alert.alert("Error", "Por favor, confirma tu correo electrónico antes de iniciar sesión");
          break;
        default:
          Alert.alert("Error", `Ocurrió un error durante el inicio de sesión: ${error.message}`);
      }
      return;
    }

    if (data.user) {
      console.log("Usuario autenticado:", data.user);

      // Guardar el user.id en AsyncStorage para uso futuro
      await AsyncStorage.setItem('usuario_id', data.user.id);

      if (rememberMe) {
        await AsyncStorage.setItem('savedEmail', form.email);
        await AsyncStorage.setItem('savedPassword', form.password);
        await AsyncStorage.setItem('rememberMe', 'true');
      } else {
        await AsyncStorage.removeItem('savedEmail');
        await AsyncStorage.removeItem('savedPassword');
        await AsyncStorage.setItem('rememberMe', 'false');
      }

      const isProfileComplete = await checkProfileCompletion(data.user.id);
      console.log("Perfil completo:", isProfileComplete);

      if (isProfileComplete) {
        router.replace("/(root)/(tabs)/home");
      } else {
        router.replace("/(auth)/preguntas");
      }
    } else {
      throw new Error("No se pudo obtener la información del usuario");
    }
  } catch (error) {
    console.error("Error durante el inicio de sesión:", error);
    Alert.alert("Error", "Ocurrió un error inesperado durante el inicio de sesión");
  } finally {
    setIsLoading(false);
  }
}, [form.email, form.password, rememberMe, router]);

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
