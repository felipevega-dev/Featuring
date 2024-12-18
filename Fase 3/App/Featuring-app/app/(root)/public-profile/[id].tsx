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
  Modal,
  RefreshControl,
  Alert,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams, router } from "expo-router";
import { icons } from "@/constants";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import RatingsList from '@/components/RatingsList';
import ProfileSongCard from "@/components/ProfileSongCard";
import ProfileVideoCard from "@/components/ProfileVideoCard";
import Constants from "expo-constants";
import { RealtimeChannel } from "@supabase/supabase-js";
import { TooltipBadge } from '@/components/TooltipBadge';
import { TooltipTitle } from '@/components/TooltipTitle';
import { ReportButton } from '@/components/reports/ReportButton';
import { sendPushNotification } from '@/utils/pushNotifications';

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
  promedio_valoraciones: number;
  total_valoraciones: number;
  seguidores_count?: number;
  preferencias?: {
    mostrar_edad: boolean;
    mostrar_ubicacion: boolean;
    mostrar_redes_sociales: boolean;
    mostrar_valoraciones: boolean;
  };
}

interface Cancion {
  id: number;
  titulo: string;
  caratula: string | null;
  genero: string;
  created_at: string;
  likes_count: number;
}

interface Video {
    id: number;
    usuario_id: string;
    descripcion: string;
    url: string | null;
    created_at: string;
    perfil: Perfil;
    likes_count: number;
  }

interface Rating {
  id: number;
  valoracion: number;
  comentario: string | null;
  created_at: string;
  perfil: {
    username: string;
    foto_perfil: string | null;
  };
}

// Agregar interfaces para los componentes internos
interface ProfileSectionProps {
  icon: any; // O ImageSourcePropType si quieres ser más específico
  title: string;
  children: React.ReactNode;
}

interface ProfileItemProps {
  label: string;
  value: string;
}

