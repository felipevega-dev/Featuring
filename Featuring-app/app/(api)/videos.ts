import { supabase } from "@/lib/supabase";
import { Database } from "@/types/db_types";

type Video = Database['public']['Tables']['video']['Row'];

export async function getVideos(): Promise<Video[]> {
  const { data, error } = await supabase
    .from('video')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching videos:", error);
    throw error;
  }

  return data;
}