import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Slider from '@react-native-community/slider';

const habilidadesMusicales = [
  "Canto", "Guitarra", "Piano", "Batería", "Bajo", "Violín", "Saxofón", "Trompeta",
  "Flauta", "Ukulele", "DJ", "Producción", "Composición", "Arreglos", "Percusión",
  "Armónica", "Contrabajo", "Clarinete", "Oboe", "Cello", "Trombón", "Teclado",
  "Sintetizador", "Banjo", "Mandolina", "Beatboxing", "Técnico de sonido", "Mezcla",
  "Masterización", "Improvisación", "Solfeo", "Dirección coral", "Dirección orquestal",
  "Lectura de partituras", "Orquestación", "Grabación", "Edición de audio"
];

const generosMusicales = [
  "Pop", "Rock", "Hip Hop", "R&B", "Jazz", "Clásica", "Electrónica", "Reggaeton",
  "Country", "Folk", "Blues", "Metal", "Punk", "Indie", "Salsa", "Reggae", "Trap",
  "House", "Techno", "Dubstep", "Gospel", "Soul", "Funk", "Bossa Nova", "Flamenco",
  "Cumbia", "Bachata", "Merengue", "Tango", "Grunge", "Progressive Rock", "Disco",
  "New Wave", "K-Pop", "J-Pop", "Latin Jazz", "Ska", "Afrobeat", "World Music",
  "Chillout", "Lo-fi"
];

const MAX_SELECTIONS = 5;

export default function Preferencias() {
  const [distancia, setDistancia] = useState(10);
  const [sinLimiteDistancia, setSinLimiteDistancia] = useState(false);
  const [generosPreferidos, setGenerosPreferidos] = useState<string[]>([]);
  const [habilidadesPreferidas, setHabilidadesPreferidas] = useState<string[]>([]);
  const [currentSection, setCurrentSection] = useState<'distancia' | 'generos' | 'habilidades'>('distancia');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('perfil')
        .select('preferencias_genero, preferencias_habilidad, preferencias_distancia')
        .eq('usuario_id', user.id)
        .single();

      if (data && !error) {
        setGenerosPreferidos(data.preferencias_genero || []);
        setHabilidadesPreferidas(data.preferencias_habilidad || []);
        if (data.preferencias_distancia === null) {
          setSinLimiteDistancia(true);
          setDistancia(100);
        } else {
          setSinLimiteDistancia(false);
          setDistancia(data.preferencias_distancia || 10);
        }
      }
    }
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase
        .from('perfil')
        .update({
          preferencias_genero: generosPreferidos,
          preferencias_habilidad: habilidadesPreferidas,
          preferencias_distancia: sinLimiteDistancia ? null : distancia
        })
        .eq('usuario_id', user.id);

      if (error) {
        Alert.alert("Error", "No se pudieron guardar las preferencias");
      } else {
        Alert.alert("Éxito", "Tus preferencias han sido guardadas", [
          {
            text: "OK",
            onPress: () => {
              router.push({
                pathname: "/match",
                params: { update: Date.now().toString() }
              });
            }
          }
        ]);
      }
    }
  };

  const togglePreference = (preference: string, setFunction: React.Dispatch<React.SetStateAction<string[]>>) => {
    setFunction(prev => {
      if (prev.includes(preference)) {
        return prev.filter(p => p !== preference);
      } else if (prev.length < MAX_SELECTIONS) {
        return [...prev, preference];
      } else {
        Alert.alert("Límite alcanzado", `Solo puedes seleccionar un máximo de ${MAX_SELECTIONS} opciones.`);
        return prev;
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-primary-600 pt-8">
      <View className="flex-1 bg-gray-100">
        {/* Header */}
        <View className="bg-primary-500 p-4 flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white flex-1">
            Preferencias de Match
          </Text>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Sección de Distancia */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-primary-700">Distancia</Text>
              <View className="flex-row items-center">
                {sinLimiteDistancia && (
                  <Text className="text-primary-700 font-semibold text-sm ml-2">Sin límite</Text>
                )}
                <Switch
                  value={sinLimiteDistancia}
                  onValueChange={(value) => {
                    setSinLimiteDistancia(value);
                    if (value) setDistancia(100);
                  }}
                />
              </View>
            </View>
            
            {/* Slider */}
            {!sinLimiteDistancia && (
              <View>
                <Slider
                  style={{width: '100%', height: 40}}
                  minimumValue={1}
                  maximumValue={100}
                  step={1}
                  value={distancia}
                  onValueChange={setDistancia}
                  minimumTrackTintColor="#6D29D2"
                  maximumTrackTintColor="#D1D5DB"
                />
                <Text className="text-center text-primary-600 font-semibold">
                  {distancia} km
                </Text>
              </View>
            )}
          </View>

          {/* Sección de Géneros */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-lg font-bold text-primary-700 mb-2">
              Géneros Musicales ({generosPreferidos.length}/{MAX_SELECTIONS})
            </Text>
            <View className="flex-row flex-wrap">
              {generosMusicales.map((genero) => (
                <TouchableOpacity
                  key={genero}
                  onPress={() => togglePreference(genero, setGenerosPreferidos)}
                  className={`m-1 px-3 py-1 rounded-full border ${
                    generosPreferidos.includes(genero)
                      ? 'bg-primary-500 border-primary-500'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      generosPreferidos.includes(genero)
                        ? 'text-white font-bold'
                        : 'text-gray-600'
                    }`}
                  >
                    {genero}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sección de Habilidades */}
          <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-lg font-bold text-primary-700 mb-2">
              Habilidades ({habilidadesPreferidas.length}/{MAX_SELECTIONS})
            </Text>
            <View className="flex-row flex-wrap">
              {habilidadesMusicales.map((habilidad) => (
                <TouchableOpacity
                  key={habilidad}
                  onPress={() => togglePreference(habilidad, setHabilidadesPreferidas)}
                  className={`m-1 px-3 py-1 rounded-full border ${
                    habilidadesPreferidas.includes(habilidad)
                      ? 'bg-secondary-500 border-secondary-500'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      habilidadesPreferidas.includes(habilidad)
                        ? 'text-white font-bold'
                        : 'text-gray-600'
                    }`}
                  >
                    {habilidad}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Botón de Guardar */}
        <View className="p-4 bg-white border-t border-gray-200">
          <TouchableOpacity
            onPress={handleSave}
            className="bg-primary-500 py-3 rounded-xl shadow-sm"
          >
            <Text className="text-white text-center font-bold text-lg">
              Guardar Preferencias
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
