import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Image,
  Alert,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { icons, images } from "@/constants";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import CustomCheckbox from "@/components/CustomCheckbox";
import { Link, router } from "expo-router";
import { ReactNativeModal } from "react-native-modal";
import { supabase } from "@/lib/supabase";
import OAuth from "@/components/OAuth";

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 14;

export default function SignUp() {
  const { height } = useWindowDimensions();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [form, setForm] = useState({
    nombreCompleto: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    nombreCompleto: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [touched, setTouched] = useState({
    nombreCompleto: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      return "El correo electrónico es requerido.";
    } else if (!emailRegex.test(email)) {
      return "Ingresa un correo electrónico válido.";
    }
    return "";
  };

  const validatePassword = (password: string) => {
    if (!password) {
      return "La contraseña es requerida.";
    } else if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
      return `La contraseña debe tener entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres.`;
    }
    return "";
  };

  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      return "Confirma tu contraseña.";
    } else if (confirmPassword !== form.password) {
      return "Las contraseñas no coinciden.";
    }
    return "";
  };

  const validateNombreCompleto = (nombre: string) => {
    if (!nombre.trim()) {
      return "El nombre completo es requerido.";
    }
    return "";
  };

  const validateField = (field: string, value: string) => {
    let error = "";
    switch (field) {
      case "nombreCompleto":
        error = validateNombreCompleto(value);
        break;
      case "email":
        error = validateEmail(value);
        break;
      case "password":
        error = validatePassword(value);
        break;
      case "confirmPassword":
        error = validateConfirmPassword(value);
        break;
    }
    setErrors(prev => ({ ...prev, [field]: error }));
    return error;
  };

  const onSignUpPress = async () => {
    setTouched({
      nombreCompleto: true,
      email: true,
      password: true,
      confirmPassword: true
    });

    const nombreCompletoError = validateField("nombreCompleto", form.nombreCompleto);
    const emailError = validateField("email", form.email);
    const passwordError = validateField("password", form.password);
    const confirmPasswordError = validateField("confirmPassword", form.confirmPassword);

    if (nombreCompletoError || emailError || passwordError || confirmPasswordError) {
      Alert.alert(
        "Error",
        "Por favor, corrige los errores antes de continuar."
      );
      return;
    }

    if (!acceptTerms) {
      Alert.alert("Error", "Debes aceptar los términos y condiciones para registrarte.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.nombreCompleto,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        setShowSuccessModal(true);
      } else {
        throw new Error("No se pudo crear el usuario");
      }
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.message || "Ocurrió un error durante el registro"
      );
    }
  };

  return (
    <ScrollView className="flex-1 bg-white px-4 py-2">
      <View className="items-center justify-center mt-5 mb-1">
        <Image source={images.FeatLogo} className="w-[120px] h-[72px]" />
        <Text className="text-xl font-bold text-primary-600">Registro</Text>
      </View>

      <View>
        <InputField
          label="Nombre Completo"
          placeholder="Ingresa tu nombre completo"
          icon={icons.person}
          value={form.nombreCompleto}
          onChangeText={(value) => {
            setForm({ ...form, nombreCompleto: value });
            if (!touched.nombreCompleto) setTouched({ ...touched, nombreCompleto: true });
            validateField("nombreCompleto", value);
          }}
        />
        {touched.nombreCompleto && errors.nombreCompleto ? (
          <Text className="text-red-500 text-xs -mt-1">{errors.nombreCompleto}</Text>
        ) : null}

        <InputField
          label="Email"
          placeholder="Ingresa tu correo"
          icon={icons.email}
          value={form.email}
          onChangeText={(value) => {
            setForm({ ...form, email: value.trim() });
            if (!touched.email) setTouched({ ...touched, email: true });
            validateField("email", value.trim());
          }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {touched.email && errors.email ? (
          <Text className="text-red-500 text-xs -mt-1">{errors.email}</Text>
        ) : null}

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
              validateField("password", value);
            }}
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
        {touched.password && errors.password ? (
          <Text className="text-red-500 text-xs -mt-1">{errors.password}</Text>
        ) : null}

        <View className="relative">
          <InputField
            label="Confirmar Contraseña"
            placeholder="Confirma tu contraseña"
            icon={icons.lock}
            secureTextEntry={!showConfirmPassword}
            value={form.confirmPassword}
            onChangeText={(value) => {
              setForm({ ...form, confirmPassword: value });
              if (!touched.confirmPassword) setTouched({ ...touched, confirmPassword: true });
              validateField("confirmPassword", value);
            }}
            autoCapitalize="none"
          />
          <TouchableOpacity
            className="absolute right-3 top-10"
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Image
              source={showConfirmPassword ? icons.hidePassword : icons.showPassword}
              className="w-6 h-6"
            />
          </TouchableOpacity>
        </View>
        {touched.confirmPassword && errors.confirmPassword ? (
          <Text className="text-red-500 text-xs -mt-1">{errors.confirmPassword}</Text>
        ) : null}

        <CustomCheckbox
          title="Acepto los términos y condiciones"
          checked={acceptTerms}
          onPress={() => setAcceptTerms(!acceptTerms)}
        />

        <CustomButton
          title="Registrarse"
          onPress={onSignUpPress}
          className="mt-2"
        />
        
        <OAuth />
        
        <View className="flex-1 items-center justify-center mt-1">
            <Text className="font-JakartaMedium text-base sm:text-md text-general-200">
              ¿Ya estás registrado?
            </Text>
          <Link href="/sign-in" asChild>
            <TouchableOpacity>
              <Text className="font-JakartaMedium text-base sm:text-lg text-secondary-500 ml-1">
                Iniciar sesión
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>

      <ReactNativeModal isVisible={showSuccessModal}>
        <View className="bg-white px-5 py-6 rounded-2xl">
          <Image
            source={images.check}
            className="w-[80px] h-[80px] mx-auto my-3"
          />
          <Text className="text-xl font-JakartaBold text-center">
            Verificado
          </Text>
          <Text className="text-sm text-gray-400 font-Jakarta text-center mt-1 mb-3">
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
    </ScrollView>
  );
}
