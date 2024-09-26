export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cancion: {
        Row: {
          archivo_url: string
          fecha_subida: string | null
          id: number
          titulo: string
          usuario_id: number
        }
        Insert: {
          archivo_url: string
          fecha_subida?: string | null
          id?: never
          titulo: string
          usuario_id: number
        }
        Update: {
          archivo_url?: string
          fecha_subida?: string | null
          id?: never
          titulo?: string
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_usuario_cancion"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      comentario_publicacion: {
        Row: {
          contenido: string
          fecha: string | null
          publicacion_id: number
          usuario_id: number
        }
        Insert: {
          contenido: string
          fecha?: string | null
          publicacion_id: number
          usuario_id: number
        }
        Update: {
          contenido?: string
          fecha?: string | null
          publicacion_id?: number
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_publicacion_comentario"
            columns: ["publicacion_id"]
            isOneToOne: false
            referencedRelation: "publicacion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_usuario_comentario_publicacion"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      comentario_video: {
        Row: {
          contenido: string
          fecha: string | null
          usuario_id: number
          video_id: number
        }
        Insert: {
          contenido: string
          fecha?: string | null
          usuario_id: number
          video_id: number
        }
        Update: {
          contenido?: string
          fecha?: string | null
          usuario_id?: number
          video_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_usuario_comentario_video"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_video_comentario"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "video"
            referencedColumns: ["id"]
          },
        ]
      }
      conexion: {
        Row: {
          estado: string | null
          id: number
          usuario1_id: number
          usuario2_id: number
        }
        Insert: {
          estado?: string | null
          id?: never
          usuario1_id: number
          usuario2_id: number
        }
        Update: {
          estado?: string | null
          id?: never
          usuario1_id?: number
          usuario2_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_usuario1_conexion"
            columns: ["usuario1_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_usuario2_conexion"
            columns: ["usuario2_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      genero: {
        Row: {
          id: number
          nombre: string
        }
        Insert: {
          id?: never
          nombre: string
        }
        Update: {
          id?: never
          nombre?: string
        }
        Relationships: []
      }
      habilidad: {
        Row: {
          id: number
          nombre: string
        }
        Insert: {
          id?: never
          nombre: string
        }
        Update: {
          id?: never
          nombre?: string
        }
        Relationships: []
      }
      mensaje: {
        Row: {
          contenido: string
          emisor_id: number
          fecha_envio: string | null
          id: number
          receptor_id: number
        }
        Insert: {
          contenido: string
          emisor_id: number
          fecha_envio?: string | null
          id?: never
          receptor_id: number
        }
        Update: {
          contenido?: string
          emisor_id?: number
          fecha_envio?: string | null
          id?: never
          receptor_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_emisor_mensaje"
            columns: ["emisor_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_receptor_mensaje"
            columns: ["receptor_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      perfil: {
        Row: {
          biografia: string | null
          edad: number | null
          fecha_nacimiento: string | null
          foto_perfil: string | null
          id: number
          mensaje_perfil: string | null
          nombre_completo: string | null
          redes_sociales: Json | null
          sexo: string | null
          ubicacion: string | null
          usuario_id: number
        }
        Insert: {
          biografia?: string | null
          edad?: number | null
          fecha_nacimiento?: string | null
          foto_perfil?: string | null
          id?: never
          mensaje_perfil?: string | null
          nombre_completo?: string | null
          redes_sociales?: Json | null
          sexo?: string | null
          ubicacion?: string | null
          usuario_id: number
        }
        Update: {
          biografia?: string | null
          edad?: number | null
          fecha_nacimiento?: string | null
          foto_perfil?: string | null
          id?: never
          mensaje_perfil?: string | null
          nombre_completo?: string | null
          redes_sociales?: Json | null
          sexo?: string | null
          ubicacion?: string | null
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_usuario_perfil"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      perfil_genero: {
        Row: {
          genero_id: number
          perfil_id: number
        }
        Insert: {
          genero_id: number
          perfil_id: number
        }
        Update: {
          genero_id?: number
          perfil_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_genero_perfil"
            columns: ["genero_id"]
            isOneToOne: false
            referencedRelation: "genero"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_perfil_genero"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      perfil_habilidad: {
        Row: {
          habilidad_id: number
          perfil_id: number
        }
        Insert: {
          habilidad_id: number
          perfil_id: number
        }
        Update: {
          habilidad_id?: number
          perfil_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_habilidad_perfil"
            columns: ["habilidad_id"]
            isOneToOne: false
            referencedRelation: "habilidad"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_perfil_habilidad"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfil"
            referencedColumns: ["id"]
          },
        ]
      }
      publicacion: {
        Row: {
          cancion_id: number | null
          contenido: string
          fecha: string | null
          id: number
          image: string | null
          likes: number | null
          usuario_id: number
        }
        Insert: {
          cancion_id?: number | null
          contenido: string
          fecha?: string | null
          id?: never
          image?: string | null
          likes?: number | null
          usuario_id: number
        }
        Update: {
          cancion_id?: number | null
          contenido?: string
          fecha?: string | null
          id?: never
          image?: string | null
          likes?: number | null
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_cancion_publicacion"
            columns: ["cancion_id"]
            isOneToOne: true
            referencedRelation: "cancion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_usuario_publicacion"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      seguidor: {
        Row: {
          seguidor_id: number
          usuario_id: number
        }
        Insert: {
          seguidor_id: number
          usuario_id: number
        }
        Update: {
          seguidor_id?: number
          usuario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_seguidor_usuario"
            columns: ["seguidor_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_usuario_seguidor"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
      usuario: {
        Row: {
          contrasena: string
          correo_electronico: string
          created_at: string | null
          id: number
          username: string
        }
        Insert: {
          contrasena: string
          correo_electronico: string
          created_at?: string | null
          id?: never
          username: string
        }
        Update: {
          contrasena?: string
          correo_electronico?: string
          created_at?: string | null
          id?: never
          username?: string
        }
        Relationships: []
      }
      video: {
        Row: {
          descripcion: string | null
          fecha: string | null
          id: number
          likes: number | null
          titulo: string
          usuario_id: number
          video_url: string
        }
        Insert: {
          descripcion?: string | null
          fecha?: string | null
          id?: never
          likes?: number | null
          titulo: string
          usuario_id: number
          video_url: string
        }
        Update: {
          descripcion?: string | null
          fecha?: string | null
          id?: never
          likes?: number | null
          titulo?: string
          usuario_id?: number
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_usuario_video"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuario"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
