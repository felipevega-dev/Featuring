import React, { useEffect, useState, useMemo, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
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
  const [refreshing, setRefreshing] = useState(false);
  const songListRef = useRef<FlatList>(null);
  const { scrollToId, showComments } = useLocalSearchParams<{ 
    scrollToId: string;
    showComments: string;
  }>();
  const [activeTab, setActiveTab] = useState<'canciones' | 'videos'>('canciones');
  const [showingFollowedOnly, setShowingFollowedOnly] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [currentSort, setCurrentSort] = useState<'newest' | 'oldest' | 'likes' | 'comments'>('newest');

  const sortOptions = [
    { value: 'newest', label: 'Más recientes', icon: 'time-outline' },
    { value: 'oldest', label: 'Más antiguas', icon: 'calendar-outline' },
    { value: 'likes', label: 'Más likes', icon: 'heart-outline' },
    { value: 'comments', label: 'Más comentados', icon: 'chatbubble-outline' }
  ];

  const handleSort = (sortType: 'newest' | 'oldest' | 'likes' | 'comments') => {
    setCurrentSort(sortType);
    let sortedSongs = [...allCanciones];

    switch (sortType) {
      case 'newest':
        sortedSongs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        sortedSongs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'likes':
        // Obtener conteo de likes para cada canción
        const getLikesCount = async (cancionId: number) => {
          const { count } = await supabase
            .from('likes_cancion')
            .select('*', { count: 'exact' })
            .eq('cancion_id', cancionId);
          return count || 0;
        };

        // Ordenar por número de likes
        Promise.all(sortedSongs.map(async song => ({
          ...song,
          likesCount: await getLikesCount(song.id)
        }))).then(songsWithLikes => {
          songsWithLikes.sort((a, b) => b.likesCount - a.likesCount);
          setFilteredCanciones(songsWithLikes);
        });
        break;
      case 'comments':
        // Obtener conteo de comentarios para cada canción
        const getCommentsCount = async (cancionId: number) => {
          const { count } = await supabase
            .from('comentario_cancion')
            .select('*', { count: 'exact' })
            .eq('cancion_id', cancionId);
          return count || 0;
        };

        // Ordenar por número de comentarios
        Promise.all(sortedSongs.map(async song => ({
          ...song,
          commentsCount: await getCommentsCount(song.id)
        }))).then(songsWithComments => {
          songsWithComments.sort((a, b) => b.commentsCount - a.commentsCount);
          setFilteredCanciones(songsWithComments);
        });
        break;
    }

    if (sortType === 'newest' || sortType === 'oldest') {
      setFilteredCanciones(sortedSongs);
    }
    setSortModalVisible(false);
  };

  useEffect(() => {
    fetchSongs();
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (scrollToId && allCanciones.length > 0) {
      const songIndex = allCanciones.findIndex(
        cancion => cancion.id.toString() === scrollToId
      );

      if (songIndex !== -1 && songListRef.current) {
        setTimeout(() => {
          songListRef.current?.scrollToIndex({
            index: songIndex,
            animated: true,
            viewPosition: 0
          });

          if (showComments === 'true') {
            handleCommentPress(allCanciones[songIndex].id);
          }
        }, 100);
      }
    }
  }, [scrollToId, showComments, allCanciones]);

  useEffect(() => {
    fetchSongs();
  }, [showingFollowedOnly]);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchFollowedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('seguidor')
        .select('usuario_id')
        .eq('seguidor_id', currentUserId);

      if (error) throw error;
      return data.map(seguidor => seguidor.usuario_id);
    } catch (error) {
      console.error('Error al obtener usuarios seguidos:', error);
      return [];
    }
  };

  const fetchSongs = async () => {
    try {
      setIsLoading(true);
      let query = supabase
        .from("cancion")
        .select(`
          id,
          titulo,
          caratula,
          genero,
          created_at,
          archivo_audio,
          contenido,
          usuario_id,
          perfil:usuario_id (
            username,
            foto_perfil
          ),
          likes:likes_cancion(count),
          comentarios:comentario_cancion(count),
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
        .eq('colaboracion.estado', 'aceptada')
        .order('created_at', { ascending: false });

      if (showingFollowedOnly) {
        const followedUsers = await fetchFollowedUsers();
        if (followedUsers.length > 0) {
          query = query.in('usuario_id', followedUsers);
        } else {
          setAllCanciones([]);
          setFilteredCanciones([]);
          setIsLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      const cancionesFormateadas = data?.map((cancion) => ({
        id: cancion.id,
        titulo: cancion.titulo,
        caratula: cancion.caratula,
        genero: cancion.genero,
        created_at: cancion.created_at,
        archivo_audio: cancion.archivo_audio,
        contenido: cancion.contenido,
        usuario_id: cancion.usuario_id,
        perfil: cancion.perfil,
        likes_count: cancion.likes?.[0]?.count || 0,
        colaboracion: cancion.colaboracion?.[0] || null,
        isLiked: false // Se actualizará en la siguiente consulta
      }));

      // Obtener los likes del usuario actual en una sola consulta
      const { data: userLikes } = await supabase
        .from("likes_cancion")
        .select('cancion_id')
        .eq('usuario_id', currentUserId);

      // Crear un Set para búsqueda rápida
      const likedSongIds = new Set(userLikes?.map(like => like.cancion_id));

      // Actualizar isLiked para cada canción
      const cancionesConLikes = cancionesFormateadas?.map(cancion => ({
        ...cancion,
        isLiked: likedSongIds.has(cancion.id)
      }));

      setAllCanciones(cancionesConLikes || []);
      setFilteredCanciones(cancionesConLikes || []);

      // Calcular géneros una sola vez
      const genreCount = cancionesConLikes?.reduce((acc, cancion) => {
        acc[cancion.genero] = (acc[cancion.genero] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      setSortedGenres(
        generosMusicalesCompletos.sort((a, b) => (genreCount[b] || 0) - (genreCount[a] || 0))
      );
    } catch (err) {
      setError("Error al cargar las canciones");
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
      const { data: cancionData, error: fetchCancionError } = await supabase
        .from("cancion")
        .select("archivo_audio, caratula, usuario_id")
        .eq("id", cancionId)
        .single();

      if (fetchCancionError) throw fetchCancionError;

      if (cancionData) {
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

        await supabase
          .from("colaboracion")
          .delete()
          .eq("cancion_id", cancionId);

        await supabase
          .from("valoracion_cancion")
          .delete()
          .eq("cancion_id", cancionId);

        await supabase
          .from("comentario_cancion")
          .delete()
          .eq("cancion_id", cancionId);

        await supabase
          .from("likes_cancion")
          .delete()
          .eq("cancion_id", cancionId);

        if (cancionData.archivo_audio) {
          const audioFileName = cancionData.archivo_audio.split("/").pop();
          if (audioFileName) {
            await supabase.storage
              .from("canciones")
              .remove([`${cancionData.usuario_id}/${audioFileName}`]);
          }
        }

        if (cancionData.caratula) {
          const caratulaFileName = cancionData.caratula.split("/").pop();
          if (caratulaFileName) {
            await supabase.storage
              .from("caratulas")
              .remove([`${cancionData.usuario_id}/${caratulaFileName}`]);
          }
        }

        const { error: deleteCancionError } = await supabase
          .from("cancion")
          .delete()
          .eq("id", cancionId);

        if (deleteCancionError) {
          throw deleteCancionError;
        }

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
    await fetchSongs();
  };

  const handleSongSelect = (song: Cancion) => {
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
      initialShowComments={showComments === 'true' && item.id.toString() === scrollToId}
    />
  );

  const handleCommentPress = (songId: number) => {
    const cancion = allCanciones.find(cancion => cancion.id === songId);
    if (cancion) {
      handleSongSelect(cancion);
    }
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
          <View className="h-14 flex-row items-center border-b-2 border-b-secondary-200 justify-center">
            <TouchableOpacity
              onPress={() => setIsSearchBarExpanded(!isSearchBarExpanded)}
              className="bg-white rounded-md mx-2 w-8 h-8 items-center justify-center"
            >
              <Ionicons name="search" size={24} color="#00BFA5" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSortModalVisible(true)}
              className="bg-white rounded-md mx-2 px-3 h-8 flex-row items-center justify-center"
            >
              <Ionicons 
                name={sortOptions.find(opt => opt.value === currentSort)?.icon || 'funnel'} 
                size={20} 
                color="#00BFA5" 
              />
              <Text className="ml-1 text-sm text-secondary-500">
                Ordenar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowingFollowedOnly(!showingFollowedOnly)}
              className={`bg-white rounded-md mx-2 px-3 h-8 flex-row items-center justify-center ${
                showingFollowedOnly ? 'bg-secondary-500' : 'bg-white'
              }`}
            >
              <Ionicons 
                name="people" 
                size={20} 
                color={showingFollowedOnly ? "#FFFFFF" : "#00BFA5"} 
              />
              <Text 
                className={`ml-1 text-sm ${
                  showingFollowedOnly ? 'text-white' : 'text-secondary-500'
                }`}
              >
                Seguidos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsUploadModalVisible(true)}
              className="bg-white rounded-md mx-2 w-8 h-8 items-center justify-center"
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

        <Modal
          visible={sortModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSortModalVisible(false)}
        >
          <TouchableOpacity
            className="flex-1 bg-black/50 justify-center items-center"
            activeOpacity={1}
            onPress={() => setSortModalVisible(false)}
          >
            <View className="bg-white rounded-lg w-4/5 p-4">
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleSort(option.value)}
                  className={`flex-row items-center p-3 ${
                    currentSort === option.value ? 'bg-primary-100' : ''
                  }`}
                >
                  <Ionicons name={option.icon} size={24} color="#6D29D2" />
                  <Text className="ml-3 text-primary-700">{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {filteredCanciones.length > 0 ? (
          <FlatList
            ref={songListRef}
            data={filteredCanciones}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
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
            onScrollToIndexFailed={(info) => {
              const wait = new Promise(resolve => setTimeout(resolve, 100));
              wait.then(() => {
                songListRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true
                });
              });
            }}
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
        <GlobalAudioPlayer />
      </View>
    </AudioPlayerProvider>
  );
};

export default Comunidad;
