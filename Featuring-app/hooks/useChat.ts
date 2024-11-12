import { useState, useEffect, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from "@/lib/supabase";
import { Message } from '@/types/chat';

export const useChat = (currentUserId: string | null, otherId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!currentUserId) return;
    
    try {
      setIsLoading(true);
      
      const { data: bloqueos } = await supabase
        .from("bloqueo")
        .select("*")
        .or(`and(usuario_id.eq.${currentUserId},bloqueado_id.eq.${otherId}),and(usuario_id.eq.${otherId},bloqueado_id.eq.${currentUserId})`);

      if (bloqueos && bloqueos.length > 0) {
        setMessages([]);
        return;
      }

      const { data, error } = await supabase
        .from("mensaje")
        .select("*")
        .or(
          `and(emisor_id.eq.${currentUserId},receptor_id.eq.${otherId}),and(emisor_id.eq.${otherId},receptor_id.eq.${currentUserId})`
        )
        .order("fecha_envio", { ascending: false })
        .limit(20);

      if (error) throw error;

      await supabase
        .from("mensaje")
        .update({ leido: true })
        .eq('receptor_id', currentUserId)
        .eq('emisor_id', otherId)
        .eq('leido', false);

      setMessages(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, otherId]);

  const sendMessage = useCallback(async (content: string, type: string, url?: string) => {
    if (!currentUserId || (!content.trim() && type === "texto")) return;

    try {
      const { data, error } = await supabase
        .from("mensaje")
        .insert({
          emisor_id: currentUserId,
          receptor_id: otherId,
          contenido: content.trim(),
          tipo_contenido: type,
          url_contenido: url || null,
        })
        .select()
        .single();

      if (error) throw error;
      setMessages(prev => [data, ...prev]);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return null;
    }
  }, [currentUserId, otherId]);

  useEffect(() => {
    let channel: RealtimeChannel;
    
    const initialize = async () => {
      await fetchMessages();
      
      channel = supabase
        .channel(`chat-${otherId}-${currentUserId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'mensaje',
          filter: `or(and(emisor_id.eq.${currentUserId},receptor_id.eq.${otherId}),and(emisor_id.eq.${otherId},receptor_id.eq.${currentUserId}))`,
        }, payload => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => [payload.new as Message, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
          }
        })
        .subscribe();
    };

    if (currentUserId) {
      initialize();
    }

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [currentUserId, otherId, fetchMessages]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    fetchMessages
  };
}; 