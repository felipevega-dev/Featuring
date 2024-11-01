import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from "@/lib/supabase";

interface CollaborationContextType {
  pendingCollaborations: number;
  updatePendingCount: () => Promise<void>;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

export const CollaborationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingCollaborations, setPendingCollaborations] = useState(0);

  const updatePendingCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count, error } = await supabase
          .from('colaboracion')
          .select('*', { count: 'exact' })
          .eq('usuario_id2', user.id)
          .eq('estado', 'pendiente');

        if (error) {
          console.error('Error al obtener conteo de colaboraciones:', error);
        } else {
          setPendingCollaborations(count || 0);
        }
      }
    } catch (error) {
      console.error('Error en updatePendingCount:', error);
    }
  };

  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <CollaborationContext.Provider value={{ pendingCollaborations, updatePendingCount }}>
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
}; 