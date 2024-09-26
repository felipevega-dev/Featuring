import { ScrollView, View, Text, Image, Alert } from "react-native";
import { icons, images } from "@/constants";
import { useCallback, useState } from "react";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import { Link, useRouter } from "expo-router";
import OAuth from "@/components/OAuth";
import { useSignIn } from "@clerk/clerk-expo";

const SignIn = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    setIsLoading(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      } else {
        Alert.alert(
          "Error",
          "Inicio de sesión fallido, revisa tus credenciales",
        );
      }
    } catch (err) {
      Alert.alert("Error", "Ocurrió un error durante el logeo");
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, form.email, form.password]);

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
            onChangeText={(value) => setForm({ ...form, email: value })}
          />
          <InputField
            label="Contraseña"
            placeholder="Ingresa tu contraseña"
            icon={icons.lock}
            secureTextEntry={true}
            value={form.password}
            onChangeText={(value) => setForm({ ...form, password: value })}
          />
          <CustomButton
            title="Iniciar Sesión"
            onPress={onSignInPress}
            className="mt-6"
            disabled={isLoading} // Desactiva el botón si está cargando
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
