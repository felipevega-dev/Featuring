import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface StorageMetrics {
  total_size_gb: number;
  videos_size_gb: number;
  songs_size_gb: number;
  covers_size_gb: number;
  profile_pics_size_gb: number;
  chat_videos_size_gb: number;
  chat_images_size_gb: number;
  audio_messages_size_gb: number;
  largest_files: Array<{
    bucket_id: string;
    name: string;
    size: number;
  }>;
}

interface SystemMetrics {
  usersByCountry: { [key: string]: number };
  usersByAge: { [key: string]: number };
  storageMetrics: StorageMetrics;
  isLoading: boolean;
  error: string | null;
}

export const useSystemMetrics = () => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    usersByCountry: {},
    usersByAge: {},
    storageMetrics: {
      total_size_gb: 0,
      videos_size_gb: 0,
      songs_size_gb: 0,
      covers_size_gb: 0,
      profile_pics_size_gb: 0,
      chat_videos_size_gb: 0,
      chat_images_size_gb: 0,
      audio_messages_size_gb: 0,
      largest_files: []
    },
    isLoading: true,
    error: null
  });

  const supabase = createClientComponentClient();

  const fetchMetrics = async () => {
    try {
      const [
        { data: countryData },
        { data: ageData },
        { data: storageData }
      ] = await Promise.all([
        supabase.rpc('get_users_by_country'),
        supabase.rpc('get_users_by_age_range'),
        supabase.rpc('get_storage_metrics')
      ]);

      setMetrics({
        usersByCountry: countryData.reduce((acc: any, curr: any) => ({
          ...acc,
          [curr.country]: curr.count
        }), {}),
        usersByAge: ageData.reduce((acc: any, curr: any) => ({
          ...acc,
          [curr.age_range]: curr.count
        }), {}),
        storageMetrics: storageData,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setMetrics(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error al cargar métricas'
      }));
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return metrics;
}; 