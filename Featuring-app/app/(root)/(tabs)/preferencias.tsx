import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  Switch, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator,
  Modal
} from "react-native";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { habilidadesMusicales, generosMusicales } from "@/constants/musicData";
import { hispanicCountryCodes } from "@/utils/countryCodes";
import BlockedUsersList from '@/components/BlockedUsersList';
import { getPrivacySettings, updatePrivacySettings, PrivacySettings } from '@/lib/privacy';
import { getMatchSettings, updateMatchSettings, MatchSettings } from '@/lib/match';
import { PrivacySettingsSection } from '@/components/preferences/PrivacySettings';
import { MatchSettingsSection } from '@/components/preferences/MatchSettings';


interface PreferenciasUsuario {
  // Privacidad del perfil
  mostrar_edad: boolean;
  mostrar_ubicacion: boolean;
  mostrar_redes_sociales: boolean;
  mostrar_valoraciones: boolean;
  
  // Notificaciones
  notificaciones_mensajes: boolean;
  notificaciones_match: boolean;
  notificaciones_valoraciones: boolean;
  notificaciones_comentarios: boolean;
  notificaciones_seguidores: boolean;
  
  // Preferencias de Match
  match_filtrar_nacionalidad: boolean;
  match_filtrar_edad: boolean;
  match_filtrar_sexo: boolean;
  match_rango_edad: number[];
  match_nacionalidades: string[];
  match_sexo_preferido: 'M' | 'F' | 'O' | 'todos';
  
  // Preferencias adicionales
  preferencias_genero: string[];
  preferencias_habilidad: string[];
  preferencias_distancia: number;
  sin_limite_distancia: boolean;
}

interface OpcionSexo {
  valor: 'M' | 'F' | 'O' | 'todos';
  label: string;
}

// Obtener las nacionalidades del objeto hispanicCountryCodes
const nacionalidadesDisponibles: string[] = Object.keys(hispanicCountryCodes);

