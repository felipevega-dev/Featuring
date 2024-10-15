import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from "@/lib/supabase";

interface NotificationContextType {
  unreadCount: number;
  updateUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const updateUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('notificacion')
          .select('id', { count: 'exact' })
          .eq('usuario_id', user.id)
          .eq('leido', false);  // Cambiado de 'leida' a 'leido'

        if (error) {
          console.error('Error detallado al obtener el conteo de notificaciones:', error);
        } else {
          setUnreadCount(data?.length || 0);
        }
      } else {
        console.log('No hay usuario autenticado');
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error en updateUnreadCount:', error);
    }
  };

  useEffect(() => {
    updateUnreadCount();
    const interval = setInterval(updateUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, updateUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};