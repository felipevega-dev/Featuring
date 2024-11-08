import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ReportCard } from '@/components/reports/ReportCard';
import { SanctionCard } from '@/components/reports/SanctionCard';
import { RewardCard } from '@/components/reports/RewardsCard';
import { useLocalSearchParams } from 'expo-router';

interface Reporte {
  id: number;
  tipo_contenido: string;
  razon: string;
  estado: 'abierto' | 'resuelto' | 'desestimado';
  created_at: string;
  contenido_id: number;
  usuario_reportado: {
    username: string;
  };
  usuario_reportante: {
    username: string;
  };
}

interface Sancion {
  id: number;
  tipo_sancion: string;
  motivo: string;
  estado: string;
  created_at: string;
  duracion_dias?: number;
}

interface RecompensaInfo {
  nivel: string;
  puntosNecesarios: number;
  beneficios: string[];
}

const RECOMPENSAS: RecompensaInfo[] = [
  {
    nivel: 'Bronce',
    puntosNecesarios: 100,
    beneficios: ['5 dias de cuenta premium', 'Insignia especial de bronce', 'Título de moderador novato']
  },
  {
    nivel: 'Plata',
    puntosNecesarios: 300,
    beneficios: ['2 semanas de cuenta premium', 'Insignia especial de plata', 'Título de moderador recurrente', 'Prioridad en el soporte']
  },
  {
    nivel: 'Oro',
    puntosNecesarios: 600,
    beneficios: ['1 mes de cuenta premium', 'Insignia especial de oro', 'Título de moderador honorario', 'Todos los beneficios de plata']
  }
];

// Agregar un componente para la barra de progreso
const ProgressBar = ({ current, total }: { current: number; total: number }) => {
  const progress = Math.min((current / total) * 100, 100);
  
  return (
    <View className="mt-2">
      <View className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <View 
          className="h-full bg-primary-500 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </View>
      <View className="flex-row justify-between mt-1">
        <Text className="text-xs text-gray-500">{current} pts</Text>
        <Text className="text-xs text-gray-500">{total} pts</Text>
      </View>
    </View>
  );
};

