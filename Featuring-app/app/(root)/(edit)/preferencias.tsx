import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Preferencias() {
  const [distancia, setDistancia] = useState(2);
  const [generoMusical, setGeneroMusical] = useState("Reggaeton");
  const [tipoArtista, setTipoArtista] = useState("Rapero");
  const router = useRouter();

  const handleSave = () => {
    Alert.alert("Preferencias guardadas", "Tus preferencias han sido guardadas.");
  };

  const adjustDistance = (amount: number) => {
    setDistancia(prev => Math.max(1, Math.min(10, prev + amount)));
  };

  const renderOptionButtons = (options: string[], selectedValue: string, onSelect: (value: string) => void) => {
    return options.map(option => (
      <TouchableOpacity
        key={option}
        className={`bg-gray-600 py-2 px-4 rounded-full mr-2 mb-2 ${selectedValue === option ? 'bg-purple-600' : ''}`}
        onPress={() => onSelect(option)}
      >
        <Text className={`text-white ${selectedValue === option ? 'font-bold' : ''}`}>
          {option}
        </Text>
      </TouchableOpacity>
    ));
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
          <View className="flex-row items-center justify-center">
            <TouchableOpacity className="bg-gray-600 w-10 h-10 rounded-full justify-center items-center" onPress={() => adjustDistance(-1)}>
              <Text className="text-white text-2xl">-</Text>
            </TouchableOpacity>
            <Text className="text-white text-lg mx-4">{distancia} km</Text>
            <TouchableOpacity className="bg-gray-600 w-10 h-10 rounded-full justify-center items-center" onPress={() => adjustDistance(1)}>
              <Text className="text-white text-2xl">+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-white text-lg mb-2">Preferencia de género musical</Text>
          <View className="flex-row flex-wrap">
            {renderOptionButtons(
              ["Reggaeton", "Pop", "Rock", "Hip Hop"],
              generoMusical,
              setGeneroMusical
            )}
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-white text-lg mb-2">Preferencia artística</Text>
          <View className="flex-row flex-wrap">
            {renderOptionButtons(
              ["Rapero", "Cantante", "DJ"],
              tipoArtista,
              setTipoArtista
            )}
          </View>
        </View>

        <TouchableOpacity className="bg-purple-600 rounded-full py-3 px-6 items-center mt-5" onPress={handleSave}>
          <Text className="text-white text-lg font-bold">Guardar</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}