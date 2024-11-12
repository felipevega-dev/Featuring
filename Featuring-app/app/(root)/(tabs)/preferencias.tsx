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


interface PreferenciasUsuario {
  // Privacidad del perfil
  mostrar_edad: boolean;
  mostrar_ubicacion: boolean;
  mostrar_redes_sociales: boolean;
  mostrar_valoraciones: boolean;
  
  // Privacidad del contenido
  permitir_comentarios_general: boolean;
  
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
    mostrar_valoraciones: true,
    permitir_comentarios_general: true
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
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || isLoadingData) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#6D29D2" />
        <Text className="mt-4 text-gray-600">Cargando preferencias...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-gray-100"
      contentContainerStyle={{
        paddingBottom: insets.bottom + 100
      }}
    >
      <View className="p-4 space-y-4">
        {/* Cada sección ahora tiene mejores clases responsivas */}
        <View className="bg-white rounded-lg p-4">
          <Text className="text-lg font-bold mb-4 text-primary-600">
            Privacidad del perfil
          </Text>
          
          <View className="space-y-4">
            <View className="flex-row justify-between items-start space-x-4">
              <View className="flex-1 flex-shrink">
                <Text className="text-base font-medium break-words">Mostrar Edad</Text>
                <Text className="text-sm text-gray-500 break-words">
                  Tu edad será visible en tu perfil
                </Text>
              </View>
              <Switch
                value={privacySettings.mostrar_edad}
                onValueChange={() => handlePrivacyToggle('mostrar_edad')}
                disabled={isLoading}
              />
            </View>

            <View className="flex-row justify-between items-start space-x-4">
              <View className="flex-1 flex-shrink">
                <Text className="text-base font-medium break-words">Mostrar Ubicación</Text>
                <Text className="text-sm text-gray-500 break-words">
                  Tu ubicación será visible en tu perfil
                </Text>
              </View>
              <Switch
                value={privacySettings.mostrar_ubicacion}
                onValueChange={() => handlePrivacyToggle('mostrar_ubicacion')}
                disabled={isLoading}
              />
            </View>

            <View className="flex-row justify-between items-start space-x-4">
              <View className="flex-1 flex-shrink">
                <Text className="text-base font-medium break-words">Mostrar Redes Sociales</Text>
                <Text className="text-sm text-gray-500 break-words">
                  Tus redes sociales serán visibles en tu perfil
                </Text>
              </View>
              <Switch
                value={privacySettings.mostrar_redes_sociales}
                onValueChange={() => handlePrivacyToggle('mostrar_redes_sociales')}
                disabled={isLoading}
              />
            </View>

            <View className="flex-row justify-between items-start space-x-4">
              <View className="flex-1 flex-shrink">
                <Text className="text-base font-medium break-words">Mostrar Valoraciones</Text>
                <Text className="text-sm text-gray-500 break-words">
                  Tus valoraciones serán visibles en tu perfil
                </Text>
              </View>
              <Switch
                value={privacySettings.mostrar_valoraciones}
                onValueChange={() => handlePrivacyToggle('mostrar_valoraciones')}
                disabled={isLoading}
              />
            </View>

            <View className="flex-row justify-between items-start space-x-4">
              <View className="flex-1 flex-shrink">
                <Text className="text-base font-medium break-words">Permitir Comentarios</Text>
                <Text className="text-sm text-gray-500 break-words">
                  Otros usuarios podrán comentar en tu contenido
                </Text>
              </View>
              <Switch
                value={privacySettings.permitir_comentarios_general}
                onValueChange={() => handlePrivacyToggle('permitir_comentarios_general')}
                disabled={isLoading}
              />
            </View>
          </View>
        </View>

        {/* Sección de Usuarios Bloqueados - NUEVO */}
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

        {/* Sección de Preferencias de Match */}
        <View className="bg-white rounded-lg p-4">
          <Text className="text-lg font-bold mb-4 text-primary-600">
            Preferencias de Match
          </Text>

          <View className="space-y-6">
            {/* Filtrar por Sexo */}
            <View className="space-y-2">
              <View className="flex-row justify-between items-start space-x-4">
                <View className="flex-1 flex-shrink">
                  <Text className="text-base font-medium break-words">Filtrar por Sexo</Text>
                  <Text className="text-sm text-gray-500 break-words">
                    Mostrar solo perfiles del sexo seleccionado
                  </Text>
                </View>
                <Switch
                  value={preferencias?.match_filtrar_sexo}
                  onValueChange={(value) => 
                    actualizarPreferencia("match_filtrar_sexo", value)
                  }
                />
              </View>
              
              {preferencias?.match_filtrar_sexo && (
                <View className="mt-4 bg-gray-50 rounded-lg p-2">
                  <View className="flex-row flex-wrap gap-2">
                    {opciones.map((opcion) => (
                      <TouchableOpacity
                        key={opcion.valor}
                        className={`flex-1 min-w-[45%] p-3 rounded-lg ${
                          preferencias?.match_sexo_preferido === opcion.valor
                            ? 'bg-primary-500'
                            : 'bg-white border border-gray-200'
                        }`}
                        onPress={() => actualizarPreferencia('match_sexo_preferido', opcion.valor)}
                      >
                        <Text className={`text-center font-medium ${
                          preferencias?.match_sexo_preferido === opcion.valor
                            ? 'text-white'
                            : 'text-gray-600'
                        }`}>
                          {opcion.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Filtrar por Edad */}
            <View className="space-y-2">
              <View className="flex-row justify-between items-start space-x-4">
                <View className="flex-1 flex-shrink">
                  <Text className="text-base font-medium break-words">Filtrar por Edad</Text>
                  <Text className="text-sm text-gray-500 break-words">
                    Mostrar solo perfiles dentro del rango de edad
                  </Text>
                </View>
                <Switch
                  value={preferencias?.match_filtrar_edad}
                  onValueChange={(value) => 
                    actualizarPreferencia("match_filtrar_edad", value)
                  }
                />
              </View>
              
              {preferencias?.match_filtrar_edad && (
                <View className="mt-4 bg-gray-50 rounded-lg p-4">
                  <View className="space-y-6">
                    {/* Edad Mínima */}
                    <View>
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-sm font-medium text-gray-600">
                          Edad mínima
                        </Text>
                        <Text className="text-sm font-bold text-primary-600">
                          {edadMinima} años
                        </Text>
                      </View>
                      <Slider
                        style={{ width: '100%', height: 40 }}
                        minimumValue={13}
                        maximumValue={edadMaxima}
                        step={1}
                        value={edadMinima}
                        onValueChange={setEdadMinima}
                        onSlidingComplete={actualizarRangoEdad}
                        minimumTrackTintColor="#6D29D2"
                        maximumTrackTintColor="#D1D5DB"
                        thumbTintColor="#6D29D2"
                      />
                    </View>

                    {/* Edad Máxima */}
                    <View>
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-sm font-medium text-gray-600">
                          Edad máxima
                        </Text>
                        <Text className="text-sm font-bold text-primary-600">
                          {edadMaxima} años
                        </Text>
                      </View>
                      <Slider
                        style={{ width: '100%', height: 40 }}
                        minimumValue={edadMinima}
                        maximumValue={99}
                        step={1}
                        value={edadMaxima}
                        onValueChange={setEdadMaxima}
                        onSlidingComplete={actualizarRangoEdad}
                        minimumTrackTintColor="#6D29D2"
                        maximumTrackTintColor="#D1D5DB"
                        thumbTintColor="#6D29D2"
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Filtrar por Distancia */}
            <View className="space-y-2">
              <View className="flex-row justify-between items-start space-x-4">
                <View className="flex-1 flex-shrink">
                  <Text className="text-base font-medium break-words">Distancia</Text>
                  <Text className="text-sm text-gray-500 break-words">
                    Mostrar perfiles dentro de esta distancia
                  </Text>
                </View>
                <Switch
                  value={!preferencias?.sin_limite_distancia}
                  onValueChange={(value) => {
                    actualizarPreferencia("sin_limite_distancia", !value);
                    if (!value) {
                      actualizarPreferencia("preferencias_distancia", 100);
                    }
                  }}
                />
              </View>
              
              {!preferencias?.sin_limite_distancia && (
                <View className="mt-4 bg-gray-50 rounded-lg p-4">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-sm font-medium text-gray-600">
                      Distancia máxima
                    </Text>
                    <Text className="text-sm font-bold text-primary-600">
                      {preferencias?.preferencias_distancia} km
                    </Text>
                  </View>
                  <Slider
                    style={{ width: '100%', height: 40 }}
                    minimumValue={1}
                    maximumValue={100}
                    step={1}
                    value={preferencias?.preferencias_distancia || 10}
                    onValueChange={(value) => 
                      actualizarPreferencia("preferencias_distancia", value)
                    }
                    minimumTrackTintColor="#6D29D2"
                    maximumTrackTintColor="#D1D5DB"
                    thumbTintColor="#6D29D2"
                  />
                </View>
              )}
            </View>

            {/* Filtrar por Nacionalidad */}
            <View className="space-y-2">
              <TouchableOpacity 
                onPress={() => toggleSection('nacionalidades')}
                className="flex-row justify-between items-center bg-white p-4 rounded-lg"
              >
                <View>
                  <Text className="text-base font-medium">Filtrar por Nacionalidad</Text>
                  <Text className="text-sm text-gray-500">
                    {preferencias?.match_nacionalidades?.length || 0} nacionalidades seleccionadas
                  </Text>
                </View>
                <Switch
                  value={preferencias?.match_filtrar_nacionalidad}
                  onValueChange={(value) => 
                    actualizarPreferencia("match_filtrar_nacionalidad", value)
                  }
                />
              </TouchableOpacity>

              {preferencias?.match_filtrar_nacionalidad && (
                <View className="mt-4 bg-gray-50 rounded-lg p-4">
                  <View className="flex-row flex-wrap gap-2">
                    {nacionalidadesDisponibles.map((nacionalidad: string) => (
                      <TouchableOpacity
                        key={nacionalidad}
                        onPress={() => {
                          const currentNacionalidades = preferencias?.match_nacionalidades || [];
                          let newNacionalidades: string[];
                          if (currentNacionalidades.includes(nacionalidad)) {
                            newNacionalidades = currentNacionalidades.filter(n => n !== nacionalidad);
                          } else {
                            newNacionalidades = [...currentNacionalidades, nacionalidad];
                          }
                          actualizarPreferencia('match_nacionalidades', newNacionalidades);
                        }}
                        className={`px-3 py-2 rounded-full ${
                          preferencias?.match_nacionalidades?.includes(nacionalidad)
                            ? 'bg-primary-500'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <Text className={`${
                          preferencias?.match_nacionalidades?.includes(nacionalidad)
                            ? 'text-white'
                            : 'text-gray-600'
                        } text-sm`}>
                          {nacionalidad}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {preferencias?.match_nacionalidades?.length === 0 && (
                    <Text className="text-gray-500 text-sm text-center mt-2">
                      Selecciona las nacionalidades que prefieres
                    </Text>
                  )}
                </View>
              )}
            </View>
            
            {/* Géneros Musicales */}
            <View className="space-y-2">
              <TouchableOpacity 
                onPress={() => toggleSection('generos')}
                className="flex-row justify-between items-center bg-white p-4 rounded-lg"
              >
                <View>
                  <Text className="text-base font-medium">Géneros Musicales</Text>
                  <Text className="text-sm text-gray-500">
                    {preferencias?.preferencias_genero?.length || 0}/5 seleccionados
                  </Text>
                </View>
                {expandedSections.generos ? (
                  <Ionicons name="chevron-up" size={24} color="#6D29D2" />
                ) : (
                  <Ionicons name="chevron-down" size={24} color="#6D29D2" />
                )}
              </TouchableOpacity>

              {expandedSections.generos && (
                <View className="bg-gray-50 rounded-lg p-4">
                  <View className="flex-row flex-wrap gap-2">
                    {generosMusicales?.map((genero: string) => (
                      <TouchableOpacity
                        key={genero}
                        onPress={() => {
                          const currentGeneros = preferencias?.preferencias_genero || [];
                          let newGeneros;
                          if (currentGeneros.includes(genero)) {
                            newGeneros = currentGeneros.filter(g => g !== genero);
                          } else if (currentGeneros.length < 5) {
                            newGeneros = [...currentGeneros, genero];
                          } else {
                            Alert.alert('Límite alcanzado', 'Solo puedes seleccionar hasta 5 géneros');
                            return;
                          }
                          actualizarPreferencia('preferencias_genero', newGeneros);
                        }}
                        className={`px-3 py-2 rounded-full ${
                          preferencias?.preferencias_genero?.includes(genero)
                            ? 'bg-primary-500'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <Text className={`${
                          preferencias?.preferencias_genero?.includes(genero)
                            ? 'text-white'
                            : 'text-gray-600'
                        } text-sm`}>
                          {genero}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Habilidades Musicales */}
            <View className="space-y-2">
              <TouchableOpacity 
                onPress={() => toggleSection('habilidades')}
                className="flex-row justify-between items-center bg-white p-4 rounded-lg"
              >
                <View>
                  <Text className="text-base font-medium">Habilidades Musicales</Text>
                  <Text className="text-sm text-gray-500">
                    {preferencias?.preferencias_habilidad?.length || 0}/5 seleccionadas
                  </Text>
                </View>
                {expandedSections.habilidades ? (
                  <Ionicons name="chevron-up" size={24} color="#6D29D2" />
                ) : (
                  <Ionicons name="chevron-down" size={24} color="#6D29D2" />
                )}
              </TouchableOpacity>

              {expandedSections.habilidades && (
                <View className="bg-gray-50 rounded-lg p-4">
                  <View className="flex-row flex-wrap gap-2">
                    {habilidadesMusicales?.map((habilidad: string) => (
                      <TouchableOpacity
                        key={habilidad}
                        onPress={() => {
                          const currentHabilidades = preferencias?.preferencias_habilidad || [];
                          let newHabilidades;
                          if (currentHabilidades.includes(habilidad)) {
                            newHabilidades = currentHabilidades.filter(h => h !== habilidad);
                          } else if (currentHabilidades.length < 5) {
                            newHabilidades = [...currentHabilidades, habilidad];
                          } else {
                            Alert.alert('Límite alcanzado', 'Solo puedes seleccionar hasta 5 habilidades');
                            return;
                          }
                          actualizarPreferencia('preferencias_habilidad', newHabilidades);
                        }}
                        className={`px-3 py-2 rounded-full ${
                          preferencias?.preferencias_habilidad?.includes(habilidad)
                            ? 'bg-secondary-500'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <Text className={`${
                          preferencias?.preferencias_habilidad?.includes(habilidad)
                            ? 'text-white'
                            : 'text-gray-600'
                        } text-sm`}>
                          {habilidad}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Modal de Usuarios Bloqueados - NUEVO */}
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