export default function Reportes() {
  const [reportesEnviados, setReportesEnviados] = useState<Reporte[]>([]);
  const [reportesRecibidos, setReportesRecibidos] = useState<Reporte[]>([]);
  const [sanciones, setSanciones] = useState<Sancion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [puntosReputacion, setPuntosReputacion] = useState(0);
  const [activeTab, setActiveTab] = useState<'enviados' | 'recibidos' | 'sanciones' | 'recompensas'>('enviados');
  const [siguienteRecompensa, setSiguienteRecompensa] = useState<RecompensaInfo | null>(null);
  const { tab } = useLocalSearchParams<{ tab: string }>();

  useEffect(() => {
    if (tab === 'recompensas') {
      setActiveTab('recompensas');
    }
  }, [tab]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Calcular siguiente recompensa basada en puntos actuales
    const nextReward = RECOMPENSAS.find(r => r.puntosNecesarios > puntosReputacion);
    setSiguienteRecompensa(nextReward || null);
  }, [puntosReputacion]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Obtener reportes enviados
      const { data: enviados } = await supabase
        .from('reporte')
        .select(`
          *,
          usuario_reportado:perfil!usuario_reportado_id (username)
        `)
        .eq('usuario_reportante_id', user.id)
        .order('created_at', { ascending: false });

      // Obtener reportes recibidos
      const { data: recibidos } = await supabase
        .from('reporte')
        .select(`
          *,
          usuario_reportante:perfil!usuario_reportante_id (username)
        `)
        .eq('usuario_reportado_id', user.id)
        .order('created_at', { ascending: false });

      // Obtener sanciones
      const { data: sancionesData } = await supabase
        .from('sancion_administrativa')
        .select('*')
        .eq('usuario_id', user.id)
        .order('created_at', { ascending: false });

      // Obtener puntos de reputación
      const { data: perfilData } = await supabase
        .from('perfil')
        .select('puntos_reputacion')
        .eq('usuario_id', user.id)
        .single();

      if (enviados) setReportesEnviados(enviados);
      if (recibidos) setReportesRecibidos(recibidos);
      if (sancionesData) setSanciones(sancionesData);
      if (perfilData) setPuntosReputacion(perfilData.puntos_reputacion || 0);

    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'abierto':
        return 'bg-yellow-100 text-yellow-800';
      case 'resuelto':
        return 'bg-green-100 text-green-800';
      case 'desestimado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSanctionColor = (tipo: string) => {
    switch (tipo) {
      case 'amonestacion':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspension_temporal':
        return 'bg-orange-100 text-orange-800';
      case 'suspension_permanente':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <View className="flex-1 bg-gray-50">
      {/* Header fijo */}
      <View className="bg-white border-b border-gray-200">
        <Text className="text-lg font-bold text-center py-2">
          Reportes
        </Text>
      </View>

      {/* Tabs fijos */}
      <View className="bg-white border-b border-gray-200 justify-center items-center">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 2 }}
        >
          {(['enviados', 'recibidos', 'sanciones', 'recompensas'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`py-2 px-2 justify-center items-center ${
                activeTab === tab 
                  ? 'border-b-2 border-primary-500' 
                  : ''
              }`}
            >
              <Text 
                className={`${
                  activeTab === tab 
                    ? 'text-primary-500 font-semibold' 
                    : 'text-gray-600'
                } text-sm`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Contenido scrolleable */}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        className="flex-1 mb-10"
      >
        {activeTab === 'recompensas' ? (
          <View className="p-4">
            <View className="bg-primary-100 rounded-lg p-4 mb-4">
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <Text className="text-primary-800 text-lg font-bold">
                    Tus Puntos: {puntosReputacion}
                  </Text>
                  <TouchableOpacity
                    onPress={() => Alert.alert(
                      "¿Cómo ganar puntos?",
                      "Gana 30 puntos cada vez que uno de tus reportes sea validado por los administradores. Los reportes deben ser precisos y bien documentados."
                    )}
                    className="ml-2"
                  >
                    <Ionicons name="information-circle-outline" size={20} color="#6D29D2" />
                  </TouchableOpacity>
                </View>
                {puntosReputacion >= 300 && (
                  <View className="bg-primary-500 px-2 py-1 rounded-full">
                    <Text className="text-white text-xs font-bold">Usuario Destacado</Text>
                  </View>
                )}
              </View>
              {siguienteRecompensa && (
                <>
                  <Text className="text-primary-600 text-center mt-2">
                    Te faltan {siguienteRecompensa.puntosNecesarios - puntosReputacion} puntos para alcanzar el nivel {siguienteRecompensa.nivel}
                  </Text>
                  <ProgressBar 
                    current={puntosReputacion} 
                    total={siguienteRecompensa.puntosNecesarios} 
                  />
                </>
              )}
            </View>

            {RECOMPENSAS.map((recompensa, index) => (
              <RewardCard
                key={index}
                nivel={recompensa.nivel}
                puntosNecesarios={recompensa.puntosNecesarios}
                puntosActuales={puntosReputacion}
                beneficios={recompensa.beneficios}
                isNext={siguienteRecompensa?.nivel === recompensa.nivel}
              />
            ))}
          </View>
        ) : (
          <View className="p-4">
            {activeTab === 'enviados' && (
              reportesEnviados.length > 0 ? (
                reportesEnviados.map((reporte) => (
                  <ReportCard
                    key={reporte.id}
                    username={reporte.usuario_reportado.username || 'Usuario desconocido'}
                    razon={reporte.razon}
                    tipo={reporte.tipo_contenido}
                    estado={reporte.estado}
                    fecha={new Date(reporte.created_at).toLocaleDateString()}
                    getStatusColor={getStatusColor}
                  />
                ))
              ) : (
                <Text className="text-center text-gray-500">
                  No has enviado ningún reporte
                </Text>
              )
            )}

            {activeTab === 'recibidos' && (
              reportesRecibidos.length > 0 ? (
                reportesRecibidos.map((reporte) => (
                  <ReportCard
                    key={reporte.id}
                    username={reporte.usuario_reportante.username || 'Usuario desconocido'}
                    razon={reporte.razon}
                    tipo={reporte.tipo_contenido}
                    estado={reporte.estado}
                    fecha={new Date(reporte.created_at).toLocaleDateString()}
                    getStatusColor={getStatusColor}
                  />
                ))
              ) : (
                <Text className="text-center text-gray-500">
                  No has recibido ningún reporte
                </Text>
              )
            )}

            {activeTab === 'sanciones' && (
              sanciones.length > 0 ? (
                sanciones.map((sancion) => (
                  <SanctionCard
                    key={sancion.id}
                    tipo={sancion.tipo_sancion}
                    motivo={sancion.motivo}
                    duracion={sancion.duracion_dias}
                    fecha={new Date(sancion.created_at).toLocaleDateString()}
                    getSanctionColor={getSanctionColor}
                  />
                ))
              ) : (
                <Text className="text-center text-gray-500">
                  No tienes sanciones registradas
                </Text>
              )
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
