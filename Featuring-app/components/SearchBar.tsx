import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generosMusicalesCompletos } from '@/constants/musicData';

interface SearchBarProps {
  isExpanded: boolean;
  onToggle: () => void;
  onSearch: (searchTerm: string, selectedGenre: string) => void;
}

export default function SearchBar({ isExpanded, onToggle, onSearch }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');

  const handleSearch = (newSearchTerm: string, newGenre: string) => {
    setSearchTerm(newSearchTerm);
    setSelectedGenre(newGenre);
    onSearch(newSearchTerm, newGenre);
  };

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
            onChangeText={(text) => handleSearch(text, selectedGenre)}
          />
          <Ionicons name="search" size={24} color="#666" style={{ marginRight: 10 }} />
        </View>
        <TouchableOpacity
          onPress={() => handleSearch(searchTerm, '')}
          className="bg-secondary-500 p-2 rounded-r-full justify-end items-center ml-2"
        >
          <Text className="text-white">
            {selectedGenre || "Género"}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={generosMusicalesCompletos}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleSearch(searchTerm, item)}
            className={`px-3 py-1 rounded-full mr-2 mt-2 ${
              selectedGenre === item ? 'bg-secondary-500' : 'bg-primary-700'
            }`}
          >
            <Text className="text-white">{item}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
      />
    </View>
  );
}
