export interface BaseContent {
  id: string;
  usuario_id: string;
  created_at: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  usuario?: {
    username: string;
  };
}

export interface VideoContent extends BaseContent {
  descripcion: string;
  url: string;
  thumbnail?: string;
}

export interface SongContent extends BaseContent {
  titulo: string;
  genero: string;
  archivo_audio: string;
  caratula: string;
}

export interface ProfilePhotoContent extends BaseContent {
  foto_perfil: string;
}

export interface ChatMediaContent extends BaseContent {
  tipo: 'imagen' | 'video';
  url: string;
  mensaje_id: string;
}

export interface AudioMessageContent extends BaseContent {
  url: string;
  duracion: number;
  mensaje_id: string;
} 