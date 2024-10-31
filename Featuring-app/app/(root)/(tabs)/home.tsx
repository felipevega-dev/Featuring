import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { icons } from "@/constants";
import { supabase } from "@/lib/supabase";
import Constants from "expo-constants";
import { router } from "expo-router";

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

const Home = () => {
  const [proyectosDestacados, setProyectosDestacados] = useState<ProyectoDestacado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;

  useEffect(() => {
    fetchProyectosDestacados();
  }, []);

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
        `);

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
            likes_count: proyecto.likes?.length || 0,
            perfil: {
              username: proyecto.perfil?.username || 'Usuario desconocido',
              foto_perfil: proyecto.perfil?.foto_perfil
            }
          }))
          .sort((a, b) => b.likes_count - a.likes_count) // Ordenar de mayor a menor
          .slice(0, 5); // Tomar solo los 5 primeros

        setProyectosDestacados(proyectosFormateados);
      }
    } catch (error) {
      console.error('Error al obtener proyectos destacados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const ProyectoDestacadoCard = ({ proyecto }: { proyecto: ProyectoDestacado }) => (
    <TouchableOpacity 
      className="bg-white rounded-xl shadow-lg p-4 mb-4"
      onPress={() => router.push(`/comunidad?scrollToId=${proyecto.id}`)}
    >
      <View className="flex-row items-center mb-3">
        {/* Información del creador */}
        <Image
          source={{ 
            uri: proyecto.perfil.foto_perfil
              ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${proyecto.perfil.foto_perfil}`
              : "https://via.placeholder.com/30"
          }}
          className="w-10 h-10 rounded-full"
        />
        <View className="ml-3">
          <Text className="font-JakartaBold text-sm text-primary-700">
            {proyecto.perfil.username}
          </Text>
          <Text className="text-xs text-general-200">
            Artista
          </Text>
        </View>
      </View>

      {/* Información del proyecto */}
      <View className="bg-primary-50 rounded-lg p-3">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="font-JakartaBold text-lg text-primary-700">
            {proyecto.titulo}
          </Text>
          <View className="bg-secondary-100 px-3 py-1 rounded-full">
            <Text className="text-xs text-secondary-700 font-JakartaMedium">
              {proyecto.genero}
            </Text>
          </View>
        </View>

        {/* Estadísticas */}
        <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-primary-100">
          <View className="flex-row items-center">
            <Image
              source={icons.heart}
              className="w-4 h-4 mr-1"
              style={{ tintColor: "#6D29D2" }}
            />
            <Text className="text-sm text-primary-500 font-JakartaMedium">
              {proyecto.likes_count} likes
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <Image
              source={icons.features}
              className="w-4 h-4 mr-1"
              style={{ tintColor: "#00BFA5" }}
            />
            <Text className="text-sm text-secondary-500 font-JakartaMedium">
              Proyecto Destacado
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-primary-100">
      <View className="bg-primary-500 shadow-md py-4 px-6">
        <View className="flex flex-row justify-center items-center mb-2">
          <Text className="text-white text-3xl font-bold mr-2">
            Destacados
          </Text>
          <Image
            source={icons.features}
            className="w-8 h-8"
            style={{ tintColor: "#00BFA5" }}
          />
        </View>
        <Text className="text-secondary-400 text-xl font-semibold text-center">
          Popular en Featuring
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {isLoading ? (
          <Text className="text-center text-primary-500 mt-4">Cargando proyectos destacados...</Text>
        ) : proyectosDestacados.length > 0 ? (
          proyectosDestacados.map((proyecto) => (
            <ProyectoDestacadoCard key={proyecto.id} proyecto={proyecto} />
          ))
        ) : (
          <Text className="text-center text-primary-500 mt-4">
            No hay proyectos destacados disponibles
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

export default Home;
