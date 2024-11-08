import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface Insignia {
  id: number;
  nombre: string;
  descripcion: string;
  nivel: 'bronce' | 'plata' | 'oro';
  fecha_obtencion: string;
}

interface Titulo {
  id: number;
  nombre: string;
  descripcion: string;
  nivel: 'novato' | 'recurrente' | 'honorario';
  fecha_obtencion: string;
  activo: boolean;
}

interface PremiumInfo {
  is_premium: boolean;
  premium_until: string | null;
  puntos_reputacion: number;
}

export default function Beneficios() {
  const [loading, setLoading] = useState(true);
  const [insignias, setInsignias] = useState<Insignia[]>([]);
  const [titulos, setTitulos] = useState<Titulo[]>([]);
  const [premiumInfo, setPremiumInfo] = useState<PremiumInfo | null>(null);

  useEffect(() => {
    fetchUserBenefits();
  }, []);

  const fetchUserBenefits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No se encontró usuario');

      // Obtener insignias del usuario
      const { data: insigniasData } = await supabase
        .from('perfil_insignia')
        .select(`
          insignia_id,
          fecha_obtencion,
          insignia:insignia_id (
            id,
            nombre,
            descripcion,
            nivel
          )
        `)
        .eq('perfil_id', user.id);

      // Obtener títulos del usuario
      const { data: titulosData } = await supabase
        .from('perfil_titulo')
        .select(`
          titulo_id,
          fecha_obtencion,
          activo,
          titulo:titulo_id (
            id,
            nombre,
            descripcion,
            nivel
          )
        `)
        .eq('perfil_id', user.id);

      // Obtener información premium
      const { data: premiumData } = await supabase
        .from('perfil')
        .select('is_premium, premium_until, puntos_reputacion')
        .eq('usuario_id', user.id)
        .single();

      if (insigniasData) {
        setInsignias(insigniasData.map(i => ({
          ...i.insignia,
          fecha_obtencion: i.fecha_obtencion
        })));
      }

      if (titulosData) {
        setTitulos(titulosData.map(t => ({
          ...t.titulo,
          fecha_obtencion: t.fecha_obtencion,
          activo: t.activo
        })));
      }

      if (premiumData) {
        setPremiumInfo(premiumData);
      }

    } catch (error) {
      console.error('Error fetching benefits:', error);
      Alert.alert('Error', 'No se pudieron cargar los beneficios');
    } finally {
      setLoading(false);
    }
  };

  const handleActivarTitulo = async (tituloId: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Desactivar todos los títulos
      await supabase
        .from('perfil_titulo')
        .update({ activo: false })
        .eq('perfil_id', user.id);

      // Activar el título seleccionado
      await supabase
        .from('perfil_titulo')
        .update({ activo: true })
        .eq('perfil_id', user.id)
        .eq('titulo_id', tituloId);

      // Actualizar el título activo en el perfil
      await supabase
        .from('perfil')
        .update({ titulo_activo: tituloId })
        .eq('usuario_id', user.id);

      // Refrescar datos
      fetchUserBenefits();
      Alert.alert('Éxito', 'Título activado correctamente');
    } catch (error) {
      console.error('Error activating title:', error);
      Alert.alert('Error', 'No se pudo activar el título');
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#6D29D2" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 mb-16">
      {/* Header */}
      <View className="bg-white border-b border-gray-200">
        <View className="flex-row justify-between items-center p-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#6D29D2" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Mis Beneficios</Text>
          <View className="w-8" />
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Estado Premium */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow">
          <Text className="text-lg font-bold text-primary-600 mb-2">
            Estado Premium
          </Text>
          {premiumInfo?.is_premium ? (
            <>
              <View className="bg-primary-100 p-3 rounded-lg mb-2">
                <Text className="text-primary-800 font-semibold">
                  Premium Activo
                </Text>
                <Text className="text-primary-600 text-sm mt-1">
                  Válido hasta: {new Date(premiumInfo.premium_until!).toLocaleDateString()}
                </Text>
              </View>
              <Text className="text-sm text-gray-600">
                Beneficios activos:
              </Text>
              <View className="mt-2 space-y-1">
                <Text className="text-sm text-gray-600">• Sin anuncios</Text>
                <Text className="text-sm text-gray-600">• Insignia premium en el perfil</Text>
                <Text className="text-sm text-gray-600">• Prioridad en el soporte</Text>
                <Text className="text-sm text-gray-600">• Acceso a contenido exclusivo</Text>
              </View>
            </>
          ) : (
            <Text className="text-gray-600">
              No tienes beneficios premium activos
            </Text>
          )}
        </View>

        {/* Puntos de Reputación */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow">
          <Text className="text-lg font-bold text-primary-600 mb-2">
            Puntos de Reputación
          </Text>
          <Text className="text-3xl font-bold text-primary-500 text-center">
            {premiumInfo?.puntos_reputacion || 0}
          </Text>
          <Text className="text-sm text-gray-600 text-center mt-2">
            Gana puntos reportando contenido inapropiado
          </Text>
          <TouchableOpacity
            onPress={() => router.push({
              pathname: "/(root)/(tabs)/reportes",
              params: { tab: 'recompensas' }
            })}
            className="mt-4 bg-primary-100 p-3 rounded-lg flex-row justify-center items-center"
          >
            <Ionicons name="gift-outline" size={20} color="#6D29D2" style={{ marginRight: 8 }} />
            <Text className="text-primary-600 font-medium">
              Ver Recompensas Disponibles
            </Text>
          </TouchableOpacity>
        </View>

        {/* Insignias */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow">
          <Text className="text-lg font-bold text-primary-600 mb-2">
            Mis Insignias ({insignias.length})
          </Text>
          {insignias.length > 0 ? (
            <View className="space-y-3">
              {insignias.map((insignia) => (
                <View 
                  key={insignia.id} 
                  className={`p-3 rounded-lg ${
                    insignia.nivel === 'oro' 
                      ? 'bg-[#FFD700]/10' 
                      : insignia.nivel === 'plata'
                        ? 'bg-[#C0C0C0]/10'
                        : 'bg-[#CD7F32]/10'
                  }`}
                >
                  <View className="flex-row items-center">
                    <Ionicons 
                      name="shield-checkmark" 
                      size={24} 
                      color={
                        insignia.nivel === 'oro' 
                          ? '#FFD700' 
                          : insignia.nivel === 'plata'
                            ? '#C0C0C0'
                            : '#CD7F32'
                      }
                    />
                    <Text className="font-bold ml-2 text-gray-800">
                      {insignia.nombre}
                    </Text>
                  </View>
                  <Text className="text-gray-600 text-sm mt-1">
                    {insignia.descripcion}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-1">
                    Obtenida el {new Date(insignia.fecha_obtencion).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-gray-600">
              Aún no has obtenido insignias
            </Text>
          )}
        </View>

        {/* Títulos */}
        <View className="bg-white rounded-lg p-4 mb-4 shadow">
          <Text className="text-lg font-bold text-primary-600 mb-2">
            Mis Títulos ({titulos.length})
          </Text>
          {titulos.length > 0 ? (
            <View className="space-y-3">
              {titulos.map((titulo) => (
                <View key={titulo.id} className="bg-gray-50 p-3 rounded-lg">
                  <View className="flex-row justify-between items-center">
                    <View>
                      <Text className="font-bold text-gray-800">
                        {titulo.nombre}
                      </Text>
                      <Text className="text-gray-600 text-sm mt-1">
                        {titulo.descripcion}
                      </Text>
                      <Text className="text-gray-400 text-xs mt-1">
                        Obtenido el {new Date(titulo.fecha_obtencion).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleActivarTitulo(titulo.id)}
                      className={`px-3 py-1 rounded-full ${
                        titulo.activo 
                          ? 'bg-green-100' 
                          : 'bg-primary-100'
                      }`}
                    >
                      <Text className={`text-sm font-medium ${
                        titulo.activo 
                          ? 'text-green-700' 
                          : 'text-primary-700'
                      }`}>
                        {titulo.activo ? 'Activo' : 'Activar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-gray-600">
              Aún no has obtenido títulos
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
