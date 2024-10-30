import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';

interface Colaborador {
  usuario_id: string;
  username: string;
  foto_perfil: string | null;
}

interface CollaboratorSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (colaborador: Colaborador) => void;
  currentUserId: string;
}

export default function CollaboratorSelectionModal({
  isVisible,
  onClose,
  onSelect,
  currentUserId,
}: CollaboratorSelectionModalProps) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;

  useEffect(() => {
    if (isVisible) {
      fetchColaboradores();
    }
  }, [isVisible]);

  const fetchColaboradores = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('conexion')
        .select(`
          usuario2_id,
          perfil:usuario2_id(
            usuario_id,
            username,
            foto_perfil
          )
        `)
        .eq('usuario1_id', currentUserId)
        .eq('estado', true);

      if (error) throw error;

      const colaboradoresFormateados = data
        .map(item => ({
          usuario_id: item.usuario2_id,
          username: item.perfil.username,
          foto_perfil: item.perfil.foto_perfil
        }))
        .filter(Boolean);

      setColaboradores(colaboradoresFormateados);
    } catch (error) {
      console.error('Error al cargar colaboradores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Colaborador }) => (
    <TouchableOpacity
      onPress={() => onSelect(item)}
      className="flex-row items-center p-4 border-b border-gray-200"
    >
      <Image
        source={{
          uri: item.foto_perfil
            ? `${supabaseUrl}/storage/v1/object/public/fotoperfil/${item.foto_perfil}`
            : 'https://via.placeholder.com/40'
        }}
        className="w-10 h-10 rounded-full"
      />
      <Text className="ml-3 text-base font-medium">{item.username}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl h-2/3">
          <View className="p-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-center">
              Seleccionar Colaborador
            </Text>
          </View>
          
          {isLoading ? (
            <ActivityIndicator size="large" className="mt-4" />
          ) : colaboradores.length > 0 ? (
            <FlatList
              data={colaboradores}
              renderItem={renderItem}
              keyExtractor={(item) => item.usuario_id}
              className="flex-1"
            />
          ) : (
            <View className="flex-1 justify-center items-center p-4">
              <Text className="text-gray-500 text-center">
                No tienes conexiones disponibles para colaborar.
                Primero establece conexiones con otros usuarios.
              </Text>
            </View>
          )}
          
          <TouchableOpacity
            onPress={onClose}
            className="p-4 border-t border-gray-200"
          >
            <Text className="text-center text-primary-500 font-bold">
              Cancelar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
} 