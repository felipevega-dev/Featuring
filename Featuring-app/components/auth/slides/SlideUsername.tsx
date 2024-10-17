import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useValidateUsername } from '@/hooks/useValidateUsername';
import { PreguntasState, PreguntasAction } from '@/types/preguntas';
import { hispanicCountryCodes, HispanicCountry, phoneNumberMaxLength } from '../../../utils/countryCodes';
import { Picker } from '@react-native-picker/picker';

interface SlideUsernameProps {
  state: PreguntasState;
  dispatch: React.Dispatch<PreguntasAction>;
}

export function SlideUsername({ state, dispatch }: SlideUsernameProps) {
  const { username, telefono, nacionalidad } = state;
  const { usernameError, validateUsername } = useValidateUsername();
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

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

  const validatePhoneNumber = (number: string) => {
    const maxLength = phoneNumberMaxLength[nacionalidad as HispanicCountry] - countryCode.length;
    if (number.length > maxLength) {
      setPhoneError(`El número debe tener máximo ${maxLength} dígitos para ${nacionalidad}`);
    } else {
      setPhoneError(null);
    }
    setPhoneNumber(number);
    dispatch({ type: 'SET_TELEFONO', payload: `${countryCode}${number}` });
  };

  return (
    <View className="flex-1 justify-center items-center mb-10 p-4">
      <Text className="text-2xl text-primary-700 font-JakartaBold mb-6">
        Ingresa tu información
      </Text>
      <TextInput
        className="border-2 rounded-full bg-primary-200 border-primary-500 p-4 w-full mb-4"
        placeholder="Tu nombre artístico (username)"
        value={username}
        onChangeText={(text) => {
          dispatch({ type: 'SET_USERNAME', payload: text });
          validateUsername(text);
        }}
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
