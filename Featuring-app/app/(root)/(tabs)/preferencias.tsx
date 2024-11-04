import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  Switch, 
  TouchableOpacity, 
  Alert,
  Platform 
} from "react-native";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PreferenciasUsuario {
  // Privacidad del perfil
  mostrar_edad: boolean;
  mostrar_ubicacion: boolean;
  mostrar_redes_sociales: boolean;
  mostrar_valoraciones: boolean;
  
  // Privacidad del contenido
  permitir_comentarios_general: boolean; // Configuración general para comentarios
  
  // Notificaciones
  notificaciones_mensajes: boolean;
  notificaciones_match: boolean;
  notificaciones_valoraciones: boolean;
  notificaciones_comentarios: boolean;
  notificaciones_seguidores: boolean; // Añadido nuevo seguidor
  
  // Preferencias de Match
  match_filtrar_nacionalidad: boolean;
  match_filtrar_edad: boolean;
  match_filtrar_sexo: boolean;
  match_rango_edad: number[];
  match_nacionalidades: string[]; // Array de nacionalidades preferidas
  match_sexo_preferido: 'M' | 'F' | 'O' | 'todos'; // 'M', 'F', 'O', 'todos'
}

interface OpcionSexo {
  valor: 'M' | 'F' | 'O' | 'todos';
  label: string;
}

export default function Preferencias() {
  const [preferencias, setPreferencias] = useState<PreferenciasUsuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [edadMinima, setEdadMinima] = useState(18);
  const [edadMaxima, setEdadMaxima] = useState(99);
  const insets = useSafeAreaInsets();

  const opciones: OpcionSexo[] = [
    { valor: 'M', label: 'Masculino' },
    { valor: 'F', label: 'Femenino' },
    { valor: 'O', label: 'Otro' },
    { valor: 'todos', label: 'Todos' }
  ];

  useEffect(() => {
    fetchPreferencias();
  }, []);

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

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <Text>Cargando preferencias...</Text>
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
            Privacidad del Perfil
          </Text>
          
          <View className="space-y-4">
            {/* Cada elemento de configuración tiene mejor estructura */}
            <View className="flex-row justify-between items-start space-x-4">
              <View className="flex-1 flex-shrink">
                <Text className="text-base font-medium break-words">Mostrar Edad</Text>
                <Text className="text-sm text-gray-500 break-words">
                  Tu edad será visible en tu perfil
                </Text>
              </View>
              <Switch
                value={preferencias?.mostrar_edad}
                onValueChange={(value) => 
                  actualizarPreferencia("mostrar_edad", value)
                }
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
                value={preferencias?.mostrar_ubicacion}
                onValueChange={(value) => 
                  actualizarPreferencia("mostrar_ubicacion", value)
                }
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
                value={preferencias?.mostrar_redes_sociales}
                onValueChange={(value) => 
                  actualizarPreferencia("mostrar_redes_sociales", value)
                }
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
                value={preferencias?.mostrar_valoraciones}
                onValueChange={(value) => 
                  actualizarPreferencia("mostrar_valoraciones", value)
                }
              />
            </View>
          </View>
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

            {/* Filtrar por Nacionalidad */}
            <View className="space-y-2">
              <View className="flex-row justify-between items-start space-x-4">
                <View className="flex-1 flex-shrink">
                  <Text className="text-base font-medium break-words">
                    Filtrar por Nacionalidad
                  </Text>
                  <Text className="text-sm text-gray-500 break-words">
                    Mostrar solo perfiles de ciertas nacionalidades
                  </Text>
                </View>
                <Switch
                  value={preferencias?.match_filtrar_nacionalidad}
                  onValueChange={(value) => 
                    actualizarPreferencia("match_filtrar_nacionalidad", value)
                  }
                />
              </View>

              {preferencias?.match_filtrar_nacionalidad && (
                <View className="mt-4 bg-gray-50 rounded-lg p-4">
                  <View className="flex-row flex-wrap gap-2">
                    {preferencias.match_nacionalidades.map((nacionalidad, index) => (
                      <View 
                        key={index} 
                        className="bg-white border border-primary-200 rounded-full px-4 py-2"
                      >
                        <Text className="text-primary-600 font-medium">{nacionalidad}</Text>
                      </View>
                    ))}
                    {preferencias.match_nacionalidades.length === 0 && (
                      <Text className="text-gray-500 text-sm">
                        No hay nacionalidades seleccionadas
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
