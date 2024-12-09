import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Message } from '@/types/chat';

export function useChat(currentUserId: string | null, otherUserId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
    let subscription: any;
    let retryTimeout: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    const fetchMessages = async () => {
      try {
        if (!currentUserId) return;

        const { data, error: fetchError } = await supabase
          .from('mensaje')
          .select('*')
          .or(`and(emisor_id.eq.${currentUserId},receptor_id.eq.${otherUserId}),and(emisor_id.eq.${otherUserId},receptor_id.eq.${currentUserId})`)
          .order('fecha_envio', { ascending: false });

        if (fetchError) throw fetchError;
        setMessages(data || []);
        retryCount.current = 0;
      } catch (err) {
        setError(err as Error);
        if (retryCount.current < maxRetries) {
          retryCount.current += 1;
          retryTimeout = setTimeout(fetchMessages, 2000 * retryCount.current);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const setupSubscription = () => {
      if (!currentUserId) return;

      subscription = supabase
        .channel('public:mensaje')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'mensaje',
            filter: `or(emisor_id.eq.${currentUserId},receptor_id.eq.${currentUserId})`
          }, 
          async (payload) => {
            const newMessage = payload.new as Message;
            if (
              (newMessage.emisor_id === currentUserId && newMessage.receptor_id === otherUserId) ||
              (newMessage.emisor_id === otherUserId && newMessage.receptor_id === currentUserId)
            ) {
              await fetchMessages(); // Recargar mensajes cuando hay cambios
            }
          }
        )
        .subscribe();
    };

    setupSubscription();
    fetchMessages();

    // Configurar intervalo de actualización automática (cada 2 segundos)
    intervalId = setInterval(fetchMessages, 2000);

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [currentUserId, otherUserId]);

  const sendMessage = async (content: string, contentType: "texto" | "audio" | "imagen" | "video_chat", mediaUrl?: string) => {
    try {
      if (!currentUserId) throw new Error("Usuario no autenticado");

      const newMessage = {
        emisor_id: currentUserId,
        receptor_id: otherUserId,
        contenido: content,
        tipo_contenido: contentType,
        url_contenido: mediaUrl || null,
        fecha_envio: new Date().toISOString(),
        leido: false
      };

      const { data, error } = await supabase
        .from('mensaje')
        .insert(newMessage)
        .select()
        .single();

      if (error) throw error;

      // Actualizar inmediatamente el estado local
      if (data) {
        setMessages(prevMessages => [data, ...prevMessages]);
      }
      
      return data;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const markMessagesAsRead = async () => {
    try {
      if (!currentUserId) return;

      const { error } = await supabase
        .from('mensaje')
        .update({ leido: true })
        .match({ 
          emisor_id: otherUserId,
          receptor_id: currentUserId,
          leido: false
        });

      if (error) throw error;

      // Actualizar el estado local
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.emisor_id === otherUserId && msg.receptor_id === currentUserId
            ? { ...msg, leido: true }
            : msg
        )
      );
    } catch (err) {
      setError(err as Error);
    }
  };

  const fetchMessages = async () => {
    try {
      if (!currentUserId) return;

      const { data, error: fetchError } = await supabase
        .from('mensaje')
        .select('*')
        .or(`and(emisor_id.eq.${currentUserId},receptor_id.eq.${otherUserId}),and(emisor_id.eq.${otherUserId},receptor_id.eq.${currentUserId})`)
        .order('fecha_envio', { ascending: false });

      if (fetchError) throw fetchError;
      setMessages(data || []);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return { messages, isLoading, error, sendMessage, markMessagesAsRead, fetchMessages };
} 