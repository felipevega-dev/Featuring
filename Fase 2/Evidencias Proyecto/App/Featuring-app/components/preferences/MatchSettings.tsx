import React, { useState, useEffect } from 'react';
import { View, Text, Switch, TouchableOpacity, Alert, TextInput } from 'react-native';
import { hispanicCountryCodes } from "@/utils/countryCodes";
import { habilidadesMusicales, generosMusicales } from "@/constants/musicData";
import { Ionicons } from "@expo/vector-icons";

interface PreferenciasUsuario {
  match_filtrar_nacionalidad: boolean;
  match_filtrar_edad: boolean;
  match_filtrar_sexo: boolean;
  match_rango_edad: number[];
  match_nacionalidades: string[];
  match_sexo_preferido: 'M' | 'F' | 'O' | 'todos';
  preferencias_genero: string[];
  preferencias_habilidad: string[];
  preferencias_distancia: number;
  sin_limite_distancia: boolean;
}

interface MatchSettingsProps {
  preferencias: PreferenciasUsuario | null;
  onUpdatePreferencia: (campo: keyof PreferenciasUsuario, valor: any) => void;
}

export const MatchSettingsSection: React.FC<MatchSettingsProps> = ({
  preferencias,
  onUpdatePreferencia
}) => {
  const [expandedSections, setExpandedSections] = useState({
    generos: false,
    habilidades: false,
    nacionalidades: false
  });

  const [edadMinimaInput, setEdadMinimaInput] = useState(preferencias?.match_rango_edad[0]?.toString() || '18');
  const [edadMaximaInput, setEdadMaximaInput] = useState(preferencias?.match_rango_edad[1]?.toString() || '99');
  const [distanciaInput, setDistanciaInput] = useState(preferencias?.preferencias_distancia?.toString() || '10');

  useEffect(() => {
    setEdadMinimaInput(preferencias?.match_rango_edad[0]?.toString() || '18');
    setEdadMaximaInput(preferencias?.match_rango_edad[1]?.toString() || '99');
    setDistanciaInput(preferencias?.preferencias_distancia?.toString() || '10');
  }, [preferencias]);

  const toggleSection = (section: 'generos' | 'habilidades' | 'nacionalidades') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const nacionalidadesDisponibles: string[] = Object.keys(hispanicCountryCodes);

  const opciones = [
    { valor: 'M', label: 'Masculino' },
    { valor: 'F', label: 'Femenino' },
    { valor: 'O', label: 'Otro' },
    { valor: 'todos', label: 'Todos' }
  ] as const;

  return (
    <View className="bg-white rounded-lg p-4 mb-14">
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
              onValueChange={() => onUpdatePreferencia('match_filtrar_sexo', !preferencias?.match_filtrar_sexo)}
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
                    onPress={() => onUpdatePreferencia('match_sexo_preferido', opcion.valor)}
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
              onValueChange={() => onUpdatePreferencia('match_filtrar_edad', !preferencias?.match_filtrar_edad)}
            />
          </View>
          
          {preferencias?.match_filtrar_edad && (
            <View className="mt-4 bg-gray-50 rounded-lg p-4 space-y-4">
              {/* Edad Mínima */}
              <View>
                <Text className="text-sm font-medium text-gray-600 mb-2">
                  Edad mínima
                </Text>
                <View className="flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={() => {
                      const newValue = Math.max(13, (preferencias?.match_rango_edad[0] || 18) - 1);
                      onUpdatePreferencia('match_rango_edad', [newValue, preferencias?.match_rango_edad[1]]);
                    }}
                    className="bg-primary-500 w-10 h-10 rounded-full items-center justify-center"
                  >
                    <Ionicons name="remove" size={24} color="white" />
                  </TouchableOpacity>

                  <View className="flex-row items-center">
                    <TextInput
                      className="bg-white px-4 py-2 rounded-lg text-center w-20 text-lg font-bold text-primary-600"
                      keyboardType="numeric"
                      value={edadMinimaInput}
                      onChangeText={setEdadMinimaInput}
                      onEndEditing={() => {
                        const value = parseInt(edadMinimaInput) || 13;
                        if (value >= 13 && value <= preferencias?.match_rango_edad[1]) {
                          onUpdatePreferencia('match_rango_edad', [value, preferencias?.match_rango_edad[1]]);
                        } else {
                          setEdadMinimaInput(preferencias?.match_rango_edad[0]?.toString() || '18');
                        }
                      }}
                    />
                    <Text className="ml-2 text-primary-600 font-medium">años</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      const newValue = Math.min(preferencias?.match_rango_edad[1] || 99, (preferencias?.match_rango_edad[0] || 18) + 1);
                      onUpdatePreferencia('match_rango_edad', [newValue, preferencias?.match_rango_edad[1]]);
                    }}
                    className="bg-primary-500 w-10 h-10 rounded-full items-center justify-center"
                  >
                    <Ionicons name="add" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Edad Máxima */}
              <View>
                <Text className="text-sm font-medium text-gray-600 mb-2">
                  Edad máxima
                </Text>
                <View className="flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={() => {
                      const newValue = Math.max(preferencias?.match_rango_edad[0] || 18, (preferencias?.match_rango_edad[1] || 99) - 1);
                      onUpdatePreferencia('match_rango_edad', [preferencias?.match_rango_edad[0], newValue]);
                    }}
                    className="bg-primary-500 w-10 h-10 rounded-full items-center justify-center"
                  >
                    <Ionicons name="remove" size={24} color="white" />
                  </TouchableOpacity>

                  <View className="flex-row items-center">
                    <TextInput
                      className="bg-white px-4 py-2 rounded-lg text-center w-20 text-lg font-bold text-primary-600"
                      keyboardType="numeric"
                      value={edadMaximaInput}
                      onChangeText={setEdadMaximaInput}
                      onEndEditing={() => {
                        const value = parseInt(edadMaximaInput) || preferencias?.match_rango_edad[0];
                        if (value >= preferencias?.match_rango_edad[0] && value <= 99) {
                          onUpdatePreferencia('match_rango_edad', [preferencias?.match_rango_edad[0], value]);
                        } else {
                          setEdadMaximaInput(preferencias?.match_rango_edad[1]?.toString() || '99');
                        }
                      }}
                    />
                    <Text className="ml-2 text-primary-600 font-medium">años</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      const newValue = Math.min(99, (preferencias?.match_rango_edad[1] || 99) + 1);
                      onUpdatePreferencia('match_rango_edad', [preferencias?.match_rango_edad[0], newValue]);
                    }}
                    className="bg-primary-500 w-10 h-10 rounded-full items-center justify-center"
                  >
                    <Ionicons name="add" size={24} color="white" />
                  </TouchableOpacity>
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
                onUpdatePreferencia("sin_limite_distancia", !value);
                if (!value) {
                  onUpdatePreferencia("preferencias_distancia", 100);
                }
              }}
            />
          </View>
          
          {!preferencias?.sin_limite_distancia && (
            <View className="mt-4 bg-gray-50 rounded-lg p-4">
              <Text className="text-sm font-medium text-gray-600 mb-2">
                Distancia máxima
              </Text>
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  onPress={() => {
                    const newValue = Math.max(1, (preferencias?.preferencias_distancia || 10) - 5);
                    onUpdatePreferencia("preferencias_distancia", newValue);
                  }}
                  className="bg-primary-500 w-10 h-10 rounded-full items-center justify-center"
                >
                  <Ionicons name="remove" size={24} color="white" />
                </TouchableOpacity>

                <View className="flex-row items-center">
                  <TextInput
                    className="bg-white px-4 py-2 rounded-lg text-center w-20 text-lg font-bold text-primary-600"
                    keyboardType="numeric"
                    value={distanciaInput}
                    onChangeText={setDistanciaInput}
                    onEndEditing={() => {
                      const value = parseInt(distanciaInput) || 1;
                      if (value >= 1 && value <= 100) {
                        onUpdatePreferencia("preferencias_distancia", value);
                      } else {
                        setDistanciaInput(preferencias?.preferencias_distancia?.toString() || '10');
                      }
                    }}
                  />
                  <Text className="ml-2 text-primary-600 font-medium">km</Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    const newValue = Math.min(100, (preferencias?.preferencias_distancia || 10) + 5);
                    onUpdatePreferencia("preferencias_distancia", newValue);
                  }}
                  className="bg-primary-500 w-10 h-10 rounded-full items-center justify-center"
                >
                  <Ionicons name="add" size={24} color="white" />
                </TouchableOpacity>
              </View>
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
              onValueChange={() => onUpdatePreferencia('match_filtrar_nacionalidad', !preferencias?.match_filtrar_nacionalidad)}
            />
          </TouchableOpacity>

          {preferencias?.match_filtrar_nacionalidad && expandedSections.nacionalidades && (
            <View className="mt-4 bg-gray-50 rounded-lg p-4">
              <View className="flex-row flex-wrap gap-2">
                {nacionalidadesDisponibles.map((nacionalidad) => (
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
                      onUpdatePreferencia('match_nacionalidades', newNacionalidades);
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
                {generosMusicales.map((genero) => (
                  <TouchableOpacity
                    key={genero}
                    onPress={() => {
                      const currentGeneros = preferencias?.preferencias_genero || [];
                      let newGeneros: string[];
                      if (currentGeneros.includes(genero)) {
                        newGeneros = currentGeneros.filter(g => g !== genero);
                      } else if (currentGeneros.length < 5) {
                        newGeneros = [...currentGeneros, genero];
                      } else {
                        Alert.alert('Límite alcanzado', 'Solo puedes seleccionar hasta 5 géneros');
                        return;
                      }
                      onUpdatePreferencia('preferencias_genero', newGeneros);
                    }}
                    className={`px-3 py-2 rounded-full ${
                      preferencias?.preferencias_genero.includes(genero)
                        ? 'bg-primary-500'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <Text className={`${
                      preferencias?.preferencias_genero.includes(genero)
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
                {habilidadesMusicales.map((habilidad) => (
                  <TouchableOpacity
                    key={habilidad}
                    onPress={() => {
                      const currentHabilidades = preferencias?.preferencias_habilidad || [];
                      let newHabilidades: string[];
                      if (currentHabilidades.includes(habilidad)) {
                        newHabilidades = currentHabilidades.filter(h => h !== habilidad);
                      } else if (currentHabilidades.length < 5) {
                        newHabilidades = [...currentHabilidades, habilidad];
                      } else {
                        Alert.alert('Límite alcanzado', 'Solo puedes seleccionar hasta 5 habilidades');
                        return;
                      }
                      onUpdatePreferencia('preferencias_habilidad', newHabilidades);
                    }}
                    className={`px-3 py-2 rounded-full ${
                      preferencias?.preferencias_habilidad.includes(habilidad)
                        ? 'bg-secondary-500'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <Text className={`${
                      preferencias?.preferencias_habilidad.includes(habilidad)
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
  );
}; 