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

export const UnreadMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  const updateUnreadMessagesCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { count, error } = await supabase
        .from('mensaje')
        .select('*', { count: 'exact', head: true })
        .eq('receptor_id', user.id)
        .eq('leido', false);

      if (error) {
        console.error('Error fetching unread messages:', error);
      } else {
        setUnreadMessagesCount(count || 0);
      }
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
