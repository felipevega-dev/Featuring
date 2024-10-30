import React, { useEffect, useState, useMemo } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SongCard from "@/components/SongCard";
import { getSongs } from "@/app/(api)/comunidad";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/db_types";
import UploadSongModal from "@/components/UploadSongModal";
import UserSongsModal from "@/components/UserSongsModal";
import SearchBar from "@/components/SearchBar";
import GlobalAudioPlayer from "@/components/GlobalAudioPlayer";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { generosMusicalesCompletos } from '@/constants/musicData';
import CommentSection from "@/components/CommentSection";

type CancionDB = Database["public"]["Tables"]["cancion"]["Row"];
type PerfilDB = Database["public"]["Tables"]["perfil"]["Row"];

interface Perfil {
  usuario_id: string;
  username: string;
  foto_perfil: string | null;
  // Añade otras propiedades necesarias
}

interface Cancion extends Omit<CancionDB, "perfil"> {
  perfil: Perfil | null;
}

const Comunidad = () => {
  const [allCanciones, setAllCanciones] = useState<Cancion[]>([]);
  const [filteredCanciones, setFilteredCanciones] = useState<Cancion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [isUserSongsModalVisible, setIsUserSongsModalVisible] = useState(false);
  const [isSearchBarExpanded, setIsSearchBarExpanded] = useState(false);
  const [sortedGenres, setSortedGenres] = useState<string[]>([]);
  const [selectedSongId, setSelectedSongId] = useState<number | null>(null);
  const [isCommentModalVisible, setIsCommentModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSongs();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchSongs = async () => {
    try {
      setIsLoading(true);
      const data = await getSongs();
      const cancionesFormateadas: Cancion[] = data.map((cancion) => ({
        ...cancion,
        perfil: cancion.perfil
          ? {
              usuario_id: cancion.perfil.usuario_id,
              username: cancion.perfil.username || "Usuario desconocido",
              foto_perfil: cancion.perfil.foto_perfil,
            }
          : null,
      }));
      setAllCanciones(cancionesFormateadas);
      setFilteredCanciones(cancionesFormateadas);
      
      // Contar la frecuencia de los géneros
      const genreCount = cancionesFormateadas.reduce((acc, cancion) => {
        acc[cancion.genero] = (acc[cancion.genero] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Ordenar los géneros por frecuencia
      const sorted = generosMusicalesCompletos.sort((a, b) => 
        (genreCount[b] || 0) - (genreCount[a] || 0)
      );
      setSortedGenres(sorted);
    } catch (err) {
      setError("Error al cargar las canciones. Por favor, intenta de nuevo.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchSongs();
    Alert.alert("Éxito", "Tu canción ha sido subida");
  };

  const handleDeleteSong = async (cancionId: number) => {
    try {
      // Primero obtener los datos de la canción
      const { data: cancionData, error: fetchCancionError } = await supabase
        .from("cancion")
        .select("archivo_audio, caratula, usuario_id")
        .eq("id", cancionId)
        .single();

      if (fetchCancionError) throw fetchCancionError;

      if (cancionData) {
        // 1. Eliminar notificaciones relacionadas con la canción
        const { error: notificacionesError } = await supabase
          .from("notificacion")
          .delete()
          .eq("contenido_id", cancionId)
          .in("tipo_notificacion", [
            'solicitud_colaboracion',
            'colaboracion_aceptada',
            'colaboracion_rechazada'
          ]);

        if (notificacionesError) throw notificacionesError;

        // 2. Eliminar colaboraciones asociadas
        await supabase
          .from("colaboracion")
          .delete()
          .eq("cancion_id", cancionId);

        // 3. Eliminar valoraciones de la canción
        await supabase
          .from("valoracion_cancion")
          .delete()
          .eq("cancion_id", cancionId);

        // 4. Eliminar comentarios de la canción
        await supabase
          .from("comentario_cancion")
          .delete()
          .eq("cancion_id", cancionId);

        // 5. Eliminar likes de la canción
        await supabase
          .from("likes_cancion")
          .delete()
          .eq("cancion_id", cancionId);

        // 6. Eliminar archivo de audio del storage
        if (cancionData.archivo_audio) {
          const audioFileName = cancionData.archivo_audio.split("/").pop();
          if (audioFileName) {
            await supabase.storage
              .from("canciones")
              .remove([`${cancionData.usuario_id}/${audioFileName}`]);
          }
        }

        // 7. Eliminar carátula del storage
        if (cancionData.caratula) {
          const caratulaFileName = cancionData.caratula.split("/").pop();
          if (caratulaFileName) {
            await supabase.storage
              .from("caratulas")
              .remove([`${cancionData.usuario_id}/${caratulaFileName}`]);
          }
        }

        // 8. Finalmente, eliminar la canción
        const { error: deleteCancionError } = await supabase
          .from("cancion")
          .delete()
          .eq("id", cancionId);

        if (deleteCancionError) {
          throw deleteCancionError;
        }

        // 9. Actualizar los estados locales
        setAllCanciones(prev => prev.filter(cancion => cancion.id !== cancionId));
        setFilteredCanciones(prev => prev.filter(cancion => cancion.id !== cancionId));
        
        Alert.alert("Éxito", "La canción ha sido eliminada completamente");
      }
    } catch (error) {
      console.error("Error al eliminar la canción:", error);
      Alert.alert("Error", "No se pudo eliminar la canción completamente");
    }
  };

  const handleUpdateSong = async (cancionId: number) => {
    // Recargar la lista de canciones
    await fetchSongs();
  };

  const handleSongSelect = (song: Cancion) => {
    // Implementa la lógica para reproducir la canción seleccionada
    console.log("Canción seleccionada:", song);
  };

  const handleSearch = (searchTerm: string, selectedGenre: string) => {
    let filtered = allCanciones;

    if (selectedGenre) {
      filtered = filtered.filter(cancion => cancion.genero === selectedGenre);
    }

    if (searchTerm) {
      filtered = filtered.filter(cancion => 
        cancion.titulo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCanciones(filtered);
  };

  const renderItem = ({ item }: { item: Cancion }) => (
    <SongCard
      cancion={item}
      currentUserId={currentUserId || ""}
      onDeleteSong={handleDeleteSong}
      onUpdateSong={handleUpdateSong}
      onCommentPress={() => handleCommentPress(item.id)}
    />
  );

  const handleCommentPress = (songId: number) => {
    setSelectedSongId(songId);
    setIsCommentModalVisible(true);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchSongs().finally(() => setRefreshing(false));
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Cargando canciones...</Text>
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
    <AudioPlayerProvider>
      <View className="flex-1 bg-gray-100">
        <View className="bg-primary-500 mb-2">
          <View className="h-14 flex-row items-center border-b-2 border-b-secondary-200">
            <TouchableOpacity
              onPress={() => setIsSearchBarExpanded(!isSearchBarExpanded)}
              className="bg-white rounded-md mx-4 w-8 h-8 items-center justify-center"
            >
              <Ionicons name="search" size={24} color="#00BFA5" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsUserSongsModalVisible(true)}
              className="bg-white rounded-md mx-4 w-8 h-8 items-center justify-center"
            >
              <Ionicons name="library" size={24} color="#00BFA5" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setIsUploadModalVisible(true)}
              className="bg-white rounded-md mx-4 w-8 h-8 items-center justify-center"
            >
              <Ionicons name="cloud-upload-outline" size={24} color="#00BFA5" />
            </TouchableOpacity>
          </View>
          <SearchBar
            isExpanded={isSearchBarExpanded}
            onToggle={() => setIsSearchBarExpanded(!isSearchBarExpanded)}
            onSearch={handleSearch}
            sortedGenres={sortedGenres}
          />
        </View>
        {filteredCanciones.length > 0 ? (
          <FlatList
            data={filteredCanciones}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 120,
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#6D29D2"]}
              />
            }
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-500">
              No hay canciones para mostrar.
            </Text>
          </View>
        )}
        <UploadSongModal
          isVisible={isUploadModalVisible}
          onClose={() => setIsUploadModalVisible(false)}
          onUploadSuccess={handleUploadSuccess}
        />
        {currentUserId && (
          <UserSongsModal
            isVisible={isUserSongsModalVisible}
            onClose={() => setIsUserSongsModalVisible(false)}
            userId={currentUserId}
          />
        )}
        {selectedSongId && (
          <CommentSection
            isVisible={isCommentModalVisible}
            onClose={() => setIsCommentModalVisible(false)}
            songId={selectedSongId}
            currentUserId={currentUserId || ""}
          />
        )}
        <GlobalAudioPlayer />
      </View>
    </AudioPlayerProvider>
  );
};

export default Comunidad;
