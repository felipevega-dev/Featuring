import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const PROHIBITED_WORDS = [
  'admin', 'root', 'moderator', 'fuck', 'shit', 'ass', 'bitch', 'cunt', 'dick',
  'pussy', 'cock', 'tits', 'boobs', 'whore', 'slut', 'bastard', 'puta', 'puto',
  'mierda', 'culo', 'polla', 'coño', 'pene', 'vagina', 'gilipollas', 'capullo',
  'maricón', 'chingar','verga', 'culero', 'mamón', 'cabrona', 'hijueputa', 'malparido', 'concha',
  'pelotudo', 'chinga', 'follar', 'pinga','maricon','maraco','maraca','weco','hueco','putita','putito'
  ,'maricona','featuring','marico','marica'
];

export function useValidateUsername() {
  const [usernameError, setUsernameError] = useState('');

  const validateUsername = async (username: string) => {
    // Limpiar error previo
    setUsernameError('');

    // Verificar longitud
    if (username.length < 4 || username.length > 15) {
      setUsernameError('El nombre de usuario debe tener entre 4 y 15 caracteres');
      return false;
    }

    // Verificar que comience con una letra
    if (!/^[a-zA-Z]/.test(username)) {
      setUsernameError('El nombre de usuario debe comenzar con una letra');
      return false;
    }

    // Verificar caracteres permitidos
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setUsernameError('El nombre de usuario solo puede contener letras, números, guiones y guiones bajos');
      return false;
    }

    // Verificar que no tenga más de dos caracteres especiales consecutivos
    if (/[_-]{3,}/.test(username)) {
      setUsernameError('El nombre de usuario no puede contener más de dos caracteres especiales consecutivos');
      return false;
    }

    // Verificar palabras prohibidas
    const lowerUsername = username.toLowerCase();
    for (const word of PROHIBITED_WORDS) {
      const regex = new RegExp(word.split('').join('[^a-zA-Z]*'), 'i');
      if (regex.test(lowerUsername)) {
        setUsernameError('El nombre de usuario contiene palabras no permitidas');
        return false;
      }
    }

    // Verificar si el username ya existe en la base de datos
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

    return true;
  };

  return { usernameError, validateUsername };
}
