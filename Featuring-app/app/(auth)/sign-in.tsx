import { ScrollView, View, Text, Image } from "react-native";
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

  const onSignInPress = useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: form.email,
        password: form.password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      } else {
        // See https://clerk.com/docs/custom-flows/error-handling
        // for more info on error handling
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
    }
  }, [isLoaded, form.email, form.password]);

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <View className="relative w-full h-[140px] mt-20 flex items-center justify-center">
          <Image
            source={images.FeaturingIcono}
            className="z-0 w-[130px] h-[90px]"
          />
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
          />
          {/* OAuth */}
          <OAuth />
          <Link
            href="/sign-up"
            className="text-xl text-center text-general-200 flex flex-col items-center m-2"
          >
            <View className="flex flex-col items-center mt-1">
              <Text className="font-JakartaMedium">¿No tienes cuenta?</Text>
              <Text className="font-JakartaMedium text-primary-500">
                Registrate
              </Text>
            </View>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
};

export default SignIn;
