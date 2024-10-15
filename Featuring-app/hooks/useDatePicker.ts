import { useState } from 'react';

export function useDatePicker() {
  const [diaOpen, setDiaOpen] = useState(false);
  const [mesOpen, setMesOpen] = useState(false);
  const [anioOpen, setAnioOpen] = useState(false);
  const [dia, setDia] = useState<number | null>(null);
  const [mes, setMes] = useState<number | null>(null);
  const [anio, setAnio] = useState<number | null>(null);

  const dias = Array.from({ length: 31 }, (_, i) => ({
    label: `${i + 1}`,
    value: i + 1,
  }));

  const meses = [
    { label: "Enero", value: 1 },
    { label: "Febrero", value: 2 },
    { label: "Marzo", value: 3 },
    { label: "Abril", value: 4 },
    { label: "Mayo", value: 5 },
    { label: "Junio", value: 6 },
    { label: "Julio", value: 7 },
    { label: "Agosto", value: 8 },
    { label: "Septiembre", value: 9 },
    { label: "Octubre", value: 10 },
    { label: "Noviembre", value: 11 },
    { label: "Diciembre", value: 12 },
  ];

  const anios = Array.from({ length: 100 }, (_, i) => ({
    label: `${2023 - i}`,
    value: 2023 - i,
  }));

  const calcularEdad = (dia: number, mes: number, anio: number): number => {
    const fechaNacimiento = new Date(anio, mes - 1, dia);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const m = hoy.getMonth() - fechaNacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  return {
    diaOpen,
    mesOpen,
    anioOpen,
    setDiaOpen,
    setMesOpen,
    setAnioOpen,
    dia,
    mes,
    anio,
    setDia,
    setMes,
    setAnio,
    dias,
    meses,
    anios,
    calcularEdad,
  };
}
