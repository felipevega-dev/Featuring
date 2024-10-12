import { useState } from 'react';

export function useDatePicker() {
  const [diaOpen, setDiaOpen] = useState(false);
  const [mesOpen, setMesOpen] = useState(false);
  const [anioOpen, setAnioOpen] = useState(false);

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

  return {
    diaOpen,
    mesOpen,
    anioOpen,
    setDiaOpen,
    setMesOpen,
    setAnioOpen,
    dias,
    meses,
    anios,
  };
}
