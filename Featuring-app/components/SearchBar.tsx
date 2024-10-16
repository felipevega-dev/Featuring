import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Cancion } from '@/types/db_types';
import { generosMusicalesCompletos } from '@/constants/musicData';

interface SearchBarProps {
  isExpanded: boolean;
  onToggle: () => void;
  onSongSelect: (song: Cancion) => void;
}

export default function SearchBar({ isExpanded, onToggle, onSongSelect }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [searchResults, setSearchResults] = useState<Cancion[]>([]);

  useEffect(() => {
    if (searchTerm || selectedGenre) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, selectedGenre]);

  const performSearch = async () => {
    try {
      let query = supabase
        .from('cancion')
        .select('*')
        .ilike('titulo', `%${searchTerm}%`)

      if (selectedGenre) {
        query = query.eq('genero', selectedGenre);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching songs:', error);
    }
  };

  const renderSongItem = ({ item }: { item: Cancion }) => (
    <TouchableOpacity
      className="flex-row items-center border-b border-primary-700"
      onPress={() => onSongSelect(item)}
    >
      <Image
        source={{ uri: item.caratula || undefined }}
        className="w-12 h-12 rounded-md mr-4"
      />
      <View className="flex-1">
        <Text className="text-white font-bold">{item.titulo}</Text>
        <Text className="text-primary-300">{item.genero}</Text>
      </View>
    </TouchableOpacity>
  );

  if (!isExpanded) {
    return null;
  }

  return (
    <View className="bg-primary-800 p-4">
      <View className="flex-row items-center">
        <View className="flex-row items-center bg-primary-700 rounded-l-full flex-1">
          <TextInput
            className="flex-1 text-white p-2 pl-4"
            placeholder="Buscar por título"
            placeholderTextColor="#666"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          <Ionicons name="search" size={24} color="#666" style={{ marginRight: 10 }} />
        </View>
        <TouchableOpacity
          onPress={() => setSelectedGenre('')}
          className="bg-secondary-500 p-2 rounded-r-full justify-end items-center ml-2"
        >
          <Text className="text-white">
            {selectedGenre || "Género"}
          </Text>
        </TouchableOpacity>
      </View>
      {selectedGenre === '' && (
        <FlatList
          data={generosMusicalesCompletos}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedGenre(item)}
              className="bg-primary-700 px-3 py-1 rounded-full mr-2 mt-2"
            >
              <Text className="text-white">{item}</Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
        />
      )}
      <FlatList
        data={searchResults}
        renderItem={renderSongItem}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}
