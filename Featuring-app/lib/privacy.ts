import { supabase } from './supabase';

export interface PrivacySettings {
  mostrar_edad: boolean;
  mostrar_ubicacion: boolean;
  mostrar_redes_sociales: boolean;
  mostrar_valoraciones: boolean;
  permitir_comentarios_general: boolean;
}

export const getPrivacySettings = async (userId: string): Promise<PrivacySettings> => {
  const { data, error } = await supabase
    .from('preferencias_usuario')
    .select(`
      mostrar_edad,
      mostrar_ubicacion,
      mostrar_redes_sociales,
      mostrar_valoraciones,
      permitir_comentarios_general
    `)
    .eq('usuario_id', userId)
    .single();

  if (error) {
    console.error('Error al obtener configuración de privacidad:', error);
    throw error;
  }

  return data || {
    mostrar_edad: true,
    mostrar_ubicacion: true,
    mostrar_redes_sociales: true,
    mostrar_valoraciones: true,
    permitir_comentarios_general: true
  };
};

export const updatePrivacySettings = async (
  userId: string,
  settings: Partial<PrivacySettings>
): Promise<boolean> => {
  const { error } = await supabase
    .from('preferencias_usuario')
    .update(settings)
    .eq('usuario_id', userId);

  if (error) {
    console.error('Error al actualizar configuración de privacidad:', error);
    throw error;
  }

  return true;
}; 