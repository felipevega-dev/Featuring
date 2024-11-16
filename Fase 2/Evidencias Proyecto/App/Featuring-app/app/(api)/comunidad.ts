import { supabase } from "@/lib/supabase";
import { Database } from "@/types/db_types";

type Cancion = Database["public"]["Tables"]["cancion"]["Row"];
type Perfil = Database["public"]["Tables"]["perfil"]["Row"];
type LikeComentario =
  Database["public"]["Tables"]["likes_comentario_cancion"]["Row"];

interface CancionConRelaciones extends Cancion {
  perfil: Perfil;
  likes_count: number;
  comentarios: {
    id: number;
    usuario_id: string;
    contenido: string;
    created_at: string;
    perfil: Perfil;
    likes_count: number;
    likes: LikeComentario[];
  }[];
}

export async function getSongs(): Promise<CancionConRelaciones[]> {
  const { data, error } = await supabase
    .from("cancion")
    .select(`
      *,
      perfil!usuario_id (*),
      likes_count:likes_cancion(count),
      comentarios: comentario_cancion (
        *,
        perfil!usuario_id (*),
        likes: likes_comentario_cancion (*)
      ),
      colaboracion:colaboracion!cancion_id (
        estado,
        usuario_id,
        usuario_id2,
        perfil:usuario_id (
          username,
          foto_perfil
        ),
        perfil2:usuario_id2 (
          username,
          foto_perfil
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching songs:", error);
    throw error;
  }

  return data.map((cancion) => ({
    ...cancion,
    likes_count: cancion.likes_count?.[0]?.count || 0,
    comentarios: cancion.comentarios.map((comentario: any) => ({
      ...comentario,
      likes_count: comentario.likes?.length || 0,
    })),
  })) as CancionConRelaciones[];
}

export async function deleteComment(
  commentId: number,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("comentario_cancion")
    .delete()
    .eq("id", commentId)
    .eq("usuario_id", userId);

  if (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
}

export async function likeComment(
  commentId: number,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("likes_comentario_cancion")
    .insert({ comentario_id: commentId, usuario_id: userId });

  if (error) {
    console.error("Error liking comment:", error);
    throw error;
  }
}

export async function unlikeComment(
  commentId: number,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("likes_comentario_cancion")
    .delete()
    .eq("comentario_id", commentId)
    .eq("usuario_id", userId);

  if (error) {
    console.error("Error unliking comment:", error);
    throw error;
  }
}