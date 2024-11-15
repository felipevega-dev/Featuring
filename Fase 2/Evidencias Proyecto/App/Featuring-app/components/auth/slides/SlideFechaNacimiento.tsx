import React, { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import { PreguntasState, PreguntasAction } from '@/types/preguntas';
import { useDatePicker } from '@/hooks/useDatePicker';

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
      setError(null);
      onValidationComplete(false);
    }
  }, [dia, mes, anio]);

  return (
    <View className="flex-1 justify-center items-center px-4 py-6 sm:py-8 md:py-10 mb-14">
      <View className="mb-4 sm:mb-6 md:mb-8">
      {edadCalculada !== null && edadCalculada >= 13 && (
        <Text className="text-lg sm:text-xl text-secondary-600 font-JakartaBold mt-2">
          Tienes {edadCalculada} años! 👌
        </Text>
      )}
      {error && (
        <Text className="text-base sm:text-lg text-danger-600 font-JakartaBold mt-2 text-center">
          {error}
        </Text>
      )}
      </View>
      <View className="mb-2 sm:mb-6 md:mb-8"> 
        <FontAwesome name="birthday-cake" size={50} color="#6D29D2" />
      </View>
      <Text className="text-xl sm:text-2xl md:text-3xl text-primary-700 font-JakartaBold mb-4 sm:mb-6 md:mb-8">
        Fecha de Nacimiento
      </Text>
      <View className="flex-row justify-between w-full mb-14 sm:mb-16 md:mb-20">
        <View className="w-1/4 pr-1">
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
              height: 40,
            }}
            textStyle={{
              fontFamily: "Jakarta-Medium",
              color: "#4A148C",
              fontSize: 14,
            }}
            dropDownContainerStyle={{
              backgroundColor: "#F3F0F8",
              borderColor: "#6D29D2",
              maxHeight: 140,
            }}
            itemSeparator={true}
            itemSeparatorStyle={{
              backgroundColor: "#E6E1F1",
              height: 1,
            }}
            listItemContainerStyle={{
              height: 35,
            }}
          />
        </View>
        <View className="w-2/5 px-1">
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
              height: 40,
            }}
            textStyle={{
              fontFamily: "Jakarta-Medium",
              color: "#4A148C",
              fontSize: 14,
            }}
            dropDownContainerStyle={{
              backgroundColor: "#F3F0F8",
              borderColor: "#6D29D2",
              maxHeight: 140,
            }}
            itemSeparator={true}
            itemSeparatorStyle={{
              backgroundColor: "#E6E1F1",
              height: 1,
            }}
            listItemContainerStyle={{
              height: 35,
            }}
          />
        </View>
        <View className="w-1/3 pl-1">
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
              height: 40,
            }}
            textStyle={{
              fontFamily: "Jakarta-Medium",
              color: "#4A148C",
              fontSize: 14,
            }}
            dropDownContainerStyle={{
              backgroundColor: "#F3F0F8",
              borderColor: "#6D29D2",
              maxHeight: 140,
            }}
            itemSeparator={true}
            itemSeparatorStyle={{
              backgroundColor: "#E6E1F1",
              height: 1,
            }}
            listItemContainerStyle={{
              height: 35,
            }}
          />
        </View>
      </View>
    </View>
  );
}
