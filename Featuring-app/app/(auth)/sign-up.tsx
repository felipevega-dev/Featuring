import { ScrollView, View, TouchableOpacity, Text, Image, Alert } from "react-native";
import { icons, images } from "@/constants";
import { useState, useEffect } from "react";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import { Link, router } from "expo-router";
import OAuth from "@/components/OAuth";
import { useSignUp } from "@clerk/clerk-expo";
import { ReactNativeModal } from "react-native-modal";
import { supabase } from "@/lib/supabase";

const USERNAME_MIN_LENGTH = 4;
const USERNAME_MAX_LENGTH = 10;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 14;

const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState<{
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<{
    username: string;
    password: string;
  }>({
    username: '',
    password: '',
  });

  const [touched, setTouched] = useState<{
    username: boolean;
    password: boolean;
  }>({
    username: false,
    password: false,
  });

  const [verification, setVerification] = useState({
    state: "default",
    error: "",
    code: "",
  });

  useEffect(() => {
    if (touched.username) validateUsername(form.username);
    if (touched.password) validatePassword(form.password);
  }, [form.username, form.password, touched]);

  const validateUsername = (username: string) => {
    if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
      setErrors(prev => ({...prev, username: `El usuario debe tener entre ${USERNAME_MIN_LENGTH} y ${USERNAME_MAX_LENGTH} caracteres.`}));
    } else {
      setErrors(prev => ({...prev, username: ''}));
    }
  };

  const validatePassword = (password: string) => {
    if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
      setErrors(prev => ({...prev, password: `La contraseña debe tener entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres.`}));
    } else {
      setErrors(prev => ({...prev, password: ''}));
    }
  };

  const onSignUpPress = async () => {
    if (!isLoaded) {
      return;
    }

    setTouched({ username: true, password: true });

    if (errors.username || errors.password) {
      Alert.alert("Error", "Por favor, corrige los errores antes de continuar.");
      return;
    }

    // Check if passwords match
    if (form.password !== form.confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden. Por favor, verifica e intenta nuevamente.");
      return;
    }

    try {
      // Crear usuario en Clerk
      await signUp.create({
        username: form.username,
        emailAddress: form.email,
        password: form.password,
      });

      // Preparar verificación de correo
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
        // Crear usuario en Supabase
        const { data, error } = await supabase.from("usuario").insert({
          username: form.username, // Cambiar a "name" según tu estructura
          correo_electronico: form.email,
          contrasena: form.password, // Asegúrate de usar un hash en producción
        });

        if (error) throw error;

        // Asignar sesión activa y redirigir
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
          <Image source={images.FeatLogo} className="z-0 w-[180px] h-[100px]" />
        </View>
        <View className="flex flex-col items-center">
          <Text className="text-lg font-JakartaSemiBold text-primary-500">
            Registro
          </Text>
        </View>
        <View className="p-3">
        <InputField
            label="Usuario"
            placeholder={`Ingresa tu usuario`}
            icon={icons.person}
            value={form.username}
            onChangeText={(value) => {
              setForm({ ...form, username: value });
              if (!touched.username) setTouched({ ...touched, username: true });
            }}
          />
          {touched.username && errors.username ? <Text className="text-red-500 text-sm">{errors.username}</Text> : null}
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
              placeholder={`Ingresa tu contraseña`}
              icon={icons.lock}
              secureTextEntry={!showPassword}
              value={form.password}
              onChangeText={(value) => {
                setForm({ ...form, password: value });
                if (!touched.password) setTouched({ ...touched, password: true });
              }}
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
              <Image 
                source={showConfirmPassword ? icons.hidePassword : icons.showPassword} 
                className="w-6 h-6"
              />
            </TouchableOpacity>
          </View>
          <CustomButton
            title="Registrarse"
            onPress={onSignUpPress}
            className="mt-6"
          />
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
              Envíamos un código de verificación al correo: {form.email}
            </Text>

            <InputField
              label="Código"
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
            />
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
                router.push("/(auth)/preguntas")
              }}
            />
          </View>
        </ReactNativeModal>
      </View>
    </ScrollView>
  );
};

export default SignUp;
