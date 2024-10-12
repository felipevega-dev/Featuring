import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useValidateUsername() {
  const [usernameError, setUsernameError] = useState('');

  const validateUsername = async (username: string) => {
    if (username.length < 4 || username.length > 15) {
      setUsernameError('El nombre de usuario debe tener entre 4 y 15 caracteres');
      return false;
    }

    const { data, error } = await supabase
      .from('perfil')
      .select('username')
      .eq('username', username)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error al validar username:', error);
      setUsernameError('Error al validar el nombre de usuario');
      return false;
    }

    if (data) {
      setUsernameError('Este nombre de usuario ya está en uso');
      return false;
    }

    setUsernameError('');
    return true;
  };

  return { usernameError, validateUsername };
}
