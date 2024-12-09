import { useState, useEffect } from "react";
import { getVideos } from "@/app/(api)/videos";
import { Database } from "@/types/db_types";
import { supabase } from "@/lib/supabase";

type Video = Database["public"]["Tables"]["video"]["Row"];

export default function useVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = async () => {
    try {
      setIsLoading(true);
      const data = await getVideos();
      setVideos(data);
    } catch (err) {
      setError("Error al cargar los videos. Por favor, intenta de nuevo.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const refetchVideos = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setVideos(data);
      }
    } catch (err) {
      console.log('Error fetching videos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  return { videos, setVideos, isLoading, error, refetchVideos };
}
