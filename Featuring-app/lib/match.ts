import { supabase } from './supabase';

export interface MatchSettings {
  match_filtrar_edad: boolean;
  match_filtrar_sexo: boolean;
  match_rango_edad: number[];
  match_sexo_preferido: 'M' | 'F' | 'O' | 'todos';
  match_filtrar_nacionalidad: boolean;
  match_nacionalidades: string[];
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
      match_nacionalidades
    `)
    .eq('usuario_id', userId)
    .single();

  if (error) {
    console.error('Error al obtener configuración de match:', error);
    throw error;
  }

  return data || {
    match_filtrar_edad: false,
    match_filtrar_sexo: false,
    match_rango_edad: [18, 99],
    match_sexo_preferido: 'todos',
    match_filtrar_nacionalidad: false,
    match_nacionalidades: []
  };
};

export const updateMatchSettings = async (
  userId: string,
  settings: Partial<MatchSettings>
): Promise<boolean> => {
  const { error } = await supabase
    .from('preferencias_usuario')
    .update(settings)
    .eq('usuario_id', userId);

  if (error) {
    console.error('Error al actualizar configuración de match:', error);
    throw error;
  }

  return true;
}; 