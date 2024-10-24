import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Linking,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, router } from "expo-router";
import { icons } from "@/constants";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import SongCard from "@/components/SongCard";
import VideoCard from "@/components/VideoCard";
import { AudioPlayerProvider } from "@/contexts/AudioPlayerContext";
import { VideoProvider } from "@/contexts/VideoContext";

interface Perfil {
  usuario_id: string;
  username: string;
  full_name: string;
  foto_perfil: string | null;
  sexo: string;
  edad: number;
  ubicacion: string;
  biografia: string;
  generos: string[];
  habilidades: string[];
  redes_sociales: { nombre: string; url: string }[];
  nacionalidad: string; // Añadir esta línea
}

interface Cancion {
  id: number;
  titulo: string;
  caratula: string;
  genero: string;
}

interface Video {
    id: number;
    usuario_id: string;
    descripcion: string;
    url: string | null;
    created_at: string;
    perfil: Perfil;
  }

export default function PublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [canciones, setCanciones] = useState<Cancion[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'canciones' | 'videos'>('canciones');

  useEffect(() => {
    fetchPerfil();
    fetchCanciones();
    fetchVideos();
  }, [id]);

  const fetchPerfil = async () => {
    try {
      const { data, error } = await supabase
        .from("perfil")
        .select(`
          usuario_id,
          username,
          foto_perfil,
          ubicacion,
          sexo,
          edad,
          biografia,
          nacionalidad,
          perfil_genero (genero),
          perfil_habilidad (habilidad),
          red_social (nombre, url)
        `)
        .eq("usuario_id", id)
        .single();

      if (error) throw error;

      if (data) {
        const perfilData: Perfil = {
          ...data,
          full_name: data.username, // Asumiendo que no tenemos acceso al full_name en este contexto
          generos: data.perfil_genero.map((g) => g.genero),
          habilidades: data.perfil_habilidad.map((h) => h.habilidad),
          redes_sociales: data.red_social,
          nacionalidad: data.nacionalidad,
        };
        setPerfil(perfilData);
      }
    } catch (error) {
      console.error("Error al obtener el perfil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCanciones = async () => {
    try {
      const { data, error } = await supabase
        .from("cancion")
        .select("id, titulo, caratula, genero")
        .eq("usuario_id", id);

      if (error) throw error;
      setCanciones(data || []);
    } catch (error) {
      console.error("Error al obtener las canciones:", error);
    }
  };

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("video")
        .select("id, descripcion")
        .eq("usuario_id", id);

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error("Error al obtener los videos:", error);
    }
  };

  const getRedSocialIcon = (nombre: string) => {
    switch (nombre.toLowerCase()) {
      case "soundcloud":
        return "soundcloud";
      case "instagram":
        return "instagram";
      case "facebook":
        return "facebook";
      case "twitter":
        return "twitter";
      case "spotify":
        return "spotify";
      default:
        return "link";
    }
  };

  const handleRedSocialPress = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Error al abrir el enlace:", err)
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-primary-600">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  if (!perfil) {
    return (
      <View className="flex-1 justify-center items-center bg-primary-600">
        <Text className="text-white text-lg">No se pudo cargar el perfil</Text>
      </View>
    );
  }

  const ProfileSection = ({ icon, title, children }) => (
    <View className="mb-3">
      <View className="flex-row items-center mb-2">
        <Image source={icon} className="w-6 h-6 mr-2" />
        <Text className="text-xl font-semibold text-gray-800">{title}</Text>
      </View>
      {children}
    </View>
  );

  const ProfileItem = ({ label, value }) => (
    <View className="flex-row justify-between items-center py-1">
      <Text className="text-primary-700 font-medium">{label}</Text>
      <Text className="text-gray-800">{value || "No especificado"}</Text>
    </View>
  );

  // Construir la URL pública de la foto de perfil
  const profileImageUrl = perfil.foto_perfil
    ? `https://jvtgpbgnxevfazwzbhtr.supabase.co/storage/v1/object/public/fotoperfil/${perfil.foto_perfil}`
    : "https://via.placeholder.com/150";

  const renderSongItem = ({ item }: { item: Cancion }) => (
    <SongCard cancion={item} currentUserId={id} onDeleteSong={() => {}} onUpdateSong={() => {}} />
  );

  const renderVideoItem = ({ item }: { item: Video }) => (
    <VideoCard video={item} />
  );

  return (
    <AudioPlayerProvider>
        <VideoProvider>
            <View className="flex-1 bg-primary-600 p-1">
            <ScrollView className="flex-1">
                <View className="px-4 pb-8">
                <View className="bg-white rounded-xl shadow-lg shadow-black/30 p-6 mb-10">
                    <View className="items-center pb-4">
                    <View className="w-36 h-36 rounded-full shadow-lg shadow-black/50 mb-4">
                        {profileImageUrl ? (
                        <Image
                            source={{ uri: profileImageUrl }}
                            className="w-full h-full rounded-full border-10 border-secondary-500"
                        />
                        ) : (
                        <View className="w-full h-full rounded-full bg-gray-300 justify-center items-center border-4 border-secondary-500">
                            <Image source={icons.person} className="w-20 h-20" />
                        </View>
                        )}
                    </View>
                    <Text className="text-xl font-semibold text-primary-500 text-center">
                        {perfil.username}
                    </Text>
                    </View>

                    <ProfileSection icon={icons.usuarioperfil} title="Información Personal">
                    <ProfileItem label="Ubicación" value={perfil.ubicacion} />
                    <ProfileItem label="Género" value={perfil.sexo} />
                    <ProfileItem label="Edad" value={perfil.edad.toString()} />
                    <ProfileItem label="Nacionalidad" value={perfil.nacionalidad} />
                    </ProfileSection>

                    <ProfileSection icon={icons.biografia} title="Biografía">
                    <Text className="text-gray-600">
                        {perfil.biografia || "No hay biografía disponible."}
                    </Text>
                    </ProfileSection>

                    <ProfileSection icon={icons.generos} title="Géneros Musicales">
                    <View className="flex-row flex-wrap">
                        {perfil.generos.map((genero, index) => (
                        <View key={index} className="bg-primary-100 rounded-full px-2 py-1 m-1">
                            <Text className="text-primary-600">{genero}</Text>
                        </View>
                        ))}
                    </View>
                    </ProfileSection>

                    <ProfileSection icon={icons.star} title="Habilidades Musicales">
                    <View className="flex-row flex-wrap">
                        {perfil.habilidades.map((habilidad, index) => (
                        <View key={index} className="bg-secondary-100 rounded-full px-2 py-1 m-1">
                            <Text className="text-secondary-500">{habilidad}</Text>
                        </View>
                        ))}
                    </View>
                    </ProfileSection>

                    <ProfileSection icon={icons.link} title="Redes Sociales">
                    <View className="flex-row flex-wrap">
                        {perfil.redes_sociales && perfil.redes_sociales.length > 0 ? (
                        perfil.redes_sociales.map((red, index) => (
                            <TouchableOpacity
                            key={index}
                            onPress={() => handleRedSocialPress(red.url)}
                            className="m-2"
                            >
                            <FontAwesome
                                name={getRedSocialIcon(red.nombre)}
                                size={30}
                                color="#5416A0"
                            />
                            </TouchableOpacity>
                        ))
                        ) : (
                        <Text className="text-gray-500">No hay redes sociales agregadas</Text>
                        )}
                    </View>
                    </ProfileSection>
                </View>

                <View className="flex-row justify-around mb-4">
                    <TouchableOpacity
                    onPress={() => setActiveTab('canciones')}
                    className={`py-2 px-4 rounded-full ${activeTab === 'canciones' ? 'bg-secondary-500' : 'bg-primary-700'}`}
                    >
                    <Text className="text-white font-bold">Canciones</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                    onPress={() => setActiveTab('videos')}
                    className={`py-2 px-4 rounded-full ${activeTab === 'videos' ? 'bg-secondary-500' : 'bg-primary-700'}`}
                    >
                    <Text className="text-white font-bold">Videos</Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'canciones' && (
                    <FlatList
                    data={canciones}
                    renderItem={renderSongItem}
                    keyExtractor={(item) => item.id.toString()}
                    ListEmptyComponent={<Text className="text-white text-center">No hay canciones para mostrar</Text>}
                    />
                )}

                {activeTab === 'videos' && (
                    <FlatList
                    data={videos}
                    renderItem={renderVideoItem}
                    keyExtractor={(item) => item.id.toString()}
                    ListEmptyComponent={<Text className="text-white text-center">No hay videos para mostrar</Text>}
                    />
                )}
                </View>
            </ScrollView>
            </View>
        </VideoProvider>
    </AudioPlayerProvider>
  );
}
