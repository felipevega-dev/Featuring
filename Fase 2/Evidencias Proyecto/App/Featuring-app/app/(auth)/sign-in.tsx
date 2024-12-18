import {
  ScrollView,
  View,
  Text,
  Image,
  Alert,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { icons, images } from "@/constants";
import { useCallback, useState, useEffect } from "react";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import CustomCheckbox from "@/components/CustomCheckbox";
import { Link, useRouter } from "expo-router";
import OAuth from "@/components/OAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { useSuspensionCheck } from "@/hooks/useSuspensionCheck";

interface FormState {
  email: string;
  password: string;
}

const SignIn = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [form, setForm] = useState<FormState>({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const { checkSuspension } = useSuspensionCheck();

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem("savedEmail");
        const savedPassword = await AsyncStorage.getItem("savedPassword");
        const savedRememberMe = await AsyncStorage.getItem("rememberMe");

        if (savedEmail && savedPassword && savedRememberMe === "true") {
          setForm({ email: savedEmail, password: savedPassword });
          setRememberMe(true);
        }
      } catch (error) {
        console.error("Error al cargar datos guardados:", error);
      }
    };

    loadSavedData();
  }, []);

  const checkProfileCompletion = async (userId: string) => {
    const { data, error } = await supabase
      .from("perfil")
      .select("username")
      .eq("usuario_id", userId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      Alert.alert("Error", "No se pudo verificar el perfil. Por favor, intenta de nuevo.");
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
        switch (error.message) {
          case "Invalid login credentials":
            Alert.alert("Error", "Correo electrónico o contraseña incorrectos");
            break;
          case "Email not confirmed":
            Alert.alert("Error", "Por favor, confirma tu correo electrónico antes de iniciar sesión");
            break;
          case "Too many requests":
            Alert.alert("Error", "Demasiados intentos fallidos. Por favor, intenta más tarde");
            break;
          case "User not found":
            Alert.alert("Error", "No se encontró ninguna cuenta con este correo electrónico");
            break;
          default:
            Alert.alert("Error", "Ocurrió un error durante el inicio de sesión. Por favor, intenta de nuevo.");
        }
        return;
      }

      if (data.user) {
        await AsyncStorage.setItem("usuario_id", data.user.id);

        if (rememberMe) {
          await AsyncStorage.setItem("savedEmail", form.email);
          await AsyncStorage.setItem("savedPassword", form.password);
          await AsyncStorage.setItem("rememberMe", "true");
        } else {
          await AsyncStorage.removeItem("savedEmail");
          await AsyncStorage.removeItem("savedPassword");
          await AsyncStorage.setItem("rememberMe", "false");
        }

        const isProfileComplete = await checkProfileCompletion(data.user.id);
        const nextRoute = isProfileComplete ? "/(root)/(tabs)/home" : "/(auth)/preguntas";
        
        router.replace(nextRoute);
        
      } else {
        Alert.alert("Error", "No se pudo obtener la información del usuario. Por favor, intenta de nuevo.");
      }
    } catch (error: any) {
      Alert.alert("Error", "Ocurrió un error inesperado durante el inicio de sesión. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, [form.email, form.password, rememberMe, router]);

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white px-4 sm:px-6 md:px-8">
        <View className="relative w-full h-[140px] mt-10 sm:mt-14 flex items-center justify-center">
          <Image source={images.FeatLogo} className="z-0 w-[180px] h-[100px]" />
          <Text className="text-xl sm:text-2xl font-JakartaSemiBold text-primary-500 mt-2">
            Login
          </Text>
        </View>
        <View>
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
              autoCapitalize="none"
            />
            <TouchableOpacity
              className="absolute right-3 top-10"
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
          <Link href="/change-password" asChild>
            <TouchableOpacity className="mt-4 mb-4">
              <Text className="text-center text-secondary-600 text-base sm:text-lg">
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>
          </Link>
          <CustomButton
            title="Iniciar Sesión"
            onPress={onSignInPress}
            className="mt-3"
            disabled={isLoading}
          />
          <OAuth />
          <View className="flex-1 items-center justify-center mt-6 mb-5">
            <Link href="/sign-up">
              <View className="flex flex-col items-center">
                <Text className="font-JakartaMedium text-base sm:text-lg text-general-200">
                  ¿No tienes cuenta?
                </Text>
                <Text className="font-JakartaMedium text-base sm:text-lg text-secondary-500">
                  Regístrate
                </Text>
              </View>
            </Link>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignIn;
