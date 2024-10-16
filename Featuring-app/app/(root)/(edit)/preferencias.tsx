import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  FlatList,
  Dimensions,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import Slider from '@react-native-community/slider';

// Importar las listas completas de géneros y habilidades
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

const { width } = Dimensions.get('window');
const itemWidth = (width - 40) / 3; // 40 es el padding horizontal total

export default function Preferencias() {
  const [distancia, setDistancia] = useState(10);
  const [sinLimiteDistancia, setSinLimiteDistancia] = useState(false);
  const [generosPreferidos, setGenerosPreferidos] = useState<string[]>([]);
  const [habilidadesPreferidas, setHabilidadesPreferidas] = useState<string[]>([]);
  const [currentSection, setCurrentSection] = useState<'distancia' | 'generos' | 'habilidades'>('distancia');
  const router = useRouter();

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
        setDistancia(data.preferencias_distancia || 10);
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
                pathname: "/(root)/(tabs)/match",
                params: { update: Date.now() }
              });
            }
          }
        ]);
      }
    }
  };

  const togglePreference = (preference: string, setFunction: React.Dispatch<React.SetStateAction<string[]>>) => {
    setFunction(prev =>
      prev.includes(preference)
        ? prev.filter(p => p !== preference)
        : [...prev, preference]
    );
  };

  const renderItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={{ width: itemWidth, aspectRatio: 1 }}
      className={`border border-gray-300 rounded-lg m-1 justify-center items-center ${
        currentSection === 'generos'
          ? generosPreferidos.includes(item) ? 'bg-purple-600' : 'bg-white'
          : habilidadesPreferidas.includes(item) ? 'bg-purple-600' : 'bg-white'
      }`}
      onPress={() => 
        currentSection === 'generos'
          ? togglePreference(item, setGenerosPreferidos)
          : togglePreference(item, setHabilidadesPreferidas)
      }
    >
      <Text className={`text-center ${
        currentSection === 'generos'
          ? generosPreferidos.includes(item) ? 'text-white font-bold' : 'text-black'
          : habilidadesPreferidas.includes(item) ? 'text-white font-bold' : 'text-black'
      }`}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <TouchableOpacity className="absolute top-10 left-4 z-10" onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#000000" />
      </TouchableOpacity>
      <Text className="text-black text-2xl font-bold text-center mt-20 mb-5">
        Configuración de Preferencias
      </Text>
      <View className="flex-1">
        <View className="flex-row justify-around mb-4">
          <TouchableOpacity
            className={`py-2 px-4 rounded-full ${currentSection === 'distancia' ? 'bg-purple-600' : 'bg-gray-200'}`}
            onPress={() => setCurrentSection('distancia')}
          >
            <Text className={`font-bold ${currentSection === 'distancia' ? 'text-white' : 'text-black'}`}>Distancia</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`py-2 px-4 rounded-full ${currentSection === 'generos' ? 'bg-purple-600' : 'bg-gray-200'}`}
            onPress={() => setCurrentSection('generos')}
          >
            <Text className={`font-bold ${currentSection === 'generos' ? 'text-white' : 'text-black'}`}>Géneros</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`py-2 px-4 rounded-full ${currentSection === 'habilidades' ? 'bg-purple-600' : 'bg-gray-200'}`}
            onPress={() => setCurrentSection('habilidades')}
          >
            <Text className={`font-bold ${currentSection === 'habilidades' ? 'text-white' : 'text-black'}`}>Habilidades</Text>
          </TouchableOpacity>
        </View>

        {currentSection === 'distancia' && (
          <View className="px-4">
            <Text className="text-black text-lg mb-2">Preferencia de distancias</Text>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-black">Sin límite de distancia</Text>
              <Switch
                value={sinLimiteDistancia}
                onValueChange={(value) => setSinLimiteDistancia(value)}
              />
            </View>
            {!sinLimiteDistancia && (
              <>
                <Slider
                  style={{width: '100%', height: 40}}
                  minimumValue={1}
                  maximumValue={100}
                  step={1}
                  value={distancia}
                  onValueChange={setDistancia}
                  minimumTrackTintColor="#8B5CF6"
                  maximumTrackTintColor="#D1D5DB"
                  disabled={sinLimiteDistancia}
                />
                <Text className="text-black text-center">{distancia} km</Text>
              </>
            )}
          </View>
        )}

        {(currentSection === 'generos' || currentSection === 'habilidades') && (
          <FlatList
            data={currentSection === 'generos' ? generosMusicales : habilidadesMusicales}
            renderItem={renderItem}
            keyExtractor={(item) => item}
            numColumns={3}
            contentContainerStyle={{paddingHorizontal: 10}}
          />
        )}
      </View>

      <TouchableOpacity 
        className="bg-purple-600 rounded-full py-3 px-6 items-center mt-5 mx-4 mb-4" 
        onPress={handleSave}
      >
        <Text className="text-white text-lg font-bold">Guardar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
