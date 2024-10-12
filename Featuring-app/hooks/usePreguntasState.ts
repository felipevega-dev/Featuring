import { useReducer } from 'react';
import { PreguntasState, PreguntasAction } from '@/types/preguntas';

const initialState: PreguntasState = {
  username: '',
  telefono: '',
  genero: '',
  fechaNacimiento: { dia: null, mes: null, anio: null },
  habilidadesMusicales: [],
  generosMusicales: [],
  descripcion: '',
  profileImage: null,
  location: null,
};

function preguntasReducer(state: PreguntasState, action: PreguntasAction): PreguntasState {
  switch (action.type) {
    case 'SET_USERNAME':
      return { ...state, username: action.payload };
    case 'SET_TELEFONO':
      return { ...state, telefono: action.payload };
    case 'SET_GENERO':
      return { ...state, genero: action.payload };
    case 'SET_FECHA_NACIMIENTO':
      return { ...state, fechaNacimiento: { ...state.fechaNacimiento, ...action.payload } };
    case 'SET_HABILIDADES_MUSICALES':
      return { ...state, habilidadesMusicales: action.payload };
    case 'SET_GENEROS_MUSICALES':
      return { ...state, generosMusicales: action.payload };
    case 'SET_DESCRIPCION':
      return { ...state, descripcion: action.payload };
    case 'SET_PROFILE_IMAGE':
      return { ...state, profileImage: action.payload };
    case 'SET_LOCATION':
      return { ...state, location: action.payload };
    default:
      return state;
  }
}

export function usePreguntasState() {
  const [state, dispatch] = useReducer(preguntasReducer, initialState);
  return { state, dispatch };
}
