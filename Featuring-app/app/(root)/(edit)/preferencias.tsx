import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Modal,
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

export default function Preferencias() {
  const [distancia, setDistancia] = useState(10);
  const [generosPreferidos, setGenerosPreferidos] = useState<string[]>([]);
  const [habilidadesPreferidas, setHabilidadesPreferidas] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'generos' | 'habilidades'>('generos');
  const [showAllOptions, setShowAllOptions] = useState(false);
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
          preferencias_distancia: distancia
        })
        .eq('usuario_id', user.id);

      if (error) {
        Alert.alert("Error", "No se pudieron guardar las preferencias");
      } else {
        Alert.alert("Éxito", "Tus preferencias han sido guardadas");
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

  const renderOptionButtons = (options: string[], selectedValues: string[], setFunction: React.Dispatch<React.SetStateAction<string[]>>) => {
    const initialOptionsToShow = 10;
    const optionsToRender = showAllOptions ? options : options.slice(0, initialOptionsToShow);

    return (
      <>
        {optionsToRender.map(option => (
          <TouchableOpacity
            key={option}
            className={`bg-gray-600 py-2 px-4 rounded-full mr-2 mb-2 ${selectedValues.includes(option) ? 'bg-purple-600' : ''}`}
            onPress={() => togglePreference(option, setFunction)}
          >
            <Text className={`text-white ${selectedValues.includes(option) ? 'font-bold' : ''}`}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
        {!showAllOptions && options.length > initialOptionsToShow && (
          <TouchableOpacity
            className="bg-blue-500 py-2 px-4 rounded-full mr-2 mb-2"
            onPress={() => setShowAllOptions(true)}
          >
            <Text className="text-white font-bold">Ver más</Text>
          </TouchableOpacity>
        )}
      </>
    );
  };

  const openModal = (type: 'generos' | 'habilidades') => {
    setModalType(type);
    setModalVisible(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-blue-900">
      <TouchableOpacity className="absolute top-10 left-4 z-10" onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#ffffff" />
      </TouchableOpacity>
      <Text className="text-white text-2xl font-bold text-center mt-20 mb-5">
        Configuración de Preferencias
      </Text>
      <ScrollView className="flex-1 px-4" contentContainerStyle={{justifyContent: 'center'}}>
        <View className="mb-6">
          <Text className="text-white text-lg mb-2">Preferencia de distancias</Text>
          <Slider
            style={{width: '100%', height: 40}}
            minimumValue={1}
            maximumValue={100}
            step={1}
            value={distancia}
            onValueChange={setDistancia}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="#000000"
          />
          <Text className="text-white text-center">{distancia} km</Text>
        </View>

        <TouchableOpacity 
          className="bg-purple-600 rounded-full py-3 px-6 items-center mt-5" 
          onPress={() => openModal('generos')}
        >
          <Text className="text-white text-lg font-bold">Seleccionar Géneros Musicales</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-purple-600 rounded-full py-3 px-6 items-center mt-5" 
          onPress={() => openModal('habilidades')}
        >
          <Text className="text-white text-lg font-bold">Seleccionar Habilidades Musicales</Text>
        </TouchableOpacity>

        <TouchableOpacity className="bg-purple-600 rounded-full py-3 px-6 items-center mt-5" onPress={handleSave}>
          <Text className="text-white text-lg font-bold">Guardar</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setShowAllOptions(false);
        }}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white rounded-xl p-5 w-[90%] max-h-[90%]">
            <Text className="text-2xl font-bold mb-4">
              {modalType === 'generos' ? 'Géneros Musicales' : 'Habilidades Musicales'}
            </Text>
            <ScrollView>
              {modalType === 'generos' 
                ? renderOptionButtons(generosMusicales, generosPreferidos, setGenerosPreferidos)
                : renderOptionButtons(habilidadesMusicales, habilidadesPreferidas, setHabilidadesPreferidas)
              }
            </ScrollView>
            <TouchableOpacity
              className="bg-purple-600 rounded-full py-3 px-6 items-center mt-5"
              onPress={() => {
                setModalVisible(false);
                setShowAllOptions(false);
              }}
            >
              <Text className="text-white text-lg font-bold">Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
