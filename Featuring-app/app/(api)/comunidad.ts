import { supabase } from "@/lib/supabase";
import { Database } from "@/types/db_types";

type Publicacion = Database['public']['Tables']['publicacion']['Row'];
type Cancion = Database['public']['Tables']['cancion']['Row'];
type Perfil = Database['public']['Tables']['perfil']['Row'];
type LikeComentario = Database['public']['Tables']['likes_comentario_publicacion']['Row'];

interface PublicacionConRelaciones extends Publicacion {
  cancion: Cancion | null;
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

export async function getPosts(): Promise<PublicacionConRelaciones[]> {
  const { data, error } = await supabase
    .from('publicacion')
    .select(`
      *,
      cancion (*),
      perfil (*),
      likes: likes_publicacion (count),
      comentarios: comentario_publicacion (
        *,
        perfil (*),
        likes: likes_comentario_publicacion (*)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }

  return data.map(post => ({
    ...post,
    likes_count: post.likes[0]?.count || 0,
    comentarios: post.comentarios.map(comentario => ({
      ...comentario,
      likes_count: comentario.likes?.length || 0
    }))
  })) as PublicacionConRelaciones[];
}

export async function deleteComment(commentId: number, userId: string): Promise<void> {
  const { error } = await supabase
    .from('comentario_publicacion')
    .delete()
    .eq('id', commentId)
    .eq('usuario_id', userId);

  if (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
}

export async function likeComment(commentId: number, userId: string): Promise<void> {
  const { error } = await supabase
    .from('likes_comentario_publicacion')
    .insert({ comentario_id: commentId, usuario_id: userId });

  if (error) {
    console.error("Error liking comment:", error);
    throw error;
  }
}

export async function unlikeComment(commentId: number, userId: string): Promise<void> {
  const { error } = await supabase
    .from('likes_comentario_publicacion')
    .delete()
    .eq('comentario_id', commentId)
    .eq('usuario_id', userId);

  if (error) {
    console.error("Error unliking comment:", error);
    throw error;
  }
}
