import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Switch, TouchableOpacity, Alert } from "react-native";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";

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
  match_rango_edad: [number, number];
  match_nacionalidades: string[]; // Array de nacionalidades preferidas
  match_sexo_preferido: string; // 'M', 'F', 'O', 'todos'
}

export default function Preferencias() {
  const [preferencias, setPreferencias] = useState<PreferenciasUsuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPreferencias();
  }, []);

  const fetchPreferencias = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      // Primero obtenemos el perfil
      const { data: perfilData, error: perfilError } = await supabase
        .from("perfil")
        .select("usuario_id")
        .eq("usuario_id", user.id)
        .single();

      if (perfilError) throw perfilError;

      // Luego obtenemos las preferencias usando el usuario_id del perfil
      const { data, error } = await supabase
        .from("preferencias_usuario")
        .select("*")
        .eq("usuario_id", perfilData.usuario_id)
        .single();

      if (error) throw error;
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

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <Text>Cargando preferencias...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="p-4">
        {/* Sección de Privacidad del Perfil */}
        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-bold mb-4 text-primary-600">
            Privacidad del Perfil
          </Text>
          
          <View className="space-y-4">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-base font-medium">Mostrar Edad</Text>
                <Text className="text-sm text-gray-500">
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

            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-base font-medium">Mostrar Ubicación</Text>
                <Text className="text-sm text-gray-500">
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

            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-base font-medium">Mostrar Redes Sociales</Text>
                <Text className="text-sm text-gray-500">
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

            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-base font-medium">Mostrar Valoraciones</Text>
                <Text className="text-sm text-gray-500">
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

        {/* Sección de Privacidad del Contenido */}
        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-bold mb-4 text-primary-600">
            Privacidad del Contenido
          </Text>
          
          <View className="space-y-4">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-base font-medium">Permitir Comentarios</Text>
                <Text className="text-sm text-gray-500">
                  Otros usuarios podrán comentar tu contenido
                </Text>
              </View>
              <Switch
                value={preferencias?.permitir_comentarios_general}
                onValueChange={(value) => 
                  actualizarPreferencia("permitir_comentarios_general", value)
                }
              />
            </View>
          </View>
        </View>

        {/* Sección de Notificaciones */}
        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-bold mb-4 text-primary-600">
            Notificaciones
          </Text>
          
          <View className="space-y-4">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-base font-medium">Mensajes</Text>
                <Text className="text-sm text-gray-500">
                  Recibe notificaciones de mensajes nuevos
                </Text>
              </View>
              <Switch
                value={preferencias?.notificaciones_mensajes}
                onValueChange={(value) => 
                  actualizarPreferencia("notificaciones_mensajes", value)
                }
              />
            </View>

            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-base font-medium">Match</Text>
                <Text className="text-sm text-gray-500">
                  Recibe notificaciones de match nuevos
                </Text>
              </View>
              <Switch
                value={preferencias?.notificaciones_match}
                onValueChange={(value) => 
                  actualizarPreferencia("notificaciones_match", value)
                }
              />
            </View>

            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-base font-medium">Valoraciones</Text>
                <Text className="text-sm text-gray-500">
                  Recibe notificaciones de valoraciones nuevas
                </Text>
              </View>
              <Switch
                value={preferencias?.notificaciones_valoraciones}
                onValueChange={(value) => 
                  actualizarPreferencia("notificaciones_valoraciones", value)
                }
              />
            </View>

            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-base font-medium">Comentarios</Text>
                <Text className="text-sm text-gray-500">
                  Recibe notificaciones de comentarios nuevos
                </Text>
              </View>
              <Switch
                value={preferencias?.notificaciones_comentarios}
                onValueChange={(value) => 
                  actualizarPreferencia("notificaciones_comentarios", value)
                }
              />
            </View>

            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-base font-medium">Seguidores</Text>
                <Text className="text-sm text-gray-500">
                  Recibe notificaciones de nuevos seguidores
                </Text>
              </View>
              <Switch
                value={preferencias?.notificaciones_seguidores}
                onValueChange={(value) => 
                  actualizarPreferencia("notificaciones_seguidores", value)
                }
              />
            </View>
          </View>
        </View>

        {/* Sección de Preferencias de Match */}
        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-bold mb-4 text-primary-600">
            Preferencias de Match
          </Text>
          
          <View className="space-y-4">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-base font-medium">Filtrar Nacionalidad</Text>
                <Text className="text-sm text-gray-500">
                  Solo mostrará usuarios de las nacionalidades preferidas
                </Text>
              </View>
              <Switch
                value={preferencias?.match_filtrar_nacionalidad}
                onValueChange={(value) => 
                  actualizarPreferencia("match_filtrar_nacionalidad", value)
                }
              />
            </View>

            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-base font-medium">Filtrar Edad</Text>
                <Text className="text-sm text-gray-500">
                  Solo mostrará usuarios de la edad preferida
                </Text>
              </View>
              <Switch
                value={preferencias?.match_filtrar_edad}
                onValueChange={(value) => 
                  actualizarPreferencia("match_filtrar_edad", value)
                }
              />
            </View>

            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-base font-medium">Filtrar Sexo</Text>
                <Text className="text-sm text-gray-500">
                  Solo mostrará usuarios del sexo preferido
                </Text>
              </View>
              <Switch
                value={preferencias?.match_filtrar_sexo}
                onValueChange={(value) => 
                  actualizarPreferencia("match_filtrar_sexo", value)
                }
              />
            </View>

            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-base font-medium">Rango de Edad</Text>
                <Text className="text-sm text-gray-500">
                  Solo mostrará usuarios dentro del rango de edad preferido
                </Text>
              </View>
              <Switch
                value={preferencias?.match_rango_edad}
                onValueChange={(value) => 
                  actualizarPreferencia("match_rango_edad", value)
                }
              />
            </View>

            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-base font-medium">Nacionalidades</Text>
                <Text className="text-sm text-gray-500">
                  Solo mostrará usuarios de las nacionalidades preferidas
                </Text>
              </View>
              <TouchableOpacity 
                className="flex-row justify-between items-center py-2"
                onPress={() => {/* Abrir selector de nacionalidades */}}
              >
                <Text className="text-base font-medium">Nacionalidades</Text>
                <View className="flex-row items-center">
                  <Text className="mr-2 text-gray-600">
                    {preferencias?.match_nacionalidades.join(", ") || "Nacionalidades"}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
              </TouchableOpacity>
            </View>

            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-base font-medium">Sexo Preferido</Text>
                <Text className="text-sm text-gray-500">
                  Solo mostrará usuarios del sexo preferido
                </Text>
              </View>
              <TouchableOpacity 
                className="flex-row justify-between items-center py-2"
                onPress={() => {/* Abrir selector de sexo */}}
              >
                <Text className="text-base font-medium">Sexo Preferido</Text>
                <View className="flex-row items-center">
                  <Text className="mr-2 text-gray-600">
                    {preferencias?.match_sexo_preferido || "Sexo"}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Sección de Idioma y Región */}
        <View className="bg-white rounded-lg p-4 mb-4">
          <Text className="text-lg font-bold mb-4 text-primary-600">
            Idioma y Región
          </Text>
          
          <TouchableOpacity 
            className="flex-row justify-between items-center py-2"
            onPress={() => {/* Abrir selector de idioma */}}
          >
            <Text className="text-base font-medium">Idioma</Text>
            <View className="flex-row items-center">
              <Text className="mr-2 text-gray-600">
                {preferencias?.idioma || "Español"}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </View>
          </TouchableOpacity>

          {/* Más opciones de idioma y región... */}
        </View>
      </View>
    </ScrollView>
  );
}
