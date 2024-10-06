import React, { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import PostCard from "@/components/PostCard";
import { getPosts } from "@/app/(api)/comunidad";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/db_types";

type Publicacion = Database['public']['Tables']['publicacion']['Row'];
type Cancion = Database['public']['Tables']['cancion']['Row'];
type Perfil = Database['public']['Tables']['perfil']['Row'];

interface PublicacionConRelaciones extends Publicacion {
  cancion: Cancion | null;
  perfil: Perfil | null;
}

const Comunidad = () => {
  const [posts, setPosts] = useState<PublicacionConRelaciones[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const data = await getPosts();
      // Eliminamos el console.log aquí
      setPosts(data);
    } catch (err) {
      setError("Error al cargar los posts. Por favor, intenta de nuevo.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: PublicacionConRelaciones }) => (
    <PostCard 
      post={{
        ...item,
        comentarios: item.comentarios.map(c => ({
          ...c,
          isLiked: false // Esto debería ser determinado por el estado actual del usuario
        }))
      }} 
      currentUserId={currentUserId || ''} 
    />
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Cargando posts...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-red-500">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      <Text className="text-xl font-bold text-center py-4">Comunidad</Text>
      {posts.length > 0 ? (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">
            No hay publicaciones para mostrar.
          </Text>
        </View>
      )}
    </View>
  );
};

export default Comunidad;
