import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useValidateUsername } from '@/hooks/useValidateUsername';
import { PreguntasState, PreguntasAction } from '@/types/preguntas';
import { hispanicCountryCodes, HispanicCountry, phoneNumberMaxLength } from '../../../utils/countryCodes';
import { Picker } from '@react-native-picker/picker';
import { checkPhoneNumberExists } from '@/utils/profileUtils';

interface SlideUsernameProps {
  state: PreguntasState;
  dispatch: React.Dispatch<PreguntasAction>;
  onValidationComplete: (isValid: boolean) => void;
}

export function SlideUsername({ state, dispatch, onValidationComplete }: SlideUsernameProps) {
  const { username, telefono, nacionalidad } = state;
  const { usernameError, validateUsername } = useValidateUsername();
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!nacionalidad) {
      dispatch({ type: 'SET_NACIONALIDAD', payload: 'Chile' });
    }
  }, []);

  useEffect(() => {
    if (nacionalidad) {
      const newCountryCode = hispanicCountryCodes[nacionalidad as HispanicCountry];
      setCountryCode(newCountryCode);
      setPhoneNumber('');
    }
  }, [nacionalidad]);

  const validatePhoneNumber = async (number: string) => {
    const maxLength = phoneNumberMaxLength[nacionalidad as HispanicCountry] - countryCode.length;
    if (number.length === 0) {
      setPhoneError('El número de teléfono es obligatorio');
      onValidationComplete(false);
    } else if (number.length > maxLength) {
      setPhoneError(`El número debe tener máximo ${maxLength} dígitos para ${nacionalidad}`);
      onValidationComplete(false);
    } else {
      setPhoneError(null);
      setPhoneNumber(number);
      const fullNumber = `${countryCode}${number}`;
      dispatch({ type: 'SET_TELEFONO', payload: fullNumber });

      if (number.length === maxLength) {
        setIsValidating(true);
        try {
          const exists = await checkPhoneNumberExists(fullNumber);
          if (exists) {
            setPhoneError('Este número de teléfono ya está registrado');
            onValidationComplete(false);
          } else {
            validateForm(username, fullNumber);
          }
        } catch (error) {
          console.error('Error al validar el número de teléfono:', error);
          Alert.alert('Error', 'Hubo un problema al validar el número de teléfono. Por favor, inténtalo de nuevo.');
          onValidationComplete(false);
        } finally {
          setIsValidating(false);
        }
      } else {
        onValidationComplete(false);
      }
    }
  };

  const validateForm = async (username: string, phoneNumber: string) => {
    const isUsernameValid = await validateUsername(username);
    if (!isUsernameValid) {
      onValidationComplete(false);
      return;
    }

    if (phoneNumber.length === 0) {
      Alert.alert('Error', 'El número de teléfono es obligatorio');
      onValidationComplete(false);
    } else {
      onValidationComplete(true);
    }
  };

  const handleUsernameChange = async (text: string) => {
    dispatch({ type: 'SET_USERNAME', payload: text });
    await validateUsername(text);
  };

  return (
    <View className="flex-1 justify-center items-center mb-10 p-4">
      <Text className="text-2xl text-primary-700 font-JakartaBold mb-6">
        Ingresa tu información
      </Text>
      <TextInput
        className="border-2 rounded-full bg-primary-200 border-primary-500 p-4 w-full mb-4"
        placeholder="Tu nombre artístico (4-15 caracteres)"
        value={username}
        onChangeText={handleUsernameChange}
        maxLength={15}
      />
      {usernameError ? (
        <Text className="text-danger-600 mt-2 mb-4">{usernameError}</Text>
      ) : null}
      <View className="w-full mb-4 border-2 rounded-full border-primary-500 overflow-hidden">
        <Picker
          selectedValue={nacionalidad}
          onValueChange={(itemValue) => 
            dispatch({ type: 'SET_NACIONALIDAD', payload: itemValue as HispanicCountry })
          }
          style={styles.picker}
        >
          {Object.keys(hispanicCountryCodes).map((country) => (
            <Picker.Item key={country} label={country} value={country} />
          ))}
        </Picker>
      </View>
      <View className="flex-row w-full mb-4">
        <TextInput
          className="border-2 rounded-l-full bg-primary-200 border-primary-500 p-4"
          value={countryCode}
          editable={false}
          style={styles.countryCodeInput}
        />
        <TextInput
          className="flex-1 border-2 rounded-r-full bg-primary-200 border-secondary-500 p-4"
          placeholder="Número de teléfono"
          value={phoneNumber}
          onChangeText={validatePhoneNumber}
          keyboardType="phone-pad"
        />
      </View>
      {phoneError ? (
        <Text className="text-danger-600 mt-2 mb-4">{phoneError}</Text>
      ) : null}
      {isValidating && (
        <Text className="text-primary-600 mt-2 mb-4">Validando datos...</Text>
      )}
      <View className="mb-3 mt-4">
        <FontAwesome name="user-circle" size={80} color="#6D29D2" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  picker: {
    backgroundColor: '#E6E1F1',
    color: '#4A148C',
  },
  countryCodeInput: {
    minWidth: 60,
    width: 'auto',
    textAlign: 'center',
  },
});
