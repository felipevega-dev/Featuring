import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import PostCard from "@/components/PostCard";
import { getPosts } from "@/app/(api)/comunidad";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/db_types";
import UploadSongModal from "@/components/UploadSongModal";

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
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);

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
      setPosts(data);
    } catch (err) {
      setError("Error al cargar los posts. Por favor, intenta de nuevo.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchPosts();
    Alert.alert("Éxito", "Tu canción ha sido subida y publicada");
  };

  const handleDeletePost = async (postId: number, cancionId: number | null) => {
    try {
      // Eliminar la publicación
      const { error: deletePostError } = await supabase
        .from('publicacion')
        .delete()
        .eq('id', postId);

      if (deletePostError) throw deletePostError;

      // Si hay una canción asociada, eliminarla
      if (cancionId) {
        const { error: deleteCancionError } = await supabase
          .from('cancion')
          .delete()
          .eq('id', cancionId);

        if (deleteCancionError) throw deleteCancionError;

        // Eliminar archivos del storage
        const { data: cancionData } = await supabase
          .from('cancion')
          .select('archivo_audio, caratula')
          .eq('id', cancionId)
          .single();

        if (cancionData) {
          if (cancionData.archivo_audio) {
            await supabase.storage.from('canciones').remove([cancionData.archivo_audio]);
          }
          if (cancionData.caratula) {
            await supabase.storage.from('caratulas').remove([cancionData.caratula]);
          }
        }
      }

      // Actualizar la lista de posts
      setPosts(posts.filter(post => post.id !== postId));
      Alert.alert("Éxito", "La publicación ha sido eliminada");
    } catch (error) {
      console.error('Error al eliminar la publicación:', error);
      Alert.alert("Error", "No se pudo eliminar la publicación");
    }
  };

  const renderItem = ({ item }: { item: PublicacionConRelaciones }) => (
    <PostCard 
      post={item}
      currentUserId={currentUserId || ''}
      onDeletePost={handleDeletePost}
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
      <TouchableOpacity
        onPress={() => setIsUploadModalVisible(true)}
        className="bg-secondary-700 p-3 rounded-md mx-4 mb-4"
      >
        <Text className="text-white text-center">Publicar una Canción</Text>
      </TouchableOpacity>
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
      <UploadSongModal
        isVisible={isUploadModalVisible}
        onClose={() => setIsUploadModalVisible(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </View>
  );
};

export default Comunidad;