export default function Preferencias() {
  const [preferencias, setPreferencias] = useState<PreferenciasUsuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [edadMinima, setEdadMinima] = useState(18);
  const [edadMaxima, setEdadMaxima] = useState(99);
  const insets = useSafeAreaInsets();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    generos: false,
    habilidades: false,
    nacionalidades: false
  });
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    mostrar_edad: true,
    mostrar_ubicacion: true,
    mostrar_redes_sociales: true,
    mostrar_valoraciones: true
  });
  
  const [matchSettings, setMatchSettings] = useState<MatchSettings>({
    match_filtrar_edad: false,
    match_filtrar_sexo: false,
    match_rango_edad: [18, 99],
    match_sexo_preferido: 'todos',
    match_filtrar_nacionalidad: false,
    match_nacionalidades: []
  });

  const opciones: OpcionSexo[] = [
    { valor: 'M', label: 'Masculino' },
    { valor: 'F', label: 'Femenino' },
    { valor: 'O', label: 'Otro' },
    { valor: 'todos', label: 'Todos' }
  ];

  useEffect(() => {
    fetchPreferencias();
  }, []);

  useEffect(() => {
    if (generosMusicales && habilidadesMusicales) {
      setIsLoadingData(false);
    }
  }, [generosMusicales, habilidadesMusicales]);

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  useEffect(() => {
    loadMatchSettings();
  }, []);

  const toggleSection = (section: 'generos' | 'habilidades' | 'nacionalidades') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const fetchPreferencias = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Primero intentamos obtener las preferencias existentes
      let { data, error } = await supabase
        .from("preferencias_usuario")
        .select("*")
        .eq("usuario_id", user.id)
        .single();

      // Si no existe un registro, lo creamos con valores por defecto
      if (error && error.code === 'PGRST116') {
        const { data: newPrefs, error: insertError } = await supabase
          .from("preferencias_usuario")
          .insert({
            usuario_id: user.id,
            // Los demás campos usarán los valores por defecto definidos en la tabla
          })
          .select()
          .single();

        if (insertError) throw insertError;
        data = newPrefs;
      } else if (error) {
        throw error;
      }

      setPreferencias(data);
    } catch (error) {
      console.error("Error al cargar preferencias:", error);
      Alert.alert("Error", "No se pudieron cargar las preferencias");
    } finally {
      setIsLoading(false);
    }
  };

  const actualizarPreferencia = async (campo: keyof PreferenciasUsuario, valor: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { error } = await supabase
        .from("preferencias_usuario")
        .update({ [campo]: valor })
        .eq("usuario_id", user.id);

      if (error) throw error;

      setPreferencias(prev => prev ? { ...prev, [campo]: valor } : null);
    } catch (error) {
      console.error("Error al actualizar preferencia:", error);
      Alert.alert("Error", "No se pudo actualizar la preferencia");
    }
  };

  const actualizarRangoEdad = async () => {
    try {
      await actualizarPreferencia('match_rango_edad', [edadMinima, edadMaxima]);
    } catch (error) {
      console.error('Error al actualizar rango de edad:', error);
    }
  };

  const loadPrivacySettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const settings = await getPrivacySettings(user.id);
      setPrivacySettings(settings);
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      Alert.alert('Error', 'No se pudo cargar la configuración de privacidad');
    }
  };

  const handlePrivacyToggle = async (setting: keyof PrivacySettings) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newSettings = {
        ...privacySettings,
        [setting]: !privacySettings[setting]
      };

      await updatePrivacySettings(user.id, { [setting]: !privacySettings[setting] });
      setPrivacySettings(newSettings);
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      Alert.alert('Error', 'No se pudo actualizar la configuración');
    }
  };

  const handleMatchToggle = async (setting: keyof MatchSettings, value?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let updateData = {};
      
      if (setting === 'match_rango_edad') {
        updateData = { match_rango_edad: value };
      } else if (setting === 'match_sexo_preferido') {
        updateData = { match_sexo_preferido: value };
      } else {
        updateData = { [setting]: !matchSettings[setting] };
      }

      // Actualizar el estado local inmediatamente para una UI más fluida
      setMatchSettings(prev => ({
        ...prev,
        ...updateData
      }));

      // Luego actualizar en la base de datos
      await updateMatchSettings(user.id, updateData);

    } catch (error) {
      // Si hay error, revertir el cambio local
      setMatchSettings(prev => ({
        ...prev,
        ...matchSettings
      }));
      console.error('Error al actualizar configuración:', error);
      Alert.alert('Error', 'No se pudo actualizar la configuración');
    }
  };

  const handleRangoEdadChange = async (value: number, index: number) => {
    const newRangoEdad = [...matchSettings.match_rango_edad];
    newRangoEdad[index] = value;
    await handleMatchToggle('match_rango_edad', newRangoEdad);
  };

  const loadMatchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const settings = await getMatchSettings(user.id);
      setMatchSettings(settings);
    } catch (error) {
      console.error('Error al cargar configuración de match:', error);
      Alert.alert('Error', 'No se pudo cargar la configuración de match');
    }
  };

  if (isLoadingData) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#6D29D2" />
        <Text className="mt-4 text-gray-600">Cargando preferencias...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-4 space-y-4">
        <PrivacySettingsSection
          settings={privacySettings}
          onToggle={handlePrivacyToggle}
        />

        {/* Sección de Usuarios Bloqueados */}
        <View className="bg-white rounded-lg p-4">
          <TouchableOpacity
            onPress={() => setShowBlockedUsers(true)}
            className="flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <Ionicons name="shield-outline" size={24} color="#6D29D2" />
              <Text className="text-lg font-bold text-primary-600 ml-2">
                Usuarios Bloqueados
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#6D29D2" />
          </TouchableOpacity>
        </View>

        <MatchSettingsSection
          preferencias={preferencias}
          onUpdatePreferencia={actualizarPreferencia}
        />

        {/* Modal de Usuarios Bloqueados */}
        <Modal
          visible={showBlockedUsers}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <BlockedUsersList
            isVisible={showBlockedUsers}
            onClose={() => setShowBlockedUsers(false)}
          />
        </Modal>
      </View>
    </ScrollView>
  );
}
