import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

type PerfilData = {
  id: number;
  nombre_completo: string;
  sexo: string;
  fecha_nacimiento: string;
  biografia: string;
  redes_sociales: string;
  foto_perfil: string;
  ubicacion: string;
  edad: number;
};

export default function PerfilScreen() {
  const { user } = useUser();
  const [perfilData, setPerfilData] = useState<PerfilData | null>(null);
  const [generos, setGeneros] = useState<string[]>([]);
  const [habilidades, setHabilidades] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("User ID:", user?.id);
    if (user) {
      fetchPerfilData();
    }
  }, [user]);

  const fetchPerfilData = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching profile data for user:", user?.id);
      
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfil')
        .select('*')
        .eq('clerk_id', user?.id)
        .single();

      if (perfilError) {
        console.error("Error fetching profile:", perfilError);
        throw perfilError;
      }
      
      console.log("Profile data:", perfilData);
      setPerfilData(perfilData);

      // Obtener géneros
      const { data: generosData, error: generosError } = await supabase
        .from('perfil_genero')
        .select('genero')
        .eq('perfil_id', perfilData.id);

      if (generosError) {
        console.error("Error fetching genres:", generosError);
        throw generosError;
      }
      setGeneros(generosData.map(g => g.genero));

      // Obtener habilidades
      const { data: habilidadesData, error: habilidadesError } = await supabase
        .from('perfil_habilidad')
        .select('habilidad')
        .eq('perfil_id', perfilData.id);

      if (habilidadesError) {
        console.error("Error fetching skills:", habilidadesError);
        throw habilidadesError;
      }
      setHabilidades(habilidadesData.map(h => h.habilidad));

    } catch (error) {
      console.error('Error al obtener datos del perfil:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const InfoSection = ({ icon, title, content }) => (
    <View className="bg-white rounded-lg mb-4 p-4 shadow-md">
      <View className="flex-row items-center mb-2">
        <Ionicons name={icon} size={24} color="purple" />
        <Text className="text-lg font-semibold ml-2 text-purple-700">{title}</Text>
      </View>
      {content}
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="purple" />
      </View>
    );
  }

  if (!perfilData) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>No se encontró un perfil. Por favor, crea uno.</Text>
        <TouchableOpacity 
          className="bg-purple-500 px-4 py-2 rounded-lg mt-4"
          onPress={() => {/* Navegar a la página de creación de perfil */}}
        >
          <Text className="text-white">Crear Perfil</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-purple-100">
      <View className="bg-purple-700 pt-10 pb-5 flex-row justify-between items-center px-4">
        <Link href="/editarPerfil" asChild>
          <TouchableOpacity>
            <Ionicons name="create-outline" size={24} color="white" />
          </TouchableOpacity>
        </Link>
        <Text className="text-white text-2xl font-bold text-center">Perfil</Text>
        <Link href="/preferencias" asChild>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </Link>
      </View>
      <View className="items-center mt-5">
        <Image source={{ uri: perfilData.foto_perfil }} className="w-32 h-32 rounded-full border-4 border-white" />
        <Text className="text-2xl font-bold mt-2 text-purple-800">{perfilData.nombre_completo}</Text>
        <View className="flex-row items-center mt-2">
          <Ionicons name="location-outline" size={16} color="purple" />
          <Text className="text-purple-600 ml-1">{perfilData.ubicacion}</Text>
        </View>
      </View>
      
      <View className="bg-white rounded-xl mx-4 mt-5 p-6 shadow-lg">
        <InfoSection
          icon="person-outline"
          title="Información Personal"
          content={
            <>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Nombre artístico</Text>
                <Text>{perfilData.nombre_completo}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Género</Text>
                <Text>{perfilData.sexo}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Edad</Text>
                <Text>{perfilData.edad}</Text>
              </View>
            </>
          }
        />

        <InfoSection
          icon="book-outline"
          title="Biografía"
          content={<Text>{perfilData.biografia}</Text>}
        />

        <InfoSection
          icon="musical-notes-outline"
          title="Géneros Musicales"
          content={
            <View className="flex-row flex-wrap">
              {generos.map((genero, index) => (
                <View key={index} className="bg-purple-100 rounded-full px-3 py-1 m-1">
                  <Text className="text-purple-700">{genero}</Text>
                </View>
              ))}
            </View>
          }
        />

        <InfoSection
          icon="star-outline"
          title="Habilidades Musicales"
          content={
            <View className="flex-row flex-wrap">
              {habilidades.map((habilidad, index) => (
                <View key={index} className="bg-cyan-100 rounded-full px-3 py-1 m-1">
                  <Text className="text-cyan-700">{habilidad}</Text>
                </View>
              ))}
            </View>
          }
        />

        <InfoSection
          icon="share-social-outline"
          title="Redes Sociales"
          content={<Text>{perfilData.redes_sociales}</Text>}
        />
      </View>

      <TouchableOpacity className="bg-red-500 mx-4 mt-5 mb-20 p-3 rounded-lg">
        <Text className="text-white text-center font-bold">Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}