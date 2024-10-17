import React, { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import { PreguntasState, PreguntasAction } from '@/types/preguntas';
import { useDatePicker } from '@/hooks/useDatePicker';
import { commonStyles } from '@/styles/commonStyles';

interface SlideFechaNacimientoProps {
  state: PreguntasState;
  dispatch: React.Dispatch<PreguntasAction>;
  onValidationComplete: (isValid: boolean) => void;
}

export function SlideFechaNacimiento({ state, dispatch, onValidationComplete }: SlideFechaNacimientoProps) {
  const { fechaNacimiento } = state;
  const {
    diaOpen, mesOpen, anioOpen,
    setDiaOpen, setMesOpen, setAnioOpen,
    dia, mes, anio,
    setDia, setMes, setAnio,
    dias, meses, anios,
    calcularEdad
  } = useDatePicker();

  const [edadCalculada, setEdadCalculada] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (dia !== null && mes !== null && anio !== null) {
      const edad = calcularEdad(dia, mes, anio);
      setEdadCalculada(edad);
      if (edad < 13) {
        setError("Lo sentimos, tienes que tener mínimo 13 años para utilizar Featuring 🙁.");
        onValidationComplete(false);
      } else {
        setError(null);
        dispatch({ type: 'SET_FECHA_NACIMIENTO', payload: { dia, mes, anio, edad } });
        onValidationComplete(true);
      }
    } else {
      setEdadCalculada(null);
      setError("Por favor, selecciona un valor válido para día, mes y año.");
      onValidationComplete(false);
    }
  }, [dia, mes, anio]);

  return (
    <View className="flex-1 justify-center items-center bg-white p-4 mb-44">
      <View className="mb-1 text-center items-center"> 
        <FontAwesome name="birthday-cake" size={60} color="#6D29D2" />
        {edadCalculada !== null && edadCalculada >= 13 && (
          <Text className="text-lg text-secondary-600 font-JakartaBold mt-2">
            Tienes {edadCalculada} años! 👌
          </Text>
        )}
        {error && (
          <Text className="text-lg text-danger-600 font-JakartaBold mt-2">
            {error}
          </Text>
        )}
      </View>
      <Text className={commonStyles.slideTitle}>
        Fecha de Nacimiento
      </Text>
      <View className="flex-row justify-between w-full mb-5">
        <View className="w-1/4">
          <DropDownPicker
            open={diaOpen}
            value={dia}
            items={dias}
            setOpen={setDiaOpen}
            setValue={setDia}
            placeholder="Día"
            zIndex={3000}
            zIndexInverse={1000}
            style={{
              backgroundColor: "#E6E1F1",
              borderColor: "#6D29D2",
            }}
            textStyle={{
              fontFamily: "Jakarta-Medium",
              color: "#4A148C",
            }}
            dropDownContainerStyle={{
              backgroundColor: "#F3F0F8",
              borderColor: "#6D29D2",
            }}
          />
        </View>
        <View className="w-2/5">
          <DropDownPicker
            open={mesOpen}
            value={mes}
            items={meses}
            setOpen={setMesOpen}
            setValue={setMes}
            placeholder="Mes"
            zIndex={2000}
            zIndexInverse={2000}
            style={{
              backgroundColor: "#E6E1F1",
              borderColor: "#6D29D2",
            }}
            textStyle={{
              fontFamily: "Jakarta-Medium",
              color: "#4A148C",
            }}
            dropDownContainerStyle={{
              backgroundColor: "#F3F0F8",
              borderColor: "#6D29D2",
            }}
          />
        </View>
        <View className="w-1/3">
          <DropDownPicker
            open={anioOpen}
            value={anio}
            items={anios}
            setOpen={setAnioOpen}
            setValue={setAnio}
            placeholder="Año"
            zIndex={1000}
            zIndexInverse={3000}
            style={{
              backgroundColor: "#E6E1F1",
              borderColor: "#6D29D2",
            }}
            textStyle={{
              fontFamily: "Jakarta-Medium",
              color: "#4A148C",
            }}
            dropDownContainerStyle={{
              backgroundColor: "#F3F0F8",
              borderColor: "#6D29D2",
            }}
          />
        </View>
      </View>
    </View>
  );
}
