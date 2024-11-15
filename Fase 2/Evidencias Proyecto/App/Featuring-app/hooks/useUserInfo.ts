import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useUserInfo = (userId?: string) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUserName, setOtherUserName] = useState('');
  const [otherUserAvatar, setOtherUserAvatar] = useState<string | null>(null);

  const getCurrentUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  }, []);

  const getOtherUserInfo = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('perfil')
      .select('username, foto_perfil')
      .eq('usuario_id', userId)
      .single();

    if (error) console.error('Error al obtener la información del usuario:', error);
    else if (data) {
      setOtherUserName(data.username);
      setOtherUserAvatar(data.foto_perfil);
    }
  }, [userId]);

  useEffect(() => {
    getCurrentUser();
    if (userId) getOtherUserInfo();
  }, [userId, getCurrentUser, getOtherUserInfo]);

  return { currentUserId, otherUserName, otherUserAvatar, getCurrentUser, getOtherUserInfo };
};
