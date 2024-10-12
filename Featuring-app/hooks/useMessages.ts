import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Message } from '@/types/message';

export const useMessages = (chatId: string, currentUserId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!currentUserId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('mensaje')
        .select('*')
        .or(`and(emisor_id.eq.${currentUserId},receptor_id.eq.${chatId}),and(emisor_id.eq.${chatId},receptor_id.eq.${currentUserId})`)
        .order('fecha_envio', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error al obtener mensajes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [chatId, currentUserId]);

  const sendMessage = useCallback(async (content: string, type: 'texto' | 'audio') => {
    if (!currentUserId) return;
    try {
      const { data, error } = await supabase
        .from('mensaje')
        .insert({
          emisor_id: currentUserId,
          receptor_id: chatId,
          contenido: content,
          tipo_contenido: type,
        })
        .select();

      if (error) throw error;
      if (data) setMessages((prevMessages) => [data[0], ...prevMessages]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  }, [chatId, currentUserId]);

  const deleteMessage = useCallback(async (message: Message) => {
    try {
      const { error } = await supabase
        .from('mensaje')
        .delete()
        .eq('id', message.id);

      if (error) throw error;
      setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== message.id));
    } catch (error) {
      console.error('Error al eliminar mensaje:', error);
    }
  }, []);

  const loadMoreMessages = useCallback(async (limit: number) => {
    // Implementar la lógica para cargar más mensajes
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return { messages, isLoading, fetchMessages, sendMessage, deleteMessage, loadMoreMessages };
};
