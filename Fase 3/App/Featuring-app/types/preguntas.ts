import { LocationObject } from 'expo-location';
import { HispanicCountry } from '../utils/countryCodes';

export interface PreguntasState {
  username: string;
  telefono: string;
  nacionalidad: HispanicCountry;
  genero: string;
  fechaNacimiento: {
    dia: number | null;
    mes: number | null;
    anio: number | null;
    edad?: number;
  };
  habilidadesMusicales: string[];
  generosMusicales: string[];
  descripcion: string;
  profileImage: string | null;
  location: (LocationObject & { ubicacion?: string }) | null;
}

export type PreguntasAction =
  | { type: 'SET_USERNAME'; payload: string }
  | { type: 'SET_TELEFONO'; payload: string }
  | { type: 'SET_NACIONALIDAD'; payload: HispanicCountry }
  | { type: 'SET_GENERO'; payload: string }
  | { type: 'SET_FECHA_NACIMIENTO'; payload: Partial<PreguntasState['fechaNacimiento']> }
  | { type: 'SET_HABILIDADES_MUSICALES'; payload: string[] }
  | { type: 'SET_GENEROS_MUSICALES'; payload: string[] }
  | { type: 'SET_DESCRIPCION'; payload: string }
  | { type: 'SET_PROFILE_IMAGE'; payload: string | null }
  | { type: 'SET_LOCATION'; payload: PreguntasState['location'] };
