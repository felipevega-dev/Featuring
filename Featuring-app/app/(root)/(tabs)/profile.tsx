import React, { useState, useEffect } from "react";
import { View, Text, Image, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { icons } from "@/constants";
import UploadSongModal from '@/components/UploadSongModal';

interface Perfil {
  username: string;
  full_name: string; // Añadimos esta línea
  foto_perfil: string;
  sexo: string;
  edad: number;
  biografia: string;
  generos: string[];
  habilidades: string[];
}

export default function Profile() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchPerfil();
    fetchUserProfile();
  }, []);

  const fetchPerfil = async () => {
    try {
      setIsLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase
        .from('perfil')
        .select(`
          username,
          foto_perfil,
          sexo,
          edad,
          biografia,
          perfil_genero (genero),
          perfil_habilidad (habilidad)
        `)
        .eq('usuario_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        const perfilData = {
          ...data,
          full_name: user.user_metadata?.full_name || '', // Obtener full_name directamente de los metadatos del usuario
          generos: data.perfil_genero.map(g => g.genero),
          habilidades: data.perfil_habilidad.map(h => h.habilidad)
        };
      
        setPerfil(perfilData);
      } else {
        throw new Error("No se encontró el perfil");
      }
    } catch (error) {
      console.error("Error al obtener el perfil:", error);
      Alert.alert("Error", "No se pudo cargar el perfil del usuario");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('perfil')
        .select('*')
        .eq('usuario_id', user.id)
        .single();
      if (error) {
        console.error('Error fetching user profile:', error);
      } else {
        setUserProfile(data);
      }
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sí, cerrar sesión", 
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
              router.replace("/sign-in");
            } catch (error) {
              console.error("Error al cerrar sesión:", error);
              Alert.alert("Error", "No se pudo cerrar la sesión");
            }
          }
        }
      ]
    );
  };

  const handleUploadSuccess = () => {
    // Aquí podrías actualizar la lista de canciones del usuario si la muestras en el perfil
    console.log('Canción subida exitosamente');
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

  return (
    <View className="flex-1 bg-primary-600 p-1">
          <View className="mb-2 mt-2">
            <Text className="text-xl text-center font-semibold text-white">
            Perfil de usuario
          </Text>
          </View>
        <ScrollView className="flex-1">
          
        <View className="px-4 pb-8">
          <View className="bg-white rounded-xl shadow-lg shadow-black/30 p-6 mb-10">
          <View className="items-center pb-4">
          <View className="w-36 h-36 rounded-full shadow-lg shadow-black/50 mb-4">
            {perfil.foto_perfil ? (
              <Image
                source={{ uri: perfil.foto_perfil }}
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
            <ProfileItem label="Nombre" value={perfil.full_name} />
              <ProfileItem label="Género" value={perfil.sexo} />
              <ProfileItem label="Edad" value={perfil.edad.toString()} />
            </ProfileSection>

            <ProfileSection icon={icons.biografia} title="Biografía">
              <Text className="text-gray-600">{perfil.biografia || "No hay biografía disponible."}</Text>
            </ProfileSection>

            <ProfileSection icon={icons.generos} title="Géneros Musicales">
              <View className="flex-row flex-wrap">
                {perfil.generos.map((genero, index) => (
                  <View key={index} className="bg-primary-100 rounded-full px-3 py-1 m-1">
                    <Text className="text-primary-600">{genero}</Text>
                  </View>
                ))}
              </View>
            </ProfileSection>

            <ProfileSection icon={icons.star} title="Habilidades Musicales">
              <View className="flex-row flex-wrap">
                {perfil.habilidades.map((habilidad, index) => (
                  <View key={index} className="bg-secondary-100 rounded-full px-3 py-1 m-1">
                    <Text className="text-secondary-500">{habilidad}</Text>
                  </View>
                ))}
              </View>
            </ProfileSection>

            <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-500 rounded-full py-2 px-6 flex-row justify-center items-center shadow-lg shadow-black/30"
          >
            <Image source={icons.cerrarSesion} className="w-5 h-5 mr-2" style={{ tintColor: 'white' }} />
            <Text className="text-white font-bold text-lg">Cerrar Sesión</Text>
          </TouchableOpacity>
          </View>

          
        </View>
      </ScrollView>
      <TouchableOpacity
        onPress={() => setIsUploadModalVisible(true)}
        className="bg-blue-500 p-3 rounded-md mt-4"
      >
        <Text className="text-white text-center">Subir Nueva Canción</Text>
      </TouchableOpacity>
      <UploadSongModal
        isVisible={isUploadModalVisible}
        onClose={() => setIsUploadModalVisible(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </View>
  );
}

function ProfileSection({ icon, title, children }) {
  return (
    <View className="mb-4">
      <View className="flex-row items-center mb-2">
        <Image source={icon} className="w-6 h-6 mr-2" />
        <Text className="text-xl font-semibold text-gray-800">{title}</Text>
      </View>
      {children}
    </View>
  );
}

function ProfileItem({ label, value }) {
  return (
    <View className="flex-row justify-between items-center py-1">
      <Text className="text-gray-600 font-medium">{label}</Text>
      <Text className="text-gray-800">{value || "No especificado"}</Text>
    </View>
  );
}