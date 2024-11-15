export interface Message {
  id: number;
  emisor_id: string;
  receptor_id: string;
  contenido: string;
  tipo_contenido: "texto" | "audio" | "imagen" | "video_chat";
  url_contenido: string | null;
  fecha_envio: string;
  leido?: boolean;
} 