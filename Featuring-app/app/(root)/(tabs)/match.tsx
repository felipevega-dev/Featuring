import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Animated,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Linking,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { icons } from "@/constants";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { useLocalSearchParams } from 'expo-router';
import Constants from "expo-constants";

const SWIPE_THRESHOLD = 120;

interface CardProps {
  card: {
    usuario_id: string;
    username: string;
    biografia: string;
    foto_perfil: string | null;
    ubicacion: string;
    edad: number;
    sexo: string;
    perfil_habilidad: { habilidad: string }[];
    perfil_genero: { genero: string }[];
    latitud: number;
    longitud: number;
    distance?: number;
    mensaje: string;
    red_social: { nombre: string; url: string }[];
  };
  isFirst?: boolean;
  onSwipe?: (direction: "left" | "right") => void;
  onLike?: (userId: string) => void;
  [key: string]: any;
}

const Card: React.FC<CardProps> = ({
  card,
  isFirst,
  onSwipe,
  onLike,
  ...rest
}) => {
  const [imageError, setImageError] = useState(false);
  const router = useRouter();

  // Actualizar la URL del bucket de Supabase
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
  const getProfileImageUrl = (fotoPerfilPath: string | null) => {
    if (!fotoPerfilPath) {
      return null;
    }
    return `${supabaseUrl}/storage/v1/object/public/fotoperfil/${fotoPerfilPath}`;
  };

  // Usar la nueva función para obtener la URL
  const profileImageUrl = card.foto_perfil ? getProfileImageUrl(card.foto_perfil) : null;

  const renderHabilidades = (
    habilidades: { habilidad: string }[] | null | undefined
  ) => {
    if (!habilidades || habilidades.length === 0)
      return "Sin habilidades especificadas";
    const habilidadesArray = habilidades.map((h) => h.habilidad);
    return habilidadesArray.length <= 3
      ? habilidadesArray.join(", ")
      : `${habilidadesArray.slice(0, 3).join(", ")} y ${habilidadesArray.length - 3} más`;
  };

  const renderGeneros = (generos: { genero: string }[] | null | undefined) => {
    if (!generos || generos.length === 0) return "Sin géneros especificados";
    return generos.map((g) => g.genero).join(", ");
  };

  const getRedSocialIcon = (nombre: string): keyof typeof FontAwesome.glyphMap => {
    const iconMap: { [key: string]: keyof typeof FontAwesome.glyphMap } = {
      soundcloud: 'soundcloud',
      instagram: 'instagram',
      facebook: 'facebook',
      twitter: 'twitter',
      spotify: 'spotify',
    };
    return iconMap[nombre.toLowerCase()] || 'link';
  };

  const handleRedSocialPress = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Error al abrir el enlace:", err)
    );
  };

  return (
    <Animated.View
      className={`absolute w-[85%] justify-start items-center h-[85%] bg-white rounded-xl shadow-lg ${
        isFirst ? "z-10" : ""
      } top-5 border-2 border-primary-500 shadow-primary-500`}
      {...rest}
    >
      <View className="w-full px-4 py-2 bg-primary-600 rounded-t-xl">
        <Text className="text-white text-center font-bold">{card.mensaje}</Text>
      </View>
      <View className="w-[75%] mt-2 h-2/5 rounded-xl overflow-hidden">
        {profileImageUrl && !imageError ? (
          <Image
            source={{ uri: profileImageUrl }}
            className="w-full h-full rounded-xl border-4 border-secondary-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <View className="w-full h-full rounded-xl bg-gray-300 justify-center items-center border-4 border-secondary-500">
            <Image source={icons.person} className="w-20 h-20" />
            <Text className="mt-2 text-gray-500">
              {imageError
                ? "Error al cargar la imagen"
                : "No hay imagen de perfil"}
            </Text>
          </View>
        )}
      </View>
      <View className="p-4 w-full justify-center items-center">
        <Text className="text-xl text-center font-bold">{card.username}</Text>
        <View className="flex-row justify-center items-center mt-1">
          <Text className="text-gray-500 font-bold">{card.ubicacion}</Text>
          <Text className="text-gray-500 font-bold mx-2">•</Text>
          <Text className="font-bold">{card.edad} años</Text>
        </View>
        {card.distance !== undefined && (
          <Text className="text-gray-500 mt-1">
            {card.distance.toFixed(1)} km de distancia
          </Text>
        )}
        <Text className="text-center mt-2 text-black">{card.biografia}</Text>
        <Text className="text-center mt-2 text-primary-500 font-semibold">
          {renderHabilidades(card.perfil_habilidad)}
        </Text>
        <TouchableOpacity
          className="bg-primary-500 rounded-full mt-4 p-2 w-1/2"
          onPress={() => router.push(`/public-profile/${card.usuario_id}`)}
        >
          <Text className="text-white font-bold text-center">Ver Perfil</Text>
        </TouchableOpacity>
        <View className="flex-row justify-between w-full mb-10">
          <TouchableOpacity
            className="pb-10"
            onPress={() => onSwipe && onSwipe("left")}
          >
            <FontAwesome name="times" size={34} color="#00BFA5" />
          </TouchableOpacity>
          <TouchableOpacity
            className="pb-10"
            onPress={() => onLike && onLike(card.usuario_id)}
          >
            <FontAwesome name="music" size={34} color="#6D29D2" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const Match = () => {
  const { update } = useLocalSearchParams();
  const [cards, setCards] = useState<CardProps["card"][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: "clamp",
  });
  const router = useRouter();
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const [shownCards, setShownCards] = useState<Set<string>>(new Set());
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);

  useEffect(() => {
    getCurrentUser();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (currentUserId && userLocation) {
      fetchUsers();
    }
  }, [currentUserId, userLocation, update]);

  const getCurrentUser = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      if (user) {
        setCurrentUserId(user.id);
      } else {
        console.error("No hay usuario autenticado");
      }
    } catch (error) {
      console.error("Error al obtener el usuario actual:", error);
    }
  };

  const getUserLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.error("Permiso de ubicación denegado");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setUserLocation(location);
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const fetchUsers = async () => {
    if (!currentUserId || !userLocation) return;

    try {
      setIsLoading(true);

      const { data: userPreferences, error: preferencesError } = await supabase
        .from("perfil")
        .select("preferencias_genero, preferencias_habilidad, preferencias_distancia")
        .eq("usuario_id", currentUserId)
        .single();

      if (preferencesError) throw preferencesError;

      const { data: connections, error: connectionsError } = await supabase
        .from("conexion")
        .select("usuario1_id, usuario2_id, estado")
        .or(`usuario1_id.eq.${currentUserId},usuario2_id.eq.${currentUserId}`);

      if (connectionsError) throw connectionsError;

      const excludedUserIds = new Set(
        connections.flatMap((conn) => {
          if (conn.estado === true) {
            return [conn.usuario1_id === currentUserId ? conn.usuario2_id : conn.usuario1_id];
          } else if (conn.usuario1_id === currentUserId) {
            return [conn.usuario2_id];
          }
          return [];
        })
      );

      shownCards.forEach((id) => excludedUserIds.add(id));

      const { data: profiles, error: profilesError } = await supabase
        .from("perfil")
        .select(`
          usuario_id,
          username,
          biografia,
          foto_perfil,
          edad,
          sexo,
          ubicacion,
          perfil_habilidad (habilidad),
          perfil_genero (genero),
          latitud,
          longitud,
          mensaje,
          red_social (nombre, url)
        `)
        .not("usuario_id", "in", `(${Array.from(excludedUserIds).join(",")})`)
        .neq("usuario_id", currentUserId);

      if (profilesError) throw profilesError;

      const processedProfiles = profiles
        .map((profile) => ({
          ...profile,
          distance: profile.latitud && profile.longitud
            ? calculateDistance(
                userLocation.coords.latitude,
                userLocation.coords.longitude,
                profile.latitud,
                profile.longitud
              )
            : undefined,
        }))
        .filter(profile => {
          if (userPreferences.preferencias_distancia !== null && 
              profile.distance && 
              profile.distance > userPreferences.preferencias_distancia) {
            return false;
          }
          if (userPreferences.preferencias_genero && userPreferences.preferencias_genero.length > 0 &&
              !profile.perfil_genero.some(g => userPreferences.preferencias_genero.includes(g.genero))) {
            return false;
          }
          if (userPreferences.preferencias_habilidad && userPreferences.preferencias_habilidad.length > 0 &&
              !profile.perfil_habilidad.some(h => userPreferences.preferencias_habilidad.includes(h.habilidad))) {
            return false;
          }
          return true;
        });

      setCards(processedProfiles);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConnection = async (
    userId1: string,
    userId2: string
  ): Promise<boolean> => {
    try {
      const { data: existingConnections, error: selectError } = await supabase
        .from("conexion")
        .select()
        .or(
          `and(usuario1_id.eq.${userId1},usuario2_id.eq.${userId2}),and(usuario1_id.eq.${userId2},usuario2_id.eq.${userId1})`
        );

      if (selectError) throw selectError;

      if (existingConnections && existingConnections.length > 0) {
        const existingConnection = existingConnections[0];
        if (
          existingConnection.usuario1_id === userId2 &&
          existingConnection.usuario2_id === userId1
        ) {
          await updateConnectionStatus(existingConnection.id, true);
          const { data: newConnection, error: insertError } = await supabase
            .from("conexion")
            .insert({
              usuario1_id: userId1,
              usuario2_id: userId2,
              estado: true,
            })
            .select()
            .single();
          if (insertError) throw insertError;
          if (newConnection) {
            await updateConnectionStatus(newConnection.id, true);
          }
          console.log("¡Es un match!");
          return true;
        } else {
          console.log("La conexión ya existe");
        }
        return false;
      }

      const { error: insertError } = await supabase.from("conexion").insert({
        usuario1_id: userId1,
        usuario2_id: userId2,
        estado: false,
      });

      if (insertError) throw insertError;

      console.log("Conexión guardada, esperando match");

      return false;
    } catch (error) {
      console.error("Error al guardar la conexión:", error);
      return false;
    }
  };

  const updateConnectionStatus = async (
    connectionId: string,
    status: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("conexion")
        .update({ estado: status })
        .eq("id", connectionId);

      if (error) throw error;
      console.log(`Conexión ${connectionId} actualizada a estado: ${status}`);
    } catch (error) {
      console.error("Error al actualizar el estado de la conexión:", error);
    }
  };

  const showMatchAlert = (matchedUserId: string) => {
    Alert.alert(
      "¡Felicidades!",
      "Es una conexión",
      [
        {
          text: "Enviar mensaje",
          onPress: () => router.push(`/chat/${matchedUserId}` as any),
        },
        {
          text: "Continuar",
          onPress: () => console.log("Usuario continuó sin enviar mensaje"),
          style: "cancel",
        },
      ],
      { cancelable: false }
    );
  };

  const handleSwipe = (direction: "left" | "right") => {
    Animated.timing(position, {
      toValue: {
        x: direction === "right" ? SWIPE_THRESHOLD : -SWIPE_THRESHOLD,
        y: 0,
      },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      console.log("no");
      setCards((prevCards) => {
        if (prevCards.length > 0) {
          setShownCards((prev) => new Set(prev).add(prevCards[0].usuario_id));
        }
        return prevCards.slice(1);
      });
      position.setValue({ x: 0, y: 0 });
    });
  };

  const handleLike = async (likedUserId: string) => {
    if (currentUserId) {
      try {
        // Obtener el username del usuario que da like
        const { data: userData, error: userError } = await supabase
          .from('perfil')
          .select('username')
          .eq('usuario_id', currentUserId)
          .single();

        if (userError) throw userError;

        const isMatch = await saveConnection(currentUserId, likedUserId);

        // Crear notificación de like
        const { error: notificationError } = await supabase
          .from('notificacion')
          .insert({
            usuario_id: likedUserId,
            tipo_notificacion: 'like',
            leido: false,
            usuario_origen_id: currentUserId,
            mensaje: `${userData.username} te ha dado like`
          });

        if (notificationError) {
          console.error('Error al crear notificación de like:', notificationError);
        }

        setCards((prevCards) => {
          setShownCards((prev) => new Set(prev).add(likedUserId));
          return prevCards.slice(1);
        });

        if (isMatch) {
          showMatchAlert(likedUserId);
          // Obtener el username del usuario que recibe el match
          const { data: matchedUserData, error: matchedUserError } = await supabase
            .from('perfil')
            .select('username')
            .eq('usuario_id', likedUserId)
            .single();

          if (matchedUserError) throw matchedUserError;

          // Crear notificaciones de match para ambos usuarios
          const { error: matchNotificationError } = await supabase
            .from('notificacion')
            .insert([
              {
                usuario_id: likedUserId,
                tipo_notificacion: 'match',
                usuario_origen_id: currentUserId,
                mensaje: `¡Has hecho match con ${userData.username}!`,
                leido: false
              },
              {
                usuario_id: currentUserId,
                tipo_notificacion: 'match',
                usuario_origen_id: likedUserId,
                mensaje: `¡Has hecho match con ${matchedUserData.username}!`,
                leido: false
              }
            ]);

          if (matchNotificationError) {
            console.error('Error al crear notificaciones de match:', matchNotificationError);
          }
        }

        position.setValue({ x: 0, y: 0 });
      } catch (error) {
        console.error('Error en handleLike:', error);
      }
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (
        _: GestureResponderEvent,
        gesture: PanResponderGestureState
      ) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (
        _: GestureResponderEvent,
        gesture: PanResponderGestureState
      ) => {
        if (Math.abs(gesture.dx) > SWIPE_THRESHOLD) {
          const direction = gesture.dx > 0 ? "right" : "left";
          handleSwipe(direction);
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 4,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const renderCards = () => {
    return cards
      .map((card, index) => {
        if (index === 0) {
          return (
            <Card
              key={card.usuario_id}
              card={card}
              isFirst={true}
              onSwipe={handleSwipe}
              onLike={handleLike}
              {...panResponder.panHandlers}
              style={{
                transform: [
                  { translateX: position.x },
                  { translateY: position.y },
                  { rotate: rotate },
                ],
              }}
            />
          );
        }
        return (
          <Card
            key={card.usuario_id}
            card={card}
            isFirst={false}
            onSwipe={handleSwipe}
            onLike={handleLike}
          />
        );
      })
      .reverse();
  };

  const refreshCards = () => {
    setLastRefreshTime(Date.now());
    position.setValue({ x: 0, y: 0 });
    fetchUsers();
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#6D29D2" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1 items-center justify-center bg-gray-100">
        <TouchableOpacity
          onPress={() => router.push("/preferencias")}
          className="absolute top-10 left-5 z-50 bg-white p-2 rounded-full shadow-md"
        >
          <Ionicons name="settings-outline" size={28} color="#6D29D2" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={refreshCards}
          className="absolute top-10 right-5 bg-white p-2 rounded-full shadow-md"
        >
          <Ionicons name="refresh" size={28} color="#6D29D2" />
        </TouchableOpacity>

        {cards.length > 0 ? (
          renderCards()
        ) : (
          <Text className="text-xl text-center">No hay más perfiles disponibles</Text>
        )}
      </View>
    </GestureHandlerRootView>
  );
};

export default Match;
