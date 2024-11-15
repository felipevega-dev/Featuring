import { calcularEdad } from './dateUtils';

export function validatePhoneNumber(number: string): boolean {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(number);
}

export function validateAge(dia: number, mes: number, anio: number): boolean {
  const edad = calcularEdad(dia, mes, anio);
  return edad >= 13 && edad < 100;
}
