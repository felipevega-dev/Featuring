import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Image, Animated, TouchableOpacity, PanResponder, GestureResponderEvent, PanResponderGestureState, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FontAwesome } from '@expo/vector-icons';
import { supabase } from "@/lib/supabase";
import { icons } from "@/constants";
import { useRouter } from 'expo-router';

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
    perfil_habilidad: { habilidad: string }[]; // Cambiamos esto
  };
  isFirst?: boolean;
  onSwipe?: (direction: 'left' | 'right') => void;
  onLike?: (userId: string) => void;
  onViewProfile?: (user: CardProps['card']) => void;
  [key: string]: any;
}

interface UserProfileModalProps {
  isVisible: boolean;
  onClose: () => void;
  user: CardProps['card'];
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isVisible, onClose, user }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
        <View className="bg-white rounded-xl p-5 w-[90%] max-h-[80%]">
          <ScrollView>
            <TouchableOpacity className="absolute top-2 right-2 z-10" onPress={onClose}>
              <FontAwesome name="close" size={24} color="black" />
            </TouchableOpacity>
            <View className="items-center mb-4">
              {user.foto_perfil ? (
                <Image
                  source={{ uri: user.foto_perfil }}
                  className="w-32 h-32 rounded-full"
                />
              ) : (
                <View className="w-32 h-32 rounded-full bg-gray-300 justify-center items-center">
                  <FontAwesome name="user" size={50} color="white" />
                </View>
              )}
              <Text className="text-xl font-bold mt-2">{user.username}</Text>
              <Text className="text-gray-600">{user.edad} años • {user.ubicacion}</Text>
            </View>
            <Text className="font-bold mb-2">Biografía:</Text>
            <Text className="mb-4">{user.biografia}</Text>
            <Text className="font-bold mb-2">Habilidades:</Text>
            <View className="flex-row flex-wrap mb-4">
              {user.perfil_habilidad.map((habilidad, index) => (
                <View key={index} className="bg-blue-100 rounded-full px-3 py-1 m-1">
                  <Text className="text-blue-800">{habilidad.habilidad}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const Card: React.FC<CardProps> = ({ card, isFirst, onSwipe, onLike, onViewProfile, ...rest }) => {
  const [imageError, setImageError] = useState(false);

  const renderHabilidades = (habilidades: { habilidad: string }[] | null | undefined) => {
    if (!habilidades || habilidades.length === 0) {
      return "Sin habilidades especificadas";
    }
    const habilidadesArray = habilidades.map(h => h.habilidad);
    if (habilidadesArray.length <= 3) {
      return habilidadesArray.join(', ');
    } else {
      const visibleHabilidades = habilidadesArray.slice(0, 3);
      const extraHabilidades = habilidadesArray.length - 3;
      return `${visibleHabilidades.join(', ')} y ${extraHabilidades} más`;
    }
  };

  return (
    <Animated.View
      className={`absolute w-[85%] justify-start items-center h-[85%] bg-white rounded-xl shadow-lg ${
        isFirst ? 'z-10' : ''
      } top-5 border-2 border-blue-500 shadow-blue-500`}
      {...rest}
    >
      <View className="w-[75%] mt-5 h-2/4 rounded-t-xl overflow-hidden">
        {card.foto_perfil && !imageError ? (
          <Image
            source={{ uri: card.foto_perfil }}
            className="w-full h-full rounded-full border-4 border-secondary-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <View className="w-full h-full rounded-full bg-gray-300 justify-center items-center border-4 border-secondary-500">
            <Image source={icons.person} className="w-20 h-20" />
            <Text className="mt-2 text-gray-500">
              {imageError ? 'Error al cargar la imagen' : 'No hay imagen de perfil'}
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
        <Text className="text-center mt-2">{card.biografia}</Text>
        <Text className="text-center mt-2 text-blue-500 font-semibold">
          {renderHabilidades(card.perfil_habilidad)}
        </Text>
        <TouchableOpacity 
          className="bg-blue-500 rounded-full mt-4 p-2 w-1/2"
          onPress={() => onViewProfile && onViewProfile(card)}
        >
          <Text className="text-white font-bold text-center">Ver Perfil</Text>
        </TouchableOpacity>
        <View className="flex-row justify-between w-full mb-10" >
          <TouchableOpacity className="pb-10" onPress={() => onSwipe && onSwipe('left')}>
            <FontAwesome name="times" size={34} color="red" />
          </TouchableOpacity>
          <TouchableOpacity className="pb-10" onPress={() => onLike && onLike(card.usuario_id)}>
            <FontAwesome name="music" size={34} color="blue" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const Match = () => {
  const [cards, setCards] = useState<CardProps['card'][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<CardProps['card'] | null>(null);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchUsers();
    }
  }, [currentUserId]);

  const getCurrentUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (user) {
        setCurrentUserId(user.id);
      } else {
        console.error('No hay usuario autenticado');
      }
    } catch (error) {
      console.error('Error al obtener el usuario actual:', error);
    }
  };

  const fetchUsers = async () => {
    if (!currentUserId) return;

    try {
      setIsLoading(true);

      // Obtenemos las conexiones donde el usuario actual es usuario1_id o usuario2_id
      const { data: connections, error: connectionsError } = await supabase
        .from('conexion')
        .select('usuario1_id, usuario2_id, estado')
        .or(`usuario1_id.eq.${currentUserId},usuario2_id.eq.${currentUserId}`);

      if (connectionsError) throw connectionsError;

      // Creamos un conjunto de IDs de usuarios que el usuario actual ya ha likeado
      const likedUserIds = new Set(
        connections
          .filter(conn => conn.usuario1_id === currentUserId)
          .map(conn => conn.usuario2_id)
      );

      // Obtenemos los IDs de usuarios que han dado like al usuario actual pero aún no hay match
      const likedByUserIds = new Set(
        connections
          .filter(conn => conn.usuario2_id === currentUserId && !conn.estado)
          .map(conn => conn.usuario1_id)
      );

      // Obtenemos todos los perfiles excepto el del usuario actual
      const { data: profiles, error: profilesError } = await supabase
        .from('perfil')
        .select(`
          usuario_id,
          username,
          biografia,
          foto_perfil,
          edad,
          sexo,
          ubicacion,
          perfil_habilidad (habilidad)
        `)
        .neq('usuario_id', currentUserId);

      if (profilesError) throw profilesError;

      // Filtramos y procesamos los perfiles
      const processedProfiles = await Promise.all(profiles
        .filter(profile => !likedUserIds.has(profile.usuario_id) || likedByUserIds.has(profile.usuario_id))
        .map(async (profile) => {
          let imageUrl = profile.foto_perfil;
          if (profile.foto_perfil && !profile.foto_perfil.startsWith('http') && !profile.foto_perfil.startsWith('file:')) {
            try {
              const { data, error } = await supabase
                .storage
                .from('avatars')
                .createSignedUrl(profile.foto_perfil, 60 * 60);

              if (data && !error) {
                imageUrl = data.signedUrl;
              } else {
                console.log(`No se pudo obtener URL firmada para ${profile.username}, usando URL original`);
              }
            } catch (error) {
              console.log(`Error al procesar la foto de perfil de ${profile.username}, usando URL original`);
            }
          }
          return { 
            ...profile, 
            foto_perfil: imageUrl, 
            hasLikedMe: likedByUserIds.has(profile.usuario_id) 
          };
        }));

      // Ordenamos los perfiles para que los usuarios que han dado like al usuario actual aparezcan primero
      const sortedProfiles = processedProfiles.sort((a, b) => {
        if (a.hasLikedMe && !b.hasLikedMe) return -1;
        if (!a.hasLikedMe && b.hasLikedMe) return 1;
        return 0;
      });

      setCards(sortedProfiles);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConnection = async (userId1: string, userId2: string): Promise<boolean> => {
    try {
      // Verificamos si ya existe una conexión en cualquier dirección
      const { data: existingConnections, error: selectError } = await supabase
        .from('conexion')
        .select()
        .or(`and(usuario1_id.eq.${userId1},usuario2_id.eq.${userId2}),and(usuario1_id.eq.${userId2},usuario2_id.eq.${userId1})`);

      if (selectError) throw selectError;

      if (existingConnections && existingConnections.length > 0) {
        // Si ya existe una conexión, verificamos si es un match
        const existingConnection = existingConnections[0];
        if (existingConnection.usuario1_id === userId2 && existingConnection.usuario2_id === userId1) {
          // Es un match, actualizamos la conexión existente
          await updateConnectionStatus(existingConnection.id, true);
          console.log('¡Es un match!');
          showMatchAlert(userId2);
          return true; // Indicamos que es un match
        } else {
          console.log('La conexión ya existe');
        }
        return false; // No es un match
      }

      // Si no existe, insertamos la nueva conexión
      const { data: newConnection, error: insertError } = await supabase
        .from('conexion')
        .insert({ 
          usuario1_id: userId1, 
          usuario2_id: userId2,
          estado: false
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log('Conexión guardada, esperando match');

      // Verificamos si hay un match
      const { data: matchCheck, error: matchError } = await supabase
        .from('conexion')
        .select()
        .eq('usuario1_id', userId2)
        .eq('usuario2_id', userId1)
        .single();

      if (matchError && matchError.code !== 'PGRST116') throw matchError;

      if (matchCheck) {
        // Es un match, actualizamos ambas conexiones
        await updateConnectionStatus(matchCheck.id, true);
        if (newConnection) {
          await updateConnectionStatus(newConnection.id, true);
        }
        console.log('¡Es un match!');
        showMatchAlert(userId2);
        return true; // Indicamos que es un match
      }

      return false; // No es un match
    } catch (error) {
      console.error('Error al guardar la conexión:', error);
      return false;
    }
  };

  const updateConnectionStatus = async (connectionId: string, status: boolean) => {
    try {
      const { error } = await supabase
        .from('conexion')
        .update({ estado: status })
        .eq('id', connectionId);

      if (error) throw error;
      console.log(`Conexión ${connectionId} actualizada a estado: ${status}`);
    } catch (error) {
      console.error('Error al actualizar el estado de la conexión:', error);
    }
  };

  const showMatchAlert = (matchedUserId: string) => {
    Alert.alert(
      "¡Felicidades!",
      "Es una conexión",
      [
        {
          text: "Enviar mensaje",
          onPress: () => router.push(`/chat/${matchedUserId}`),
        },
        {
          text: "Continuar",
          onPress: () => console.log("Usuario continuó sin enviar mensaje"),
          style: "cancel"
        },
      ],
      { cancelable: false }
    );
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    Animated.timing(position, {
      toValue: { x: direction === 'right' ? SWIPE_THRESHOLD : -SWIPE_THRESHOLD, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      console.log('no');
      setCards((prevCards) => prevCards.slice(1));
      position.setValue({ x: 0, y: 0 });
    });
  };

  const handleLike = async (likedUserId: string) => {
    if (currentUserId) {
      const isMatch = await saveConnection(currentUserId, likedUserId);
      
      if (isMatch) {
        // Si es un match, eliminamos la tarjeta inmediatamente
        setCards((prevCards) => prevCards.filter(card => card.usuario_id !== likedUserId));
      } else {
        // Si no es un match, simplemente pasamos a la siguiente tarjeta
        handleSwipe('right');
      }
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_: GestureResponderEvent, gesture: PanResponderGestureState) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_: GestureResponderEvent, gesture: PanResponderGestureState) => {
        if (Math.abs(gesture.dx) > SWIPE_THRESHOLD) {
          const direction = gesture.dx > 0 ? 'right' : 'left';
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

  const handleViewProfile = (user: CardProps['card']) => {
    setSelectedUser(user);
    setIsProfileModalVisible(true);
  };

  const renderCards = () => {
    return cards.map((card, index) => {
      if (index === 0) {
        return (
          <Card
            key={card.usuario_id}
            card={card}
            isFirst={true}
            onSwipe={handleSwipe}
            onLike={handleLike}
            onViewProfile={handleViewProfile}
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
      return <Card key={card.usuario_id} card={card} isFirst={false} onSwipe={handleSwipe} onLike={handleLike} onViewProfile={handleViewProfile} />;
    }).reverse();
  };

  const refreshCards = () => {
    fetchUsers();
    position.setValue({ x: 0, y: 0 });
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-primary-600">
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <View className="flex-1 items-center justify-center bg-gray-100">
        {renderCards()}
        <TouchableOpacity
          onPress={refreshCards}
          className="absolute top-10 right-5 bg-blue-500 py-2 px-4 rounded-full"
        >
          <Text className="text-white font-bold">Refrescar</Text>
        </TouchableOpacity>
      </View>
      {selectedUser && (
        <UserProfileModal
          isVisible={isProfileModalVisible}
          onClose={() => setIsProfileModalVisible(false)}
          user={selectedUser}
        />
      )}
    </GestureHandlerRootView>
  );
};

export default Match;