export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      usuario: {
        Row: {
          id: string;
          username: string | null;
          email: string;
          contrasena: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          username?: string | null;
          email: string;
          contrasena: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string | null;
          email?: string;
          contrasena?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
      perfil: {
        Row: {
          usuario_id: string;
          username: string | null;
          nombre_completo: string | null;
          fecha_nacimiento: string | null;
          biografia: string | null;
          foto_perfil: string | null;
          edad: number | null;
          sexo: string | null;
          ubicacion: string | null;
          latitud: number | null;
          longitud: number | null;
          created_at: string;
        };
        Insert: {
          usuario_id: string;
          username?: string | null;
          nombre_completo?: string | null;
          fecha_nacimiento?: string | null;
          biografia?: string | null;
          foto_perfil?: string | null;
          edad?: number | null;
          sexo?: string | null;
          ubicacion?: string | null;
          latitud?: number | null;
          longitud?: number | null;
          created_at?: string;
        };
        Update: {
          usuario_id?: string;
          username?: string | null;
          nombre_completo?: string | null;
          fecha_nacimiento?: string | null;
          biografia?: string | null;
          foto_perfil?: string | null;
          edad?: number | null;
          sexo?: string | null;
          ubicacion?: string | null;
          latitud?: number | null;
          longitud?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_usuario_perfil";
            columns: ["usuario_id"];
            referencedRelation: "usuario";
            referencedColumns: ["id"];
          },
        ];
      };
      red_social: {
        Row: {
          id: number;
          perfil_id: number;
          nombre: string;
          url: string;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          perfil_id: number;
          nombre: string;
          url: string;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          perfil_id?: number;
          nombre?: string;
          url?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_perfil_red_social";
            columns: ["perfil_id"];
            referencedRelation: "perfil";
            referencedColumns: ["id"];
          },
        ];
      };
      perfil_habilidad: {
        Row: {
          id: number;
          perfil_id: string;
          habilidad: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          perfil_id: string;
          habilidad: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          perfil_id?: string;
          habilidad?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_perfil_habilidad";
            columns: ["perfil_id"];
            referencedRelation: "perfil";
            referencedColumns: ["id"];
          },
        ];
      };
      perfil_genero: {
        Row: {
          id: number;
          perfil_id: string;
          genero: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          perfil_id: string;
          genero: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          perfil_id?: string;
          genero?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_perfil_genero";
            columns: ["perfil_id"];
            referencedRelation: "perfil";
            referencedColumns: ["id"];
          },
        ];
      };
      cancion: {
        Row: {
          id: number;
          usuario_id: string;
          titulo: string;
          archivo_audio: string | null;
          caratula: string | null;
          contenido: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          usuario_id: string;
          titulo: string;
          archivo_audio?: string | null;
          caratula?: string | null;
          contenido: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          usuario_id?: string;
          titulo?: string;
          archivo_audio?: string | null;
          caratula?: string | null;
          contenido?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_usuario_cancion";
            columns: ["usuario_id"];
            referencedRelation: "usuario";
            referencedColumns: ["id"];
          },
        ];
      };
      conexion: {
        Row: {
          id: number;
          usuario1_id: number;
          usuario2_id: number;
          estado: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          usuario1_id: number;
          usuario2_id: number;
          estado?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          usuario1_id?: number;
          usuario2_id?: number;
          estado?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_usuario1_conexion";
            columns: ["usuario1_id"];
            referencedRelation: "usuario";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_usuario2_conexion";
            columns: ["usuario2_id"];
            referencedRelation: "usuario";
            referencedColumns: ["id"];
          },
        ];
      };
      mensaje: {
        Row: {
          id: number;
          emisor_id: number;
          receptor_id: number;
          contenido: string;
          fecha_envio: string | null;
          tipo_contenido: string | null;
          url_contenido: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          emisor_id: number;
          receptor_id: number;
          contenido: string;
          fecha_envio?: string | null;
          tipo_contenido?: string | null;
          url_contenido?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          emisor_id?: string;
          receptor_id?: string;
          contenido?: string;
          fecha_envio?: string | null;
          tipo_contenido?: string | null;
          url_contenido?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_emisor_mensaje";
            columns: ["emisor_id"];
            referencedRelation: "usuario";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_receptor_mensaje";
            columns: ["receptor_id"];
            referencedRelation: "usuario";
            referencedColumns: ["id"];
          },
        ];
      };
      seguidor: {
        Row: {
          id: number;
          usuario_id: string;
          seguidor_id: number;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          usuario_id: string;
          seguidor_id: number;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          usuario_id?: string;
          seguidor_id?: number;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_usuario_seguidor";
            columns: ["usuario_id"];
            referencedRelation: "usuario";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_seguidor_usuario";
            columns: ["seguidor_id"];
            referencedRelation: "usuario";
            referencedColumns: ["id"];
          },
        ];
      };
      video: {
        Row: {
          id: number;
          usuario_id: string;
          duracion: string | null;
          url: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          usuario_id: string;
          duracion?: string | null;
          url?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          usuario_id?: string;
          duracion?: string | null;
          url?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_usuario_video";
            columns: ["usuario_id"];
            referencedRelation: "usuario";
            referencedColumns: ["id"];
          },
        ];
      };
      comentario_video: {
        Row: {
          id: number;
          usuario_id: string;
          video_id: number;
          comentario: string;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          usuario_id: string;
          video_id: number;
          comentario: string;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          usuario_id?: string;
          video_id?: number;
          comentario?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_usuario_comentario_video";
            columns: ["usuario_id"];
            referencedRelation: "usuario";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_video_comentario";
            columns: ["video_id"];
            referencedRelation: "video";
            referencedColumns: ["id"];
          },
        ];
      };
      likes_video: {
        Row: {
          id: number;
          usuario_id: string;
          video_id: number;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          usuario_id: string;
          video_id: number;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          usuario_id?: number;
          video_id?: number;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_usuario_likes";
            columns: ["usuario_id"];
            referencedRelation: "usuario";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_video_likes";
            columns: ["video_id"];
            referencedRelation: "video";
            referencedColumns: ["id"];
          },
        ];
      };
      colaboracion: {
        Row: {
          id: number;
          cancion_id: number | null;
          video_id: number | null;
          usuario_id: string;
          tipo_colaboracion: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          cancion_id?: number | null;
          video_id?: number | null;
          usuario_id: string;
          tipo_colaboracion?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          cancion_id?: number | null;
          video_id?: number | null;
          usuario_id?: string;
          tipo_colaboracion?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_usuario_colaboracion";
            columns: ["usuario_id"];
            referencedRelation: "usuario";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_cancion_colaboracion";
            columns: ["cancion_id"];
            referencedRelation: "cancion";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_video_colaboracion";
            columns: ["video_id"];
            referencedRelation: "video";
            referencedColumns: ["id"];
          },
        ];
      };
      reporte: {
        Row: {
          id: number;
          usuario_reportante_id: string;
          usuario_reportado_id: string;
          contenido_id: number | null;
          tipo_contenido: string | null;
          razon: string | null;
          estado: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          usuario_reportante_id: string;
          usuario_reportado_id: string;
          contenido_id?: number | null;
          tipo_contenido?: string | null;
          razon?: string | null;
          estado?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          usuario_reportante_id?: string;
          usuario_reportado_id?: string;
          contenido_id?: number | null;
          tipo_contenido?: string | null;
          razon?: string | null;
          estado?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_usuario_reportante";
            columns: ["usuario_reportante_id"];
            referencedRelation: "usuario";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_usuario_reportado";
            columns: ["usuario_reportado_id"];
            referencedRelation: "usuario";
            referencedColumns: ["id"];
          },
        ];
      };
      configuracion_privacidad: {
        Row: {
          id: number;
          usuario_id: string;
          perfil_visible: boolean | null;
          mensajes_directos: string | null;
          notificaciones: boolean | null;
          datos_compartidos: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          usuario_id: string;
          perfil_visible?: boolean | null;
          mensajes_directos?: string | null;
          notificaciones?: boolean | null;
          datos_compartidos?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          usuario_id?: string;
          perfil_visible?: boolean | null;
          mensajes_directos?: string | null;
          notificaciones?: boolean | null;
          datos_compartidos?: Json | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_usuario_privacidad";
            columns: ["usuario_id"];
            referencedRelation: "usuario";
            referencedColumns: ["id"];
          },
        ];
      };
      notificacion: {
        Row: {
          id: number;
          usuario_id: string;
          tipo_notificacion: string | null;
          contenido_id: number | null;
          mensaje: string | null;
          leido: boolean | null;
          fecha_evento: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          usuario_id: string;
          tipo_notificacion?: string | null;
          contenido_id?: number | null;
          mensaje?: string | null;
          leido?: boolean | null;
          fecha_evento?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          usuario_id?: string;
          tipo_notificacion?: string | null;
          contenido_id?: number | null;
          mensaje?: string | null;
          leido?: boolean | null;
          fecha_evento?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "fk_usuario_notificacion";
            columns: ["usuario_id"];
            referencedRelation: "usuario";
            referencedColumns: ["id"];
          },
        ];
      };
      etiqueta: {
        Row: {
          id: number;
          nombre: string;
        };
        Insert: {
          id?: number;
          nombre: string;
        };
        Update: {
          id?: number;
          nombre?: string;
        };
        Relationships: [];
      };
      cancion_etiqueta: {
        Row: {
          cancion_id: number;
          etiqueta_id: number;
        };
        Insert: {
          cancion_id: number;
          etiqueta_id: number;
        };
        Update: {
          cancion_id?: number;
          etiqueta_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "fk_cancion_etiqueta";
            columns: ["cancion_id"];
            referencedRelation: "cancion";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "fk_etiqueta_cancion";
            columns: ["etiqueta_id"];
            referencedRelation: "etiqueta";
            referencedColumns: ["id"];
          },
        ];
      };
      valoracion_cancion: {
        Row: {
          id: number;
          usuario_id: string;
          cancion_id: number | null;
          puntuacion: number;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          usuario_id: string;
          cancion_id?: number | null;
          puntuacion: number;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          usuario_id?: string;
          cancion_id?: number | null;
          puntuacion?: number;
          created_at?: string | null;
        };
      };
      likes_comentario_cancion: {
        Row: {
          id: number;
          usuario_id: string;
          comentario_id: number;
          created_at: string;
        };
        Insert: {
          id?: number;
          usuario_id: string;
          comentario_id: number;
          created_at?: string;
        };
        Update: {
          id?: number;
          usuario_id?: string;
          comentario_id?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_usuario_likes_comentario_cancion";
            columns: ["usuario_id"];
            referencedRelation: "perfil";
            referencedColumns: ["usuario_id"];
          },
          {
            foreignKeyName: "fk_comentario_cancion_likes";
            columns: ["comentario_id"];
            referencedRelation: "comentario_cancion";
            referencedColumns: ["id"];
          },
        ];
      };
      Views: {
        [_ in never]: never;
      };
      Functions: {
        [_ in never]: never;
      };
      Enums: {
        [_ in never]: never;
      };
      CompositeTypes: {
        [_ in never]: never;
      };
    };
  };
}

export type Perfil = Database["public"]["Tables"]["perfil"]["Row"];
export type PerfilInsert = Database["public"]["Tables"]["perfil"]["Insert"];
export type PerfilUpdate = Database["public"]["Tables"]["perfil"]["Update"];
export type PerfilHabilidad =
  Database["public"]["Tables"]["perfil_habilidad"]["Row"];
export type PerfilGenero = Database["public"]["Tables"]["perfil_genero"]["Row"];
export type Cancion = Database["public"]["Tables"]["cancion"]["Row"];

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
  // ... otros campos relevantes
}

export interface User {
  id: string;
  username: string;
  // ... otros campos
}