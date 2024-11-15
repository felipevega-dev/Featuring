import React, { useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import InputField from '@/components/InputField';
import CustomButton from '@/components/CustomButton';
import { icons } from '@/constants';

export default function ChangePassword() {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const router = useRouter();

  const handleSendVerificationCode = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor, ingresa tu correo electrónico');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;

      Alert.alert('Éxito', 'Se ha enviado un código de verificación a tu correo electrónico.');
      setStep(2);
    } catch (error) {
      console.error('Error al enviar el código de verificación:', error);
      Alert.alert('Error', 'No se pudo enviar el código de verificación. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      Alert.alert('Error', 'Por favor, ingresa el código de verificación');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: verificationCode,
        type: 'recovery'
      });

      if (error) throw error;

      setStep(3);
    } catch (error) {
      console.error('Error al verificar el código:', error);
      Alert.alert('Error', 'Código de verificación inválido. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Error', 'Las nuevas contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) throw error;

      Alert.alert('Éxito', 'Tu contraseña ha sido actualizada', [
        { text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }
      ]);
    } catch (error) {
      console.error('Error al cambiar la contraseña:', error);
      Alert.alert('Error', 'No se pudo cambiar la contraseña. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-5 mt-10">
        <Text className="text-2xl font-bold mb-5">Cambiar Contraseña</Text>
        {step === 1 && (
          <View>
            <InputField
              label="Correo Electrónico"
              placeholder="Ingresa tu correo electrónico"
              icon={icons.email}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <CustomButton
              title="Enviar Código de Verificación"
              onPress={handleSendVerificationCode}
              disabled={isLoading}
            />
          </View>
        )}
        {step === 2 && (
          <View>
            <InputField
              label="Código de Verificación"
              placeholder="Ingresa el código recibido por correo"
              icon={icons.lock}
              value={verificationCode}
              onChangeText={setVerificationCode}
            />
            <CustomButton
              title="Verificar Código"
              onPress={handleVerifyCode}
              disabled={isLoading}
            />
          </View>
        )}
        {step === 3 && (
          <View>
            <InputField
              label="Nueva Contraseña"
              placeholder="Ingresa tu nueva contraseña"
              icon={icons.lock}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <InputField
              label="Confirmar Nueva Contraseña"
              placeholder="Confirma tu nueva contraseña"
              icon={icons.lock}
              secureTextEntry
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
            />
            <CustomButton
              title="Cambiar Contraseña"
              onPress={handleChangePassword}
              disabled={isLoading}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
