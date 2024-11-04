import { supabase } from '@/lib/supabase';

export type NotificationType = 
  | 'like_cancion'
  | 'comentario_cancion'
  | 'like_comentario_cancion'
  | 'solicitud_colaboracion'
  | 'colaboracion_aceptada'
  | 'colaboracion_rechazada'
  | 'match'
  | 'like'
  | 'like_video'
  | 'comentario_video'
  | 'like_comentario_video'
  | 'respuesta_comentario'
  | 'respuesta_comentario_video'
  | 'nuevo_seguidor';

export interface NotificationRedirect {
  route: string;
  getParams: (notification: {
    tipo_notificacion: NotificationType;
    contenido_id: number;
    usuario_origen_id: string;
  }) => Promise<Record<string, string | number>> | Record<string, string | number>;
}

export const NOTIFICATION_REDIRECTS: Record<NotificationType, NotificationRedirect> = {
  like_cancion: {
    route: '/(root)/(tabs)/comunidad',
    getParams: (notification) => ({ 
      scrollToId: notification.contenido_id.toString()
    })
  },
  comentario_cancion: {
    route: '/(root)/(tabs)/comunidad',
    getParams: (notification) => ({ 
      scrollToId: notification.contenido_id.toString(),
      showComments: 'true'
    })
  },
  like_comentario_cancion: {
    route: '/(root)/(tabs)/comunidad',
    getParams: async (notification) => {
      const { data: comentario } = await supabase
        .from('comentario_cancion')
        .select('cancion_id')
        .eq('id', notification.contenido_id)
        .single();
      return { 
        scrollToId: comentario?.cancion_id.toString(),
        showComments: 'true'
      };
    }
  },
  respuesta_comentario: {
    route: '/(root)/(tabs)/comunidad',
    getParams: async (notification) => {
      const { data: comentario } = await supabase
        .from('comentario_cancion')
        .select('cancion_id')
        .eq('id', notification.contenido_id)
        .single();
      return { 
        scrollToId: comentario?.cancion_id.toString(),
        showComments: 'true'
      };
    }
  },
  like_video: {
    route: '/(root)/(tabs)/watch',
    getParams: (notification) => ({ 
      scrollToId: notification.contenido_id.toString()
    })
  },
  comentario_video: {
    route: '/(root)/(tabs)/watch',
    getParams: (notification) => ({ 
      scrollToId: notification.contenido_id.toString(),
      showComments: 'true'
    })
  },
  like_comentario_video: {
    route: '/(root)/(tabs)/watch',
    getParams: async (notification) => {
      const { data } = await supabase
        .from('comentario_video')
        .select('video_id')
        .eq('id', notification.contenido_id)
        .single();
      return { 
        scrollToId: data?.video_id.toString(),
        showComments: 'true'
      };
    }
  },
  respuesta_comentario_video: {
    route: '/(root)/(tabs)/watch',
    getParams: async (notification) => {
      const { data } = await supabase
        .from('comentario_video')
        .select('video_id')
        .eq('id', notification.contenido_id)
        .single();
      return { 
        scrollToId: data?.video_id.toString(),
        showComments: 'true'
      };
    }
  },
  match: {
    route: '/public-profile/[id]',
    getParams: (notification) => ({ id: notification.usuario_origen_id })
  },
  like: {
    route: '/public-profile/[id]',
    getParams: (notification) => ({ id: notification.usuario_origen_id })
  },
  solicitud_colaboracion: {
    route: '/colaboraciones',
    getParams: () => ({})
  },
  colaboracion_aceptada: {
    route: '/colaboraciones',
    getParams: () => ({})
  },
  colaboracion_rechazada: {
    route: '/colaboraciones',
    getParams: () => ({})
  },
  nuevo_seguidor: {
    route: '/public-profile/[id]',
    getParams: (notification) => ({ 
      id: notification.usuario_origen_id 
    })
  }
}; 