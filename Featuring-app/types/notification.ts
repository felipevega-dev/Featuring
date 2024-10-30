export type NotificationType = 
  | 'like_cancion'
  | 'comentario_cancion'
  | 'like_comentario_cancion'
  | 'solicitud_colaboracion'
  | 'colaboracion_aceptada'
  | 'colaboracion_rechazada'
  | 'match'
  | 'like';

export interface NotificationRedirect {
  route: string;
  getParams: (notification: {
    tipo_notificacion: NotificationType;
    contenido_id: number;
    usuario_origen_id: string;
  }) => Record<string, string | number>;
}

export const NOTIFICATION_REDIRECTS: Record<NotificationType, NotificationRedirect> = {
  like_cancion: {
    route: '/cancion/[id]',
    getParams: (notification) => ({ id: notification.contenido_id })
  },
  comentario_cancion: {
    route: '/cancion/[id]',
    getParams: (notification) => ({ id: notification.contenido_id })
  },
  like_comentario_cancion: {
    route: '/cancion/[id]',
    getParams: async (notification) => {
      // Obtener el ID de la canción desde el comentario
      const { data } = await supabase
        .from('comentario_cancion')
        .select('cancion_id')
        .eq('id', notification.contenido_id)
        .single();
      return { id: data?.cancion_id || notification.contenido_id };
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
    route: '/notificaciones',
    getParams: () => ({})
  },
  colaboracion_aceptada: {
    route: '/colaboraciones',
    getParams: () => ({})
  },
  colaboracion_rechazada: {
    route: '/colaboraciones',
    getParams: () => ({})
  }
}; 