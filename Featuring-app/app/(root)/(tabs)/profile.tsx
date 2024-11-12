import React, { useState, useEffect } from "react";
import Constants from "expo-constants";
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
  RefreshControl,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { icons } from "@/constants";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import RatingsList from '@/components/RatingsList';
import { BadgesSection } from '@/components/profile/BadgesSection';
import { TooltipBadge } from '@/components/TooltipBadge';
import { TooltipTitle } from '@/components/TooltipTitle';
import { PrivacySettings } from '@/lib/privacy';
import { RealtimeChannel } from "@supabase/supabase-js";

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
  nacionalidad: string;
  promedio_valoraciones: number;
  seguidores_count?: number;
  total_valoraciones: number;
  insignias: any[];
  tituloActivo: any | null;
  preferencias: PrivacySettings;
}

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;

// Definir la interfaz Rating
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

// Definir tipos para los componentes internos
interface ProfileSectionProps {
  icon: any; // O un tipo más específico si conoces el tipo exacto
  title: string;
  children: React.ReactNode;
}

interface ProfileItemProps {
  label: string;
  value: string | number;
}

export default function Profile() {
  const { refreshProfile } = useLocalSearchParams<{ refreshProfile: string }>();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [showRatings, setShowRatings] = useState(false);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'private' | 'public'>('private');
  const [seguidoresCount, setSeguidoresCount] = useState(0);
  const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    fetchPerfil();
  }, [refreshProfile]);

  useEffect(() => {
    if (perfil?.usuario_id) {
      fetchSeguidores(perfil.usuario_id);
    }
  }, [perfil?.usuario_id]);

  useEffect(() => {
    if (perfil?.usuario_id) {
      // Suscribirse a cambios en la tabla seguidor
      const channel = supabase
        .channel(`seguidor-changes-${perfil?.usuario_id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'seguidor',
            filter: `usuario_id.eq.${perfil?.usuario_id}`
          },
          () => {
            // Actualizar el contador cuando haya cambios
            fetchSeguidores(perfil.usuario_id);
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
  }, [perfil?.usuario_id]);

  const fetchPerfil = async () => {
    try {
      setIsLoading(true);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("Usuario no autenticado");

      const { data, error } = await supabase
        .from("perfil")
        .select(`
          username,
          foto_perfil,
          ubicacion,
          nacionalidad,
          sexo,
          edad,
          biografia,
          perfil_genero (genero),
          perfil_habilidad (habilidad),
          red_social (nombre, url),
          promedio_valoraciones,
          preferencias:preferencias_usuario!preferencias_usuario_usuario_id_fkey (
            mostrar_edad,
            mostrar_ubicacion,
            mostrar_redes_sociales,
            mostrar_valoraciones
          )
        `)
        .eq("usuario_id", user.id)
        .single();

      if (error) throw error;

      const { data: valoracionesData, error: valoracionesError } = await supabase
        .from('valoracion_colaboracion')
        .select('valoracion')
        .eq('usuario_valorado_id', user.id);

      if (valoracionesError) throw valoracionesError;

      const totalValoraciones = valoracionesData?.length || 0;
      const sumaValoraciones = valoracionesData?.reduce((sum, val) => sum + val.valoracion, 0) || 0;
      const promedioValoraciones = totalValoraciones > 0 ? sumaValoraciones / totalValoraciones : 0;

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
        .eq('perfil_id', user.id)
        .eq('activo', true)
        .single();

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
        .eq('perfil_id', user.id)
        .eq('activo', true)
        .single();

      if (data) {
        const perfilData = {
          ...data,
          full_name: user.user_metadata?.full_name || "",
          generos: data.perfil_genero.map((g) => g.genero),
          habilidades: data.perfil_habilidad.map((h) => h.habilidad),
          redes_sociales: data.red_social,
          promedio_valoraciones: promedioValoraciones,
          total_valoraciones: totalValoraciones,
          insignias: insigniaActiva ? [insigniaActiva.insignia] : [],
          tituloActivo: tituloActivo?.titulo || null,
          preferencias: data.preferencias
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

  const fetchSeguidores = async (userId: string) => {
    if (!userId) return;
    
    try {
      const { count, error } = await supabase
        .from('seguidor')
        .select('*', { count: 'exact' })
        .eq('usuario_id', userId);

      if (error) throw error;
      setSeguidoresCount(count || 0);
    } catch (error) {
      console.error('Error al obtener seguidores:', error);
    }
  };

  const handleRedSocialPress = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Error al abrir el enlace:", err)
    );
  };

  // Construir la URL pública de la foto de perfil
  const getProfileImageUrl = (fotoPerfilPath: string | null) => {
    if (!fotoPerfilPath) {
      return null;
    }
    return `${supabaseUrl}/storage/v1/object/public/fotoperfil/${fotoPerfilPath}`;
  };

  const fetchValoraciones = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        .eq('usuario_valorado_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const valoracionesFormateadas: Rating[] = valoraciones.map(val => ({
        id: val.id,
        valoracion: val.valoracion,
        comentario: val.comentario,
        created_at: val.created_at,
        perfil: {
          username: val.perfil.username,
          foto_perfil: val.perfil.foto_perfil 
        }
      }));

      setRatings(valoracionesFormateadas);
    } catch (error) {
      console.error('Error al cargar valoraciones:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    try {
      setRefreshing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await Promise.all([
        fetchPerfil(),
        fetchSeguidores(user.id)
      ]);
    } catch (error) {
      console.error('Error al refrescar:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleShowRatings = () => {
    setShowRatings(true);
    fetchValoraciones();
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

  function ProfileSection({ icon, title, children }: ProfileSectionProps) {
    return (
      <View className="mb-3">
        <View className="flex-row items-center mb-2">
          <Image source={icon} className="w-6 h-6 mr-2" />
          <Text className="text-xl font-semibold text-gray-800">{title}</Text>
        </View>
        {children}
      </View>
    );
  }

  function ProfileItem({ label, value }: ProfileItemProps) {
    return (
      <View className="flex-row justify-between items-center py-1">
        <Text className="text-primary-700 font-medium">{label}</Text>
        <Text className="text-gray-800">{value || "No especificado"}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-primary-600 p-1 mb-8">
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6D29D2"]}
            tintColor="#6D29D2"
          />
        }
      >
        <View className="px-4 pb-8 mt-2">
          <View className="bg-white rounded-xl shadow-lg shadow-black/30">
            {/* Header integrado */}
            <View className="border-b border-gray-200">
              <Text className="text-lg font-bold text-center py-2">
                Mi Perfil
              </Text>
              
              <View className="flex-row border-t border-gray-200">
                <TouchableOpacity
                  onPress={() => setViewMode('private')}
                  className={`flex-1 py-2 ${
                    viewMode === 'private' 
                      ? 'border-b-2 border-primary-500' 
                      : 'border-b border-gray-200'
                  }`}
                >
                  <Text 
                    className={`text-center ${
                      viewMode === 'private' 
                        ? 'text-primary-500 font-semibold' 
                        : 'text-gray-600'
                    }`}
                  >
                    Vista Privada
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => setViewMode('public')}
                  className={`flex-1 py-2 ${
                    viewMode === 'public' 
                      ? 'border-b-2 border-primary-500' 
                      : 'border-b border-gray-200'
                  }`}
                >
                  <Text 
                    className={`text-center ${
                      viewMode === 'public' 
                        ? 'text-primary-500 font-semibold' 
                        : 'text-gray-600'
                    }`}
                  >
                    Vista Pública
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Contenido */}
            <View className="p-6">
              {viewMode === 'private' ? (
                <View>
                  <TouchableOpacity
                    onPress={() => router.push("/editar_perfil")}
                    className="absolute top-0 right-0 p-2"
                  >
                    <Image
                      source={icons.editar}
                      className="w-8 h-8"
                      style={{ tintColor: "#00CED1" }}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push("/preferencias")}
                    className="absolute top-0 left-0 p-2"
                  >
                    <Ionicons 
                      name="settings-outline" 
                      size={28} 
                      color="#00CED1"
                    />
                  </TouchableOpacity>

                  {/* Mantener todo el contenido existente de la vista privada */}
                  <View className="items-center pb-4">
                    <View className="w-36 h-36 rounded-full shadow-lg shadow-black/50 mb-4">
                      {perfil.foto_perfil ? (
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
                    
                    {perfil.tituloActivo && (
                      <TooltipTitle 
                        nombre={perfil.tituloActivo.nombre}
                        descripcion={perfil.tituloActivo.descripcion}
                        nivel={perfil.tituloActivo.nivel}
                      />
                    )}
                    <TouchableOpacity 
                      onPress={() => {
                        setShowRatings(true);
                        fetchValoraciones();
                      }}
                      className="items-center mt-2"
                    >
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
                    </TouchableOpacity>
                  </View>
                  <ProfileSection
                    icon={icons.usuarioperfil}
                    title="Información Personal"
                  >
                    <ProfileItem label="Nombre" value={perfil.full_name} />
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
                        <View
                          key={index}
                          className="bg-primary-100 rounded-full px-2 py-1 m-1"
                        >
                          <Text className="text-primary-600">{genero}</Text>
                        </View>
                      ))}
                    </View>
                  </ProfileSection>

                  <ProfileSection icon={icons.star} title="Habilidades Musicales">
                    <View className="flex-row flex-wrap">
                      {perfil.habilidades.map((habilidad, index) => (
                        <View
                          key={index}
                          className="bg-secondary-100 rounded-full px-2 py-1 m-1"
                        >
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
                        <Text className="text-gray-500">
                          No hay redes sociales agregadas
                        </Text>
                      )}
                    </View>
                  </ProfileSection>

                  <View className="flex-row justify-around mt-4 mb-6">
                    <TouchableOpacity
                      onPress={() => router.push("/biblioteca")}
                      className="bg-primary-500 px-6 py-3 rounded-full flex-row items-center"
                    >
                      <Ionicons name="library" size={20} color="white" className="mr-2" />
                      <Text className="text-white font-JakartaBold">Mi Biblioteca</Text>
                    </TouchableOpacity>
                  </View>

                </View>
              ) : (
                // Vista Pública (mantener todo el contenido actual)
                <View>
                  <View className="items-center pb-4">
                    <View className="w-36 h-36 rounded-full shadow-lg shadow-black/50 mb-4">
                      {perfil.foto_perfil ? (
                        <Image
                          source={{ 
                            uri: getProfileImageUrl(perfil.foto_perfil)
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

                    {perfil.tituloActivo && (
                      <TooltipTitle 
                        nombre={perfil.tituloActivo.nombre}
                        descripcion={perfil.tituloActivo.descripcion}
                        nivel={perfil.tituloActivo.nivel}
                      />
                    )}

                    {perfil.preferencias?.mostrar_valoraciones && (
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
                    )}

                    <ProfileSection icon={icons.usuarioperfil} title="Información Personal">
                      {perfil.preferencias?.mostrar_ubicacion ? (
                        <ProfileItem label="Ubicación" value={perfil.ubicacion} />
                      ) : (
                        <ProfileItem label="Ubicación" value="Oculto" />
                      )}
                      <ProfileItem label="Género" value={perfil.sexo} />
                      {perfil.preferencias?.mostrar_edad ? (
                        <ProfileItem label="Edad" value={perfil.edad.toString()} />
                      ) : (
                        <ProfileItem label="Edad" value="Oculto" />
                      )}
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
                          <View
                            key={index}
                            className="bg-primary-100 rounded-full px-2 py-1 m-1"
                          >
                            <Text className="text-primary-600">{genero}</Text>
                          </View>
                        ))}
                      </View>
                    </ProfileSection>

                    <ProfileSection icon={icons.star} title="Habilidades Musicales">
                      <View className="flex-row flex-wrap">
                        {perfil.habilidades.map((habilidad, index) => (
                          <View
                            key={index}
                            className="bg-secondary-100 rounded-full px-2 py-1 m-1"
                          >
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
                            <Text className="text-gray-500">
                              No hay redes sociales agregadas
                            </Text>
                          )}
                        </View>
                      </ProfileSection>
                    ) : (
                      <ProfileSection icon={icons.link} title="Redes Sociales">
                        <Text className="text-gray-500">Oculto</Text>
                      </ProfileSection>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
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
              <Text className="text-xl font-bold">Mis Valoraciones Recibidas</Text>
              <TouchableOpacity onPress={() => setShowRatings(false)}>
                <Ionicons name="close" size={24} color="#4A148C" />
              </TouchableOpacity>
            </View>
            <RatingsList ratings={ratings} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
