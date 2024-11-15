import React, { useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import InputField from '@/components/InputField';
import CustomButton from '@/components/CustomButton';
import { icons } from '@/constants';

export default function ChangePassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
      <View className="p-5">
        <Text className="text-2xl font-bold mb-5">Cambiar Contraseña</Text>
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
    </ScrollView>
  );
}
