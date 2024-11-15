import React, { useState, useEffect, useRef } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, Animated as RNAnimated, RefreshControl } from "react-native";
import { icons } from "@/constants";
import { supabase } from "@/lib/supabase";
import Constants from "expo-constants";
import { router } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInDown, 
  SlideInRight,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

interface ProyectoDestacado {
  id: number;
  titulo: string;
  genero: string;
  likes_count: number;
  caratula: string | null;
  usuario_id: string;
  perfil: {
    username: string;
    foto_perfil: string | null;
  };
}

interface UserPremiumInfo {
  is_premium: boolean;
  premium_until: string | null;
}

const Home = () => {
  const [proyectosDestacados, setProyectosDestacados] = useState<ProyectoDestacado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useSharedValue(0);
  const bannerOpacity = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const scrollViewHeight = useSharedValue(0);
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;

  useEffect(() => {
    fetchProyectosDestacados();
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: premiumInfo, error } = await supabase
        .from('perfil')
        .select('is_premium, premium_until')
        .eq('usuario_id', user.id)
        .single();

      if (error) throw error;

      const isPremiumActive = premiumInfo?.is_premium && 
        new Date(premiumInfo.premium_until) > new Date();
      
      setIsPremium(isPremiumActive);
    } catch (error) {
      console.error('Error checking premium status:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchProyectosDestacados(),
      checkPremiumStatus()
    ]);
    setRefreshing(false);
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      
      // Calcular si estamos cerca del final
      const scrollPosition = event.contentOffset.y;
      const visibleHeight = scrollViewHeight.value;
      const totalHeight = contentHeight.value;
      
      // Mostrar banner cuando estemos en el último 30% del contenido
      if (totalHeight > 0 && visibleHeight > 0) {
        const scrollPercentage = (scrollPosition + visibleHeight) / totalHeight;
        if (scrollPercentage > 0.7 && bannerOpacity.value === 0) {
          bannerOpacity.value = withSpring(1, {
            damping: 20,
            stiffness: 90
          });
        } else if (scrollPercentage <= 0.7 && bannerOpacity.value === 1) {
          bannerOpacity.value = withSpring(0, {
            damping: 20,
            stiffness: 90
          });
        }
      }
    },
  });

  const bannerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bannerOpacity.value,
    transform: [
      { 
        translateY: withSpring(bannerOpacity.value === 0 ? 100 : 0, {
          damping: 20,
          stiffness: 90
        })
      }
    ],
  }));

  const fetchProyectosDestacados = async () => {
    try {
      // Primero obtenemos las canciones con su conteo de likes usando una subconsulta
      const { data: canciones, error: errorCanciones } = await supabase
        .from('cancion')
        .select(`
          id,
          titulo,
          genero,
          caratula,
          usuario_id,
          perfil:usuario_id (
            username,
            foto_perfil
          ),
          likes:likes_cancion(count)
        `)
        .returns<{
          id: number;
          titulo: string;
          genero: string;
          caratula: string | null;
          usuario_id: string;
          perfil: { username: string; foto_perfil: string | null } | null;
          likes: { count: number }[];
        }[]>();

      if (errorCanciones) throw errorCanciones;

      if (canciones) {
        // Ordenar las canciones por cantidad de likes manualmente
        const proyectosFormateados = canciones
          .map(proyecto => ({
            id: proyecto.id,
            titulo: proyecto.titulo,
            genero: proyecto.genero,
            caratula: proyecto.caratula,
            usuario_id: proyecto.usuario_id,
            likes_count: proyecto.likes?.[0]?.count || 0,
            perfil: {
              username: proyecto.perfil?.username || 'Usuario desconocido',
              foto_perfil: proyecto.perfil?.foto_perfil
            }
          }))
          .sort((a, b) => b.likes_count - a.likes_count) // Ordenar de mayor a menor
          .slice(0, 6); // Tomar solo los 5 primeros

        setProyectosDestacados(proyectosFormateados.map(proyecto => ({
          ...proyecto,
          perfil: {
            ...proyecto.perfil,
            foto_perfil: proyecto.perfil.foto_perfil || null
          }
        })));
      }
    } catch (error) {
      console.error('Error al obtener proyectos destacados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const ProyectoDestacadoCard = ({ proyecto }: { proyecto: ProyectoDestacado }) => (
    <TouchableOpacity 
      className="bg-white rounded-xl shadow-lg p-2 mb-2 w-[48%]"
      onPress={() => router.push(`/comunidad?scrollToId=${proyecto.id}`)}
    >
      <View className="flex-row items-center mb-1">
        <Image
          source={{ 
            uri: proyecto.perfil.foto_perfil
              ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${proyecto.perfil.foto_perfil}`
              : "https://via.placeholder.com/30"
          }}
          className="w-8 h-8 rounded-full"
        />
        <View className="ml-2 flex-1">
          <Text 
            className="font-JakartaBold text-xs text-primary-700"
            numberOfLines={1}
          >
            {proyecto.perfil.username}
          </Text>
        </View>
      </View>

      <View className="bg-primary-50 rounded-lg p-2">
        <Text 
          className="font-JakartaBold text-sm text-primary-700 mb-1"
          numberOfLines={1}
        >
          {proyecto.titulo}
        </Text>
        
        <View className="bg-secondary-100 px-2 py-0.5 rounded-full self-start mb-2">
          <Text 
            className="text-xs text-secondary-700 font-JakartaMedium"
            numberOfLines={1}
          >
            {proyecto.genero}
          </Text>
        </View>

        <View className="flex-row items-center justify-between pt-2 border-t border-primary-100">
          <View className="flex-row items-center">
            <Image
              source={icons.hearto}
              className="w-4 h-4 mr-1"
              style={{ tintColor: "#6D29D2" }}
            />
            <Text className="text-xs text-primary-500 font-JakartaMedium">
              {proyecto.likes_count}
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <Image
              source={icons.star}
              className="w-4 h-4 mr-1"
              style={{ tintColor: "#00BFA5" }}
            />
            <Text className="text-xs text-secondary-500 font-JakartaMedium">
              Top
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const HeroSection = () => (
    <LinearGradient
      colors={['#6D29D2', '#4A148C']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="px-6 py-6 rounded-b-3xl"
    >
      <View>
        <Text className="text-white text-4xl font-JakartaBold mb-2">
          ¡Bienvenido a Featuring!
        </Text>
        <Text className="text-secondary-200 text-lg font-JakartaMedium mb-6">
          Donde la música conecta personas
        </Text>

        <View className="flex-row justify-between mb-2">
          <View className="items-center bg-white/10 px-4 py-2 rounded-xl">
            <Text className="text-white text-xl font-JakartaBold">1K+</Text>
            <Text className="text-secondary-200 text-sm">Artistas</Text>
          </View>
          <View className="items-center bg-white/10 px-4 py-2 rounded-xl">
            <Text className="text-white text-xl font-JakartaBold">5K+</Text>
            <Text className="text-secondary-200 text-sm">Proyectos</Text>
          </View>
          <View className="items-center bg-white/10 px-4 py-2 rounded-xl">
            <Text className="text-white text-xl font-JakartaBold">10K+</Text>
            <Text className="text-secondary-200 text-sm">Colaboraciones</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  const PremiumBenefits = () => (
    <View className="px-4 py-6">
      <Animated.View 
        entering={FadeInDown.delay(200)}
        className="flex-row items-center mb-4"
      >
        <Text className="text-2xl font-JakartaBold text-primary-700 mr-2">
          Premium
        </Text>
        <Image
          source={icons.dollar}
          className="w-6 h-6"
          style={{ tintColor: "#FFD700" }}
        />
      </Animated.View>
      
      <View className="space-y-3">
        {[
          {
            icon: icons.features,
            title: "Colaboraciones ilimitadas",
            desc: "Sin límites para crear"
          },
          {
            icon: icons.chat,
            title: "Chat prioritario",
            desc: "Conexión directa con artistas"
          },
          {
            icon: icons.hearto,
            title: "Sin anuncios",
            desc: "Experiencia sin interrupciones"
          }
        ].map((benefit, index) => (
          <Animated.View 
            key={benefit.title}
            entering={SlideInRight.delay(200 + index * 100)}
            className="flex-row items-center bg-white p-4 rounded-xl shadow-sm"
          >
            <View className="bg-primary-100 p-2 rounded-full">
              <Image
                source={benefit.icon}
                className="w-5 h-5"
                style={{ tintColor: "#6D29D2" }}
              />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-JakartaBold text-primary-700">
                {benefit.title}
              </Text>
              <Text className="text-primary-500 text-sm">
                {benefit.desc}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInDown.delay(500)}>
        <TouchableOpacity 
          className="bg-primary-500 mt-4 py-3 rounded-xl active:opacity-90"
          onPress={() => router.push("/premium")}
        >
          <Text className="text-white text-center font-JakartaBold">
            Obtener Premium
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  const PremiumBanner = () => !isPremium && (
    <Animated.View 
      style={[
        { 
          position: 'absolute', 
          bottom: 20, 
          left: 16, 
          right: 16,
          opacity: 0 // Inicialmente oculto
        },
        bannerAnimatedStyle
      ]}
    >
      <LinearGradient
        colors={['#6D29D2', '#4A148C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="rounded-xl p-4 shadow-lg"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white font-JakartaBold text-base">
              Desbloquea todo el potencial
            </Text>
            <Text className="text-secondary-200 text-sm">
              Únete a Featuring Premium
            </Text>
          </View>
          <TouchableOpacity 
            className="bg-white px-4 py-2 rounded-lg"
            onPress={() => router.push("/premium")}
          >
            <Text className="text-primary-700 font-JakartaBold">
              Upgrade
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-primary-50">
      <Animated.ScrollView 
        className="flex-1"
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: !isPremium ? 80 : 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6D29D2"
            colors={['#6D29D2']}
          />
        }
        onLayout={(event) => {
          scrollViewHeight.value = event.nativeEvent.layout.height;
        }}
        onContentSizeChange={(width, height) => {
          contentHeight.value = height;
        }}
      >
        <HeroSection />
        <PremiumBenefits />
        <View className="px-4 py-4">
          <Text className="text-2xl font-JakartaBold text-primary-700 mb-4">
            Proyectos Destacados
          </Text>
          {isLoading ? (
            <Text className="text-center text-primary-500 mt-4">
              Cargando proyectos destacados...
            </Text>
          ) : (
            <View className="flex-row flex-wrap justify-between mb-14">
              {proyectosDestacados.map((proyecto) => (
                <ProyectoDestacadoCard key={proyecto.id} proyecto={proyecto} />
              ))}
            </View>
          )}
        </View>
      </Animated.ScrollView>
      <PremiumBanner />
    </View>
  );
};

export default Home;
