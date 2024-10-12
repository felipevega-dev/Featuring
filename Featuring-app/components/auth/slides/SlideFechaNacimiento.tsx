import React from 'react';
import { View, Text } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import DropDownPicker from 'react-native-dropdown-picker';
import { PreguntasState, PreguntasAction } from '@/types/preguntas';
import { useDatePicker } from '@/hooks/useDatePicker';
import { commonStyles } from '@/styles/commonStyles';

interface SlideFechaNacimientoProps {
  state: PreguntasState;
  dispatch: React.Dispatch<PreguntasAction>;
}

export function SlideFechaNacimiento({ state, dispatch }: SlideFechaNacimientoProps) {
  const { fechaNacimiento } = state;
  const { diaOpen, mesOpen, anioOpen, setDiaOpen, setMesOpen, setAnioOpen, dias, meses, anios } = useDatePicker();

  const handleSetValue = (type: 'dia' | 'mes' | 'anio') => (value: number | null) => {
    if (value !== null) {
      dispatch({ type: 'SET_FECHA_NACIMIENTO', payload: { [type]: value } });
    }
  };

  return (
    <View className="flex-1 justify-center items-center bg-white p-4">
      <View className="mb-4">
        <FontAwesome name="birthday-cake" size={60} color="#6D29D2" />
      </View>
      <Text className={commonStyles.slideTitle}>
        Fecha de Nacimiento
      </Text>
      <View className="flex-row justify-between w-full mb-36">
        <View className="w-1/4">
          <DropDownPicker
            open={diaOpen}
            value={fechaNacimiento.dia}
            items={dias}
            setOpen={setDiaOpen}
            setValue={handleSetValue('dia')}
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
            value={fechaNacimiento.mes}
            items={meses}
            setOpen={setMesOpen}
            setValue={handleSetValue('mes')}
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
            value={fechaNacimiento.anio}
            items={anios}
            setOpen={setAnioOpen}
            setValue={handleSetValue('anio')}
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
