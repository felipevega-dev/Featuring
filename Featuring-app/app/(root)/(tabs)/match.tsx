import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Animated,
  TouchableOpacity,
  PanResponder,
  Linking,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { icons } from "@/constants";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { useLocalSearchParams } from 'expo-router';
import Constants from "expo-constants";
import { sendPushNotification } from '@/utils/pushNotifications';
import { RealtimeChannel } from '@supabase/supabase-js';
import { ReportButton } from '@/components/reports/ReportButton';
import { useFocusEffect } from 'expo-router';

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
  currentUserId: string;
  [key: string]: any;
}

const Card: React.FC<CardProps> = ({
  card,
  isFirst,
  onSwipe,
  onLike,
  currentUserId,
  ...rest
}) => {
  const [imageError, setImageError] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const position = useRef(new Animated.ValueXY()).current;
  const [swipeDirection, setSwipeDirection] = useState<'none' | 'left' | 'right'>('none');
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const rotate = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: "clamp",
  });

  const greenOverlayOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 0.2],
    extrapolate: 'clamp',
  });

  const redOverlayOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [0.2, 0],
    extrapolate: 'clamp',
  });

  const handleProfilePress = () => {
    router.push(`/public-profile/${card.usuario_id}`);
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => {
      const { locationX } = evt.nativeEvent;
      const cardWidth = Dimensions.get('window').width * 0.9; // 90% del ancho de la pantalla
      const lateralZoneWidth = cardWidth * 0.3; // 30% de cada lado

      // Solo activar el panResponder si el toque está en los laterales
      return locationX < lateralZoneWidth || locationX > (cardWidth - lateralZoneWidth);
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      const { locationX } = evt.nativeEvent;
      const cardWidth = Dimensions.get('window').width * 0.9;
      const lateralZoneWidth = cardWidth * 0.3;

      // Solo permitir el movimiento si comenzó en los laterales
      return locationX < lateralZoneWidth || locationX > (cardWidth - lateralZoneWidth);
    },
    onPanResponderGrant: () => {
      position.setOffset({
        x: position.x.__getValue(),
        y: position.y.__getValue()
      });
    },
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
      if (gesture.dx > 0) {
        setSwipeDirection('right');
      } else if (gesture.dx < 0) {
        setSwipeDirection('left');
      }
    },
    onPanResponderRelease: (_, gesture) => {
      position.flattenOffset();
      if (gesture.dx > SWIPE_THRESHOLD) {
        Animated.spring(position, {
          toValue: { x: SWIPE_THRESHOLD * 2, y: gesture.dy },
          useNativeDriver: true,
        }).start(() => {
          onLike && onLike(card.usuario_id);
          setSwipeDirection('none');
        });
      } else if (gesture.dx < -SWIPE_THRESHOLD) {
        Animated.spring(position, {
          toValue: { x: -SWIPE_THRESHOLD * 2, y: gesture.dy },
          useNativeDriver: true,
        }).start(() => {
          onSwipe && onSwipe("left");
          setSwipeDirection('none');
        });
      } else {
        Animated.spring(position, {
          toValue: { x: 0, y: 0 },
          friction: 4,
          useNativeDriver: true,
        }).start(() => {
          setSwipeDirection('none');
        });
      }
    }
  });

  // Usar la variable supabaseUrl que ya está declarada en el componente padre
  const profileImageUrl = card.foto_perfil 
    ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${card.foto_perfil}`
    : null;

  const renderHabilidades = (habilidades: { habilidad: string }[]) => {
    return habilidades.slice(0, 3).map((h, index) => (
      <View 
        key={index} 
        className="bg-secondary-100 rounded-full px-3 py-1 mr-2"
      >
        <Text className="text-xs text-secondary-700">{h.habilidad}</Text>
      </View>
    ));
  };

  const renderGeneros = (generos: { genero: string }[]) => {
    return generos.slice(0, 3).map((g, index) => (
      <View 
        key={index} 
        className="bg-primary-100 rounded-full px-3 py-1 mr-2"
      >
        <Text className="text-xs text-primary-700">{g.genero}</Text>
      </View>
    ));
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

  // Crear transformaciones animadas para los botones
  const buttonTransform = {
    transform: [
      {
        translateX: position.x.interpolate({
          inputRange: [-SWIPE_THRESHOLD * 2, 0, SWIPE_THRESHOLD * 2],
          outputRange: [-SWIPE_THRESHOLD * 2, 0, SWIPE_THRESHOLD * 2],
        }),
      },
      {
        translateY: position.y,
      },
      {
        rotate: rotate,
      },
    ],
  };

  return (
    <View className="absolute w-[90%] h-[75%]" style={{ top: '3%', left: '5%' }}>
      {/* Botones de acción */}
      <View className="absolute top-4 left-2 right-2 flex-row justify-between z-50">
        <ReportButton
          contentId={card.usuario_id}
          contentType="perfil"
          reportedUserId={card.usuario_id}
          currentUserId={currentUserId}
          buttonStyle="bg-danger-400 shadow-md"
          iconOnly={true}
        />
        <TouchableOpacity
          onPress={() => router.push("/preferencias")}
          className="bg-secondary-400 p-2 rounded-full shadow-md"
        >
          <Ionicons name="settings-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Botón Ver Perfil */}
      <Animated.View 
        style={[buttonTransform]}
        className="absolute top-[56%] left-[30%] right-[30%] z-50"
      >
        <TouchableOpacity
          onPress={() => router.push(`/public-profile/${card.usuario_id}`)}
        >
          <View className="bg-primary-500 px-4 py-2 rounded-full">
            <Text className="text-white font-bold text-center">Ver Perfil</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View
        {...(isFirst ? panResponder.panHandlers : {})}
        className="w-full h-full bg-white rounded-xl overflow-hidden"
        style={[
          {
            transform: [
              { translateX: position.x },
              { translateY: position.y },
              { rotate: rotate },
            ],
          },
        ]}
      >
        {/* Overlay Verde para Like */}
        {isFirst && (
          <Animated.View 
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#00FF00',
              opacity: greenOverlayOpacity,
              zIndex: 2,
            }}
          />
        )}

        {/* Overlay Rojo para Nope */}
        {isFirst && (
          <Animated.View 
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#FF0000',
              opacity: redOverlayOpacity,
              zIndex: 2,
            }}
          />
        )}

        {/* Contenido de la tarjeta */}
        <View className="w-full h-full rounded-xl overflow-hidden relative">
          {profileImageUrl && !imageError ? (
            <Image
              source={{ uri: profileImageUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full bg-gray-300 justify-center items-center">
              <Image source={icons.person} className="w-20 h-20 opacity-50" />
            </View>
          )}

          {/* Contenido superpuesto */}
          <View className="absolute top-0 w-full p-4">
            <View className="bg-primary-600/80 rounded-full w-3/4 mx-auto px-6 py-2">
              <Text className="text-white text-center font-bold">{card.mensaje}</Text>
            </View>
          </View>


          {/* Información del usuario y habilidades */}
          <View className="absolute bottom-0 w-full p-4 bg-black/50 rounded-b-xl">
            <View className="flex-row items-center justify-center mb-3">
              <View>
                <Text className="text-white text-2xl font-bold text-center">
                  {card.username}
                </Text>
                <Text className="text-white/80 text-center">
                  {card.edad} años • {card.ubicacion}
                </Text>
                {card.distance !== undefined && (
                  <Text className="text-white/60 text-center">
                    {card.distance.toFixed(1)} km de distancia
                  </Text>
                )}
              </View>
            </View>

            {/* Géneros */}
            <View className="flex-row flex-wrap mb-2 justify-center">
              {renderGeneros(card.perfil_genero)}
            </View>

            {/* Habilidades */}
            <View className="flex-row flex-wrap mb-3 justify-center">
              {renderHabilidades(card.perfil_habilidad)}
            </View>
          </View>
        </View>
      </Animated.View>

      {/* Botones fuera de la zona de deslizamiento */}
      {isFirst && (
        <View className="absolute bottom-[-75] w-full flex-row justify-center space-x-8">
          <TouchableOpacity
            className="bg-white w-16 h-16 rounded-full items-center justify-center shadow-lg"
            onPress={() => onSwipe && onSwipe("left")}
          >
            <FontAwesome name="times" size={34} color="#FF3B30" />
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-white w-16 h-16 rounded-full items-center justify-center shadow-lg"
            onPress={() => onLike && onLike(card.usuario_id)}
          >
            <FontAwesome name="music" size={34} color="#34C759" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default function Match() {
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
  const [subscriptions, setSubscriptions] = useState<RealtimeChannel[]>([]);

  // Este efecto se ejecutará cada vez que la pantalla reciba el foco
  useFocusEffect(
    useCallback(() => {
      if (currentUserId && userLocation) {
        fetchUsers();
      }
    }, [currentUserId, userLocation])
  );

  useEffect(() => {
    getCurrentUser();
    getUserLocation();
  }, []);

  useEffect(() => {
    if (currentUserId && userLocation) {
      fetchUsers();
    }
  }, [currentUserId, userLocation, update]);

  useEffect(() => {
    if (currentUserId) {
      // Suscripción a cambios en conexiones
      const conexionChannel = supabase
        .channel(`conexion-changes-${currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conexion',
            filter: `or(usuario1_id.eq.${currentUserId},usuario2_id.eq.${currentUserId})`
          },
          (payload) => {
            console.log('Cambio en conexiones:', payload);
            fetchUsers();
          }
        )
        .subscribe();

      // Suscripción a cambios en preferencias
      const preferencesChannel = supabase
        .channel(`preferencias-changes-${currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'preferencias_usuario',
            filter: `usuario_id.eq.${currentUserId}`
          },
          (payload) => {
            console.log('Cambio en preferencias:', payload);
            fetchUsers();
          }
        )
        .subscribe();

      setSubscriptions([conexionChannel, preferencesChannel]);

      // Limpieza al desmontar
      return () => {
        conexionChannel.unsubscribe();
        preferencesChannel.unsubscribe();
      };
    }
  }, [currentUserId]);

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

      // Obtener las preferencias del usuario actual
      const { data: userPreferences, error: preferencesError } = await supabase
        .from("preferencias_usuario")
        .select(`
          preferencias_genero,
          preferencias_habilidad,
          preferencias_distancia,
          match_filtrar_edad,
          match_rango_edad,
          match_filtrar_sexo,
          match_sexo_preferido
        `)
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
          // Filtro de distancia existente
          if (userPreferences.preferencias_distancia !== null && 
              profile.distance && 
              profile.distance > userPreferences.preferencias_distancia) {
            return false;
          }

          // Filtro de géneros existente
          if (userPreferences.preferencias_genero && 
              userPreferences.preferencias_genero.length > 0 &&
              !profile.perfil_genero.some(g => 
                userPreferences.preferencias_genero.includes(g.genero))) {
            return false;
          }

          // Filtro de habilidades existente
          if (userPreferences.preferencias_habilidad && 
              userPreferences.preferencias_habilidad.length > 0 &&
              !profile.perfil_habilidad.some(h => 
                userPreferences.preferencias_habilidad.includes(h.habilidad))) {
            return false;
          }

          // Nuevo filtro de edad
          if (userPreferences.match_filtrar_edad && 
              userPreferences.match_rango_edad && 
              (profile.edad < userPreferences.match_rango_edad[0] || 
               profile.edad > userPreferences.match_rango_edad[1])) {
            return false;
          }

          // Corregir el filtro de sexo
          if (userPreferences.match_filtrar_sexo) {
            // Si es 'todos', no aplicar filtro
            if (userPreferences.match_sexo_preferido === 'todos') {
              return true;
            }
            
            // Mapear la preferencia al valor correcto en la base de datos
            const sexoMap = {
              'F': 'Femenino',
              'M': 'Masculino',
              'O': 'Otro'
            };
            
            const sexoBuscado = sexoMap[userPreferences.match_sexo_preferido];
            
            // Comparar el sexo del perfil con la preferencia mapeada
            if (profile.sexo !== sexoBuscado) {
              return false;
            }
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
          return true;
        } else {
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

        // Obtener el token de push y username del usuario que recibe el like
        const { data: likedUserData, error: likedUserError } = await supabase
          .from('perfil')
          .select('username, push_token')
          .eq('usuario_id', likedUserId)
          .single();

        if (likedUserError) throw likedUserError;

        const isMatch = await saveConnection(currentUserId, likedUserId);

        // Enviar notificación push de like si el usuario tiene token
        if (likedUserData?.push_token) {
          await sendPushNotification(
            likedUserData.push_token,
            '¡Nuevo Like!',
            `${userData.username} te ha dado like`
          );
        }

        // Actualizar inmediatamente el estado local
        setCards((prevCards) => {
          const newCards = prevCards.filter(card => card.usuario_id !== likedUserId);
          setShownCards((prev) => new Set(prev).add(likedUserId));
          return newCards;
        });

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

        if (isMatch) {
          showMatchAlert(likedUserId);

          // Enviar notificación push de match a ambos usuarios
          if (likedUserData?.push_token) {
            await sendPushNotification(
              likedUserData.push_token,
              '¡Nuevo Match!',
              `¡Has hecho match con ${userData.username}!`
            );
          }

          // Obtener el push token del usuario actual para notificarle también
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

          // Crear notificaciones de match
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
                mensaje: `¡Has hecho match con ${likedUserData.username}!`,
                leido: false
              }
            ]);

          if (matchNotificationError) {
            console.error('Error al crear notificaciones de match:', matchNotificationError);
          }
        }

      } catch (error) {
        console.error('Error en handleLike:', error);
      }
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          Animated.spring(position, {
            toValue: { x: SWIPE_THRESHOLD * 2, y: gesture.dy },
            useNativeDriver: true,
          }).start(() => {
            const currentCard = cards[0];
            if (currentCard) {
              handleLike(currentCard.usuario_id);
            }
          });
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          Animated.spring(position, {
            toValue: { x: -SWIPE_THRESHOLD * 2, y: gesture.dy },
            useNativeDriver: true,
          }).start(() => {
            handleSwipe("left");
          });
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 4,
            useNativeDriver: true,
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
              currentUserId={currentUserId || ''}
              panHandlers={panResponder.panHandlers}
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
            currentUserId={currentUserId || ''}
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
          onPress={refreshCards}
          className="absolute top-10 right-5 bg-white p-2 rounded-full shadow-md"
        >
          <Ionicons name="refresh" size={28} color="#6D29D2" />
        </TouchableOpacity>

        {cards.length > 0 ? (
          <View className="absolute w-[90%] h-[95%]" style={{ top: '3%', left: '5%' }}>
            {renderCards()}
          </View>
        ) : (
          <Text className="text-xl text-center">No hay más perfiles disponibles</Text>
        )}
      </View>
    </GestureHandlerRootView>
  );
};