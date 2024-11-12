import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UnreadMessagesContextType {
  unreadMessagesCount: number;
  updateUnreadMessagesCount: () => Promise<void>;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined);

export const useUnreadMessages = () => {
  const context = useContext(UnreadMessagesContext);
  if (!context) {
    throw new Error('useUnreadMessages must be used within an UnreadMessagesProvider');
  }
  return context;
};

export const UnreadMessagesProvider = ({ children }: { children: React.ReactNode }) => {
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const updateUnreadMessagesCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count, error } = await supabase
          .from('mensaje')
          .select('*', { count: 'exact' })
          .eq('receptor_id', user.id)
          .eq('leido', false);

        if (error) {
          console.error('Error al obtener mensajes no leídos:', error);
        } else {
          setUnreadMessagesCount(count || 0);
        }
      }
    } catch (error) {
      console.error('Error en updateUnreadMessagesCount:', error);
    }
  };

  useEffect(() => {
    updateUnreadMessagesCount();
    const channel = supabase
      .channel('unread_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensaje' }, () => {
        updateUnreadMessagesCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <UnreadMessagesContext.Provider value={{ unreadMessagesCount, updateUnreadMessagesCount }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
