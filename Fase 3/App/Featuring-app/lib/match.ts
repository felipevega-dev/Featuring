import { supabase } from './supabase';

export interface MatchSettings {
  match_filtrar_edad: boolean;
  match_filtrar_sexo: boolean;
  match_rango_edad: number[];
  match_sexo_preferido: 'M' | 'F' | 'O' | 'todos';
  match_filtrar_nacionalidad: boolean;
  match_nacionalidades: string[];
  sin_limite_distancia: boolean;
  preferencias_distancia: number;
  preferencias_genero: string[];
  preferencias_habilidad: string[];
}

export const getMatchSettings = async (userId: string): Promise<MatchSettings> => {
  const { data, error } = await supabase
    .from('preferencias_usuario')
    .select(`
      match_filtrar_edad,
      match_filtrar_sexo,
      match_rango_edad,
      match_sexo_preferido,
      match_filtrar_nacionalidad,
      match_nacionalidades,
      sin_limite_distancia,
      preferencias_distancia,
      preferencias_genero,
      preferencias_habilidad
    `)
    .eq('usuario_id', userId)
    .single();

  if (error) {
    console.error('Error al obtener configuración de match:', error);
    throw error;
  }

  return {
    match_filtrar_edad: data?.match_filtrar_edad ?? false,
    match_filtrar_sexo: data?.match_filtrar_sexo ?? false,
    match_rango_edad: data?.match_rango_edad ?? [18, 99],
    match_sexo_preferido: data?.match_sexo_preferido ?? 'todos',
    match_filtrar_nacionalidad: data?.match_filtrar_nacionalidad ?? false,
    match_nacionalidades: data?.match_nacionalidades ?? [],
    sin_limite_distancia: data?.sin_limite_distancia ?? false,
    preferencias_distancia: data?.preferencias_distancia ?? 10,
    preferencias_genero: data?.preferencias_genero ?? [],
    preferencias_habilidad: data?.preferencias_habilidad ?? []
  };
};

export const updateMatchSettings = async (
  userId: string,
  settings: Partial<MatchSettings>
): Promise<boolean> => {
  const sanitizedSettings = Object.entries(settings).reduce((acc, [key, value]) => {
    if (key === 'preferencias_distancia') {
      return { ...acc, [key]: Number(value) };
    }
    if (key === 'preferencias_genero' || key === 'preferencias_habilidad') {
      return { ...acc, [key]: Array.isArray(value) ? value : [] };
    }
    return { ...acc, [key]: value };
  }, {});

  const { error } = await supabase
    .from('preferencias_usuario')
    .update(sanitizedSettings)
    .eq('usuario_id', userId);

  if (error) {
    console.error('Error al actualizar configuración de match:', error);
    throw error;
  }

  return true;
}; 