export default function PublicProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [canciones, setCanciones] = useState<Cancion[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'canciones' | 'videos'>('canciones');
  const [showRatings, setShowRatings] = useState(false);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [seguidoresCount, setSeguidoresCount] = useState(0);
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoadingLike, setIsLoadingLike] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'liked' | 'match'>("none");

  useEffect(() => {
    fetchPerfil();
    fetchCanciones();
    fetchVideos();
  }, [id]);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId && id) {
      checkIfFollowing();
    }
  }, [currentUserId, id]);

  useEffect(() => {
    if (id) {
      fetchSeguidores();
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      // Suscribirse a cambios en la tabla seguidor
      const channel = supabase
        .channel(`seguidor-changes-${id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'seguidor',
            filter: `usuario_id.eq.${id}`
          },
          () => {
            // Actualizar el contador cuando haya cambios
            fetchSeguidores();
          }
        )
        .subscribe();

      setSubscription(channel);

      // Limpieza al desmontar
      return () => {
        if (channel) {
          channel.unsubscribe();
        }
      };
    }
  }, [id]);

  useEffect(() => {
    if (currentUserId && id) {
      checkConnectionStatus();
    }
  }, [currentUserId, id]);

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
          promedio_valoraciones,
          perfil_genero (genero),
          perfil_habilidad (habilidad),
          red_social (nombre, url),
          preferencias:preferencias_usuario!preferencias_usuario_usuario_id_fkey (
            mostrar_edad,
            mostrar_ubicacion,
            mostrar_redes_sociales,
            mostrar_valoraciones
          )
        `)
        .eq("usuario_id", id)
        .single();

      if (error) throw error;

      // Obtener el promedio y total de valoraciones usando usuario_valorado_id
      const { data: valoracionesData, error: valoracionesError } = await supabase
        .from('valoracion_colaboracion')
        .select('valoracion')
        .eq('usuario_valorado_id', id);

      if (valoracionesError) throw valoracionesError;

      const totalValoraciones = valoracionesData?.length || 0;
      const sumaValoraciones = valoracionesData?.reduce((sum, val) => sum + val.valoracion, 0) || 0;
      const promedioValoraciones = totalValoraciones > 0 ? sumaValoraciones / totalValoraciones : 0;

      // Obtener insignia activa
      const { data: insigniaActiva } = await supabase
        .from('perfil_insignia')
        .select(`
          insignia:insignia_id (
            id,
            nombre,
            descripcion,
            nivel
          )
        `)
        .eq('perfil_id', id)
        .eq('activo', true)
        .single();

      // Obtener título activo
      const { data: tituloActivo } = await supabase
        .from('perfil_titulo')
        .select(`
          titulo:titulo_id (
            id,
            nombre,
            descripcion,
            nivel
          )
        `)
        .eq('perfil_id', id)
        .eq('activo', true)
        .single();

      if (data) {
        const perfilData = {
          ...data,
          full_name: data.username,
          generos: data.perfil_genero.map((g) => g.genero),
          habilidades: data.perfil_habilidad.map((h) => h.habilidad),
          redes_sociales: data.red_social,
          nacionalidad: data.nacionalidad,
          promedio_valoraciones: promedioValoraciones,
          total_valoraciones: totalValoraciones,
          insignias: insigniaActiva ? [insigniaActiva.insignia] : [],
          tituloActivo: tituloActivo?.titulo || null,
          preferencias: data.preferencias
        };
        setPerfil(perfilData);

        // Verificar el estado de la conexión al cargar el perfil
        if (currentUserId) {
          const { data: connections, error: connectionError } = await supabase
            .from("conexion")
            .select('*')
            .or(
              `and(usuario1_id.eq.${currentUserId},usuario2_id.eq.${id}),and(usuario1_id.eq.${id},usuario2_id.eq.${currentUserId})`
            );

          if (!connectionError && connections) {
            // Verificar si hay alguna conexión con estado true
            const matchConnection = connections.find(conn => conn.estado === true);
            
            if (matchConnection) {
              setConnectionStatus('match');
              setIsLiked(true);
            } else {
              // Si no hay match pero hay una conexión del usuario actual
              const userConnection = connections.find(
                conn => conn.usuario1_id === currentUserId && conn.usuario2_id === id
              );
              
              if (userConnection) {
                setConnectionStatus('liked');
                setIsLiked(true);
              } else {
                setConnectionStatus('none');
                setIsLiked(false);
              }
            }
          }
        }
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
        .from('cancion')
        .select(`
          id,
          titulo,
          caratula,
          genero,
          created_at,
          likes:likes_cancion(count)
        `)
        .eq('usuario_id', id);

      if (error) throw error;

      const cancionesFormateadas = data?.map(cancion => ({
        id: cancion.id,
        titulo: cancion.titulo,
        caratula: cancion.caratula,
        genero: cancion.genero,
        created_at: cancion.created_at,
        likes_count: cancion.likes?.[0]?.count || 0
      })) || [];

      setCanciones(cancionesFormateadas);
    } catch (error) {
      console.error("Error al obtener las canciones:", error);
    }
  };

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("video")
        .select(`
          id,
          descripcion,
          created_at,
          likes:likes_video(count)
        `)
        .eq("usuario_id", id);

      if (error) throw error;

      const videosFormateados = data?.map(video => ({
        id: video.id,
        descripcion: video.descripcion,
        created_at: video.created_at,
        likes_count: video.likes?.[0]?.count || 0
      })) || [];

      setVideos(videosFormateados as Video[]);
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

  const fetchValoraciones = async () => {
    try {
      const { data: valoraciones, error } = await supabase
        .from('valoracion_colaboracion')
        .select(`
          id,
          valoracion,
          comentario,
          created_at,
          perfil:usuario_id (
            username,
            foto_perfil
          )
        `)
        .eq('usuario_valorado_id', id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error en la consulta de valoraciones:', error);
        throw error;
      }
      const valoracionesFormateadas: Rating[] = valoraciones.map(val => ({
        id: val.id,
        valoracion: val.valoracion,
        comentario: val.comentario,
        created_at: val.created_at,
        perfil: {
          username: val.perfil?.username || 'Usuario desconocido',
          foto_perfil: val.perfil?.foto_perfil || null
        }
      }));
      setRatings(valoracionesFormateadas);
    } catch (error) {
      console.error('Error al cargar valoraciones:', error);
    }
  };

  // Llamar a fetchValoraciones cuando se abre el modal
  const handleShowRatings = () => {
    fetchValoraciones();
    setShowRatings(true);
  };

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const checkIfFollowing = async () => {
    try {
      const { data, error } = await supabase
        .from('seguidor')
        .select('id')
        .eq('usuario_id', id)
        .eq('seguidor_id', currentUserId)
        .single();

      if (error && error.code !== 'PGRST116') { // No es error de "no encontrado"
        throw error;
      }

      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error al verificar seguimiento:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUserId || currentUserId === id) return;

    try {
      if (isFollowing) {
        // Dejar de seguir
        const { error } = await supabase
          .from('seguidor')
          .delete()
          .eq('usuario_id', id)
          .eq('seguidor_id', currentUserId);

        if (error) throw error;
        
        setIsFollowing(false);
        // Actualizar el contador inmediatamente
        setSeguidoresCount(prev => prev - 1);
      } else {
        // Seguir
        const { error } = await supabase
          .from('seguidor')
          .insert({
            usuario_id: id,
            seguidor_id: currentUserId
          });

        if (error) throw error;
        
        setIsFollowing(true);
        // Actualizar el contador inmediatamente
        setSeguidoresCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error al cambiar estado de seguimiento:', error);
    }
  };

  const fetchSeguidores = async () => {
    try {
      const { count, error } = await supabase
        .from('seguidor')
        .select('*', { count: 'exact' })
        .eq('usuario_id', id);

      if (error) throw error;
      setSeguidoresCount(count || 0);
    } catch (error) {
      console.error('Error al obtener seguidores:', error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    const promises = [
      fetchPerfil(),
      fetchCanciones(),
      fetchVideos(),
      fetchSeguidores(),
    ];

    // Solo añadir checkConnectionStatus si tenemos los IDs necesarios
    if (currentUserId && id) {
      promises.push(checkConnectionStatus());
    }

    Promise.all(promises).finally(() => setRefreshing(false));
  }, [currentUserId, id]);

  const handleLike = async () => {
    if (!currentUserId || currentUserId === id || isLoadingLike) return;

    try {
      setIsLoadingLike(true);

      // Verificar si ya existe una conexión exactamente igual
      const { data: existingDuplicates, error: duplicateError } = await supabase
        .from("conexion")
        .select()
        .eq('usuario1_id', currentUserId)
        .eq('usuario2_id', id);

      if (duplicateError) throw duplicateError;

      if (existingDuplicates && existingDuplicates.length > 0) {
        Alert.alert("Ya existe una conexión con este usuario");
        return;
      }

      // Verificar si existe una conexión en la otra dirección
      const { data: existingConnections, error: selectError } = await supabase
        .from("conexion")
        .select()
        .eq('usuario1_id', id)
        .eq('usuario2_id', currentUserId);

      if (selectError) throw selectError;

      // Si existe una conexión del otro usuario, crear match
      if (existingConnections && existingConnections.length > 0) {
        const existingConnection = existingConnections[0];
        
        // Actualizar la conexión existente a match
        await supabase
          .from("conexion")
          .update({ estado: true })
          .eq("id", existingConnection.id);

        // Crear la conexión recíproca como match
        const { error: insertMatchError } = await supabase
          .from("conexion")
          .insert({
            usuario1_id: currentUserId,
            usuario2_id: id,
            estado: true
          });

        if (insertMatchError) throw insertMatchError;

        // Enviar notificaciones push de match a ambos usuarios
        if (perfil?.redes_sociales && perfil.redes_sociales.length > 0) {
          const { data: likedUserData, error: likedUserError } = await supabase
            .from('perfil')
            .select('username, push_token')
            .eq('usuario_id', id)
            .single();

          if (likedUserError) throw likedUserError;

          if (likedUserData?.push_token) {
            await sendPushNotification(
              likedUserData.push_token,
              '¡Nuevo Match!',
              `¡Has hecho match con ${perfil.username}!`
            );
          }

          const { data: currentUserData } = await supabase
            .from('perfil')
            .select('push_token')
            .eq('usuario_id', currentUserId)
            .single();

          if (currentUserData?.push_token) {
            await sendPushNotification(
              currentUserData.push_token,
              '¡Nuevo Match!',
              `¡Has hecho match con ${likedUserData.username}!`
            );
          }

          // Crear notificaciones de match para ambos usuarios
          await supabase
            .from('notificacion')
            .insert([
              {
                usuario_id: id,
                tipo_notificacion: 'match',
                usuario_origen_id: currentUserId,
                mensaje: `¡Has hecho match con ${perfil.username}!`,
                leido: false
              },
              {
                usuario_id: currentUserId,
                tipo_notificacion: 'match',
                usuario_origen_id: id,
                mensaje: `¡Has hecho match con ${likedUserData.username}!`,
                leido: false
              }
            ]);
        }

        setConnectionStatus('match');
        setIsLiked(true);
        Alert.alert(
          "¡Match!",
          "¡Has hecho match con este usuario!",
          [
            {
              text: "Enviar mensaje",
              onPress: () => router.push(`/chat/${id}`),
            },
            {
              text: "Continuar",
              style: "cancel",
            },
          ]
        );
        return;
      }

      // Si no existe ninguna conexión, crear una nueva
      const { error: insertError } = await supabase
        .from("conexion")
        .insert({
          usuario1_id: currentUserId,
          usuario2_id: id,
          estado: false,
        });

      if (insertError) throw insertError;

      // Enviar notificación push de like
      if (perfil?.redes_sociales && perfil.redes_sociales.length > 0) {
        const { data: likedUserData, error: likedUserError } = await supabase
          .from('perfil')
          .select('username, push_token')
          .eq('usuario_id', id)
          .single();

        if (likedUserError) throw likedUserError;

        if (likedUserData?.push_token) {
          await sendPushNotification(
            likedUserData.push_token,
            '¡Nuevo Like!',
            `${perfil.username} te ha dado like`
          );
        }

        const { data: currentUserData } = await supabase
          .from('perfil')
          .select('push_token')
          .eq('usuario_id', currentUserId)
          .single();

        if (currentUserData?.push_token) {
          await sendPushNotification(
            currentUserData.push_token,
            '¡Nuevo Like!',
            `${perfil.username} te ha dado like`
          );
        }

        // Crear notificación de like
        const { error: notificationError } = await supabase
          .from('notificacion')
          .insert({
            usuario_id: id,
            tipo_notificacion: 'like',
            leido: false,
            usuario_origen_id: currentUserId,
            mensaje: `${perfil.username} te ha dado like`
          });

        if (notificationError) {
          console.error('Error al crear notificación de like:', notificationError);
        }
      }

      await checkConnectionStatus();
      setIsLiked(true);
      Alert.alert("¡Like enviado!", "Si el otro usuario también te da like, ¡harán match!");

    } catch (error) {
      console.error('Error al dar like:', error);
      Alert.alert("Error", "No se pudo enviar el like. Inténtalo de nuevo.");
    } finally {
      setIsLoadingLike(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      // Verificar que ambos IDs existan antes de hacer la consulta
      if (!currentUserId || !id) {
        return;
      }

      const { data: connections, error } = await supabase
        .from("conexion")
        .select('*')
        .or(
          `and(usuario1_id.eq.${currentUserId},usuario2_id.eq.${id}),and(usuario1_id.eq.${id},usuario2_id.eq.${currentUserId})`
        );

      if (error) throw error;

      if (connections && connections.length > 0) {
        // Verificar si hay alguna conexión con estado true
        const matchConnection = connections.find(conn => conn.estado === true);
        
        if (matchConnection) {
          // Si hay una conexión con estado true, son amigos
          setConnectionStatus('match');
          setIsLiked(true);
          return;
        }

        // Si no hay match pero hay una conexión del usuario actual, es un like enviado
        const userConnection = connections.find(
          conn => conn.usuario1_id === currentUserId && conn.usuario2_id === id
        );
        
        if (userConnection) {
          setConnectionStatus('liked');
          setIsLiked(true);
        } else {
          setConnectionStatus('none');
          setIsLiked(false);
        }
      } else {
        setConnectionStatus('none');
        setIsLiked(false);
      }
    } catch (error) {
      console.error('Error al verificar el estado de la conexión:', error);
    }
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

  // Definir los componentes internos con sus tipos
  const ProfileSection: React.FC<ProfileSectionProps> = ({ icon, title, children }) => (
    <View className="mb-3">
      <View className="flex-row items-center mb-2">
        <Image source={icon} className="w-6 h-6 mr-2" />
        <Text className="text-xl font-semibold text-gray-800">{title}</Text>
      </View>
      {children}
    </View>
  );

  const ProfileItem: React.FC<ProfileItemProps> = ({ label, value }) => (
    <View className="flex-row justify-between items-center py-1 ">
      <Text className="text-primary-700 font-medium">{label}</Text>
      <Text className="text-gray-800">{value || "No especificado"}</Text>
    </View>
  );

  // Construir la URL pública de la foto de perfil
  const getProfileImageUrl = (fotoPerfilPath: string | null) => {
    if (!fotoPerfilPath) {
      return null;
    }
    return `${supabaseUrl}/storage/v1/object/public/fotoperfil/${fotoPerfilPath}`;
  };

  const renderSongItem = ({ item }: { item: Cancion }) => (
    <ProfileSongCard
      id={item.id}
      titulo={item.titulo}
      genero={item.genero}
      caratula={item.caratula}
      created_at={item.created_at}
      likes_count={item.likes_count}
    />
  );

  const renderVideoItem = ({ item }: { item: Video }) => (
    <ProfileVideoCard
      id={item.id}
      descripcion={item.descripcion}
      likes_count={item.likes_count}
      created_at={item.created_at}
    />
  );

  return (
    <View className="flex-1 bg-primary-600 p-1 pt-10">
      <View className="flex-row justify-between px-8 absolute top-20 w-full z-50">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="bg-secondary-400 p-2 rounded-full"
          style={{ elevation: 5 }}
        >
          <Ionicons name="arrow-back" size={24} color="#6D29D2" />
        </TouchableOpacity>

        {currentUserId && currentUserId !== id && (
          <View className="flex-row items-center">
            {connectionStatus === 'match' ? (
              <TouchableOpacity 
                onPress={() => router.push(`/chat/${id}`)}
                className="bg-secondary-400 p-2 rounded-full mr-2"
                style={{ elevation: 5 }}
              >
                <Ionicons name="chatbubble-outline" size={24} color="#6D29D2" />
              </TouchableOpacity>
            ) : null}
            
            <TouchableOpacity 
              onPress={handleLike}
              disabled={isLoadingLike || connectionStatus !== 'none'}
              className={`bg-secondary-400 p-2 rounded-full ${
                connectionStatus !== 'none' ? 'opacity-50' : ''
              }`}
              style={{ elevation: 5 }}
            >
              {isLoadingLike ? (
                <ActivityIndicator size="small" color="#6D29D2" />
              ) : (
                <>
                  <Ionicons 
                    name={connectionStatus !== 'none' ? "heart" : "heart-outline"} 
                    size={24} 
                    color={connectionStatus === 'match' ? "#E53E3E" : "#6D29D2"}
                  />
                  {connectionStatus === 'match' && (
                    <View className="absolute -top-1 -right-1 bg-green-500 rounded-full w-4 h-4 items-center justify-center">
                      <Ionicons name="checkmark" size={12} color="white" />
                    </View>
                  )}
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Indicador de estado de conexión */}
      {connectionStatus !== 'none' && (
        <View className="absolute top-32 right-8 z-50">
          <View 
            className={`px-3 py-1 rounded-full ${
              connectionStatus === 'match' 
                ? 'bg-green-500' 
                : 'bg-secondary-400'
            }`}
          >
            <Text className="text-white text-xs font-bold">
              {connectionStatus === 'match' ? 'Amigos' : 'Like enviado'}
            </Text>
          </View>
        </View>
      )}

      <ScrollView 
        className="flex-1 mt-4"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6D29D2"]} // Color primario
            tintColor="#6D29D2"  // Para iOS
          />
        }
      >
        <View className="px-4 pb-8">
          <View className="bg-white rounded-xl shadow-lg shadow-black/30 p-6 mb-4">
            <View className="items-center pb-4">
              <View className="w-36 h-36 rounded-full shadow-lg shadow-black/50 mb-4">
                {getProfileImageUrl(perfil.foto_perfil) ? (
                  <Image
                    source={{ 
                      uri: getProfileImageUrl(perfil.foto_perfil) || "https://via.placeholder.com/150"
                    }}
                    className="w-full h-full rounded-full border-10 border-secondary-500"
                  />
                ) : (
                  <View className="w-full h-full rounded-full bg-gray-300 justify-center items-center border-4 border-secondary-500">
                    <Image source={icons.person} className="w-20 h-20" />
                  </View>
                )}
              </View>
              <View className="flex-row items-center justify-center">
                <Text className="text-xl font-semibold text-primary-500">
                  {perfil.username}
                </Text>
                {perfil.insignias?.length > 0 && (
                  <TooltipBadge 
                    nivel={perfil.insignias[perfil.insignias.length - 1].nivel}
                    descripcion={perfil.insignias[perfil.insignias.length - 1].descripcion}
                  />
                )}
              </View>
              {perfil.tituloActivo && (
                <TooltipTitle 
                  nombre={perfil.tituloActivo.nombre}
                  descripcion={perfil.tituloActivo.descripcion}
                  nivel={perfil.tituloActivo.nivel}
                />
              )}

              {currentUserId && currentUserId !== id && (
                <TouchableOpacity
                  onPress={handleFollowToggle}
                  className={`mt-2 px-6 py-2 rounded-full ${
                    isFollowing 
                      ? 'bg-gray-200' 
                      : 'bg-primary-500'
                  }`}
                >
                  <Text className={`font-bold ${
                    isFollowing 
                      ? 'text-primary-500' 
                      : 'text-white'
                  }`}>
                    {isFollowing ? 'Siguiendo' : 'Seguir'}
                  </Text>
                </TouchableOpacity>
              )}

              <View className="flex-row items-center mt-2">
                <View className="items-center px-4">
                  <Text className="text-lg font-bold text-secondary-500">
                    {seguidoresCount}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    Seguidores
                  </Text>
                </View>
              </View>

              {perfil.preferencias?.mostrar_redes_sociales ? (
                <TouchableOpacity onPress={handleShowRatings}>
                  <View className="items-center mt-2">
                    <View className="flex-row">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name="star"
                          size={16}
                          color={star <= Math.round(perfil.promedio_valoraciones) ? "#FFD700" : "#E5E7EB"}
                        />
                      ))}
                      <Text className="text-gray-600 ml-2">
                        ({perfil.promedio_valoraciones.toFixed(1)})
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-500 mt-1">
                      {perfil.total_valoraciones} valoraciones como colaborador
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : null}
            </View>

            <ProfileSection icon={icons.usuarioperfil} title="Información Personal">
              <ProfileItem label="Ubicación" 
                value={perfil.preferencias?.mostrar_ubicacion ? perfil.ubicacion : "Ocultada por el usuario"} 
              />
              <ProfileItem label="Género" value={perfil.sexo} />
              {perfil.preferencias?.mostrar_edad ? (
                <ProfileItem label="Edad" value={perfil.edad.toString()} />
              ) : null}
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

            {perfil.preferencias?.mostrar_redes_sociales ? (
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
            ) : null}
          </View>

          <View className="flex-row justify-around mb-4">
            <TouchableOpacity
              onPress={() => setActiveTab('canciones')}
              className={`py-2 px-4 rounded-full ${activeTab === 'canciones' ? 'bg-secondary-500' : 'bg-white'}`}
            >
              <Text className={`${activeTab === 'canciones' ? 'text-white' : 'text-primary-500'} font-bold`}>Canciones</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('videos')}
              className={`py-2 px-4 rounded-full ${activeTab === 'videos' ? 'bg-secondary-500' : 'bg-white'}`}
            >
              <Text className={`${activeTab === 'videos' ? 'text-white' : 'text-primary-500'} font-bold`}>Videos</Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'canciones' && (
            <FlatList
              data={canciones}
              renderItem={renderSongItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text className="text-white text-center">
                  No hay canciones para mostrar
                </Text>
              }
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
      <Modal
        visible={showRatings}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRatings(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="bg-white rounded-t-3xl p-4 h-3/4 mt-auto">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold">Valoraciones de {perfil.username}</Text>
              <TouchableOpacity onPress={() => setShowRatings(false)}>
                <Ionicons name="close" size={24} color="#4A148C" />
              </TouchableOpacity>
            </View>
            <RatingsList ratings={ratings} />
          </View>
        </View>
      </Modal>
      {currentUserId && currentUserId !== id && (
        <View className="flex-row justify-center mt-2">
          <ReportButton
            contentId={id}
            contentType="perfil"
            reportedUserId={id}
            currentUserId={currentUserId}
            buttonStyle="bg-red-500/70"
            buttonText="Reportar perfil"
          />
        </View>
      )}
    </View>
  )
}