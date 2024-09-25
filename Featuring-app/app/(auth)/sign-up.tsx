import { ScrollView, View, Text, Image, Alert } from "react-native";
import { icons, images } from "@/constants";
import { useState } from "react";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import { Link, router } from "expo-router";
import OAuth from "@/components/OAuth";
import { useSignUp } from "@clerk/clerk-expo";
import { ReactNativeModal } from "react-native-modal";
import { fetchAPI } from "@/lib/fetch";

const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
  });

  const onSignUpPress = async () => {
    if (!isLoaded) {
      return;
    }

    try {
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      setVerification({
        ...verification,
        state: "pending",
      });
    } catch (err: any) {
      Alert.alert("Error", err.errors[0].longMessage);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });

      if (completeSignUp.status === "complete") {
        await fetchAPI("/(api)/user", {
          method: "POST",
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            clerkId: completeSignUp.createdUserId,
          }),
        });

        await setActive({ session: completeSignUp.createdSessionId });
        setVerification({ ...verification, state: "success" });
      } else {
        setVerification({
          ...verification,
          error: "Verification failed",
          state: "failed",
        });
      }
    } catch (err: any) {
      setVerification({
        ...verification,
        error: err.errors[0].longMessage,
        state: "failed",
      });
    }
  };

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
            Registro
          </Text>
        </View>
        <View className="p-3">
          <InputField
            label="Nombre"
            placeholder="Ingresa tu nombre"
            icon={icons.person}
            value={form.name}
            onChangeText={(value) => setForm({ ...form, name: value })}
          />
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
            title="Registrarse"
            onPress={onSignUpPress}
            className="mt-6"
          />
          {/* OAuth */}
          <OAuth />
          <View className="flex-1 mt-0.5 items-center justify-center">
            <Link href="/sign-in">
              <View className="flex flex-col items-center">
                <Text className="font-JakartaMedium text-md">
                  ¿Ya estás registrado?
                </Text>
                <Text className="font-JakartaMedium text-primary-500 text-md">
                  Iniciar Sesión
                </Text>
              </View>
            </Link>
          </View>
        </View>

        <ReactNativeModal
          isVisible={verification.state === "pending"}
          onModalHide={() => {
            if (verification.state === "success") setShowSuccessModal(true);
          }}
        >
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <Text className="text-2xl font-Jakarta mb-2">Verificación</Text>
            <Text className="font-Jakarta mb-5">
              Envíamos un codigo de verificación al correo: {form.email}
            </Text>

            <InputField
              label="Code"
              icon={icons.lock}
              placeholder="123456"
              value={verification.code}
              keyboardType="numeric"
              onChangeText={(code) =>
                setVerification({ ...verification, code })
              }
            />

            {verification.error && (
              <Text className="text-red-500 text-sm mt-1">
                {verification.error}
              </Text>
            )}

            <CustomButton
              title="Verifica tu Correo"
              onPress={onPressVerify}
              className="mt-5 bg-success-400"
            ></CustomButton>
          </View>
        </ReactNativeModal>

        <ReactNativeModal isVisible={showSuccessModal}>
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <Image
              source={images.check}
              className="w-[110px] h-[110px] mx-auto my-5"
            />

            <Text className="text-3xl font-JakartaBold text-center">
              Verificado
            </Text>

            <Text className="text-base text-gray-400 font-Jakarta text-center mt-2">
              Has verificado exitosamente tu cuenta.
            </Text>

            <CustomButton
              title="Ir al Inicio"
              onPress={() => {
                setShowSuccessModal(false);
                router.push("/(root)/(tabs)/home");
              }}
            ></CustomButton>
          </View>
        </ReactNativeModal>
      </View>
    </ScrollView>
  );
};

export default SignUp;
