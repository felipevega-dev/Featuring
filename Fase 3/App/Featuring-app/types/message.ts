export interface Message {
  id: number;
  emisor_id: string;
  receptor_id: string;
  contenido: string;
  tipo_contenido: 'texto' | 'audio';
  url_contenido?: string | null;
  fecha_envio: string;
}
