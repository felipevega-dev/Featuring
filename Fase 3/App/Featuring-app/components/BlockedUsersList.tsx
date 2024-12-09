import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

interface BlockedUser {
  bloqueado_id: string;
  username: string;
  foto_perfil: string | null;
}

export default function BlockedUsersList({ isVisible, onClose }: { 
  isVisible: boolean;
  onClose: () => void;
}) {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;

  useEffect(() => {
    if (isVisible) {
      fetchBlockedUsers();
    }
  }, [isVisible]);

  const fetchBlockedUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('bloqueo')
        .select(`
          bloqueado_id,
          perfil:bloqueado_id (
            username,
            foto_perfil
          )
        `)
        .eq('usuario_id', user.id);

      if (error) throw error;

      const formattedUsers = data.map(item => ({
        bloqueado_id: item.bloqueado_id,
        username: item.perfil.username,
        foto_perfil: item.perfil.foto_perfil,
      }));

      setBlockedUsers(formattedUsers);
    } catch (error) {
      console.error('Error al obtener usuarios bloqueados:', error);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      Alert.alert(
        "Desbloquear usuario",
        "¿Estás seguro de que quieres desbloquear a este usuario?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Desbloquear",
            onPress: async () => {
              const { error } = await supabase
                .from('bloqueo')
                .delete()
                .match({
                  usuario_id: user.id,
                  bloqueado_id: userId
                });

              if (error) throw error;
              
              setBlockedUsers(prev => prev.filter(u => u.bloqueado_id !== userId));
              Alert.alert("Usuario desbloqueado");
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error al desbloquear usuario:', error);
      Alert.alert("Error al desbloquear usuario");
    }
  };

  const renderItem = ({ item }: { item: BlockedUser }) => (
    <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
      <View className="flex-row items-center">
        {item.foto_perfil ? (
          <Image
            source={{ uri: `${supabaseUrl}/storage/v1/object/public/fotoperfil/${item.foto_perfil}` }}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <View className="w-12 h-12 rounded-full bg-gray-300 items-center justify-center">
            <Ionicons name="person" size={24} color="gray" />
          </View>
        )}
        <Text className="ml-3 text-lg">{item.username}</Text>
      </View>
      <TouchableOpacity
        onPress={() => handleUnblock(item.bloqueado_id)}
        className="bg-primary-500 px-4 py-2 rounded-full"
      >
        <Text className="text-white">Desbloquear</Text>
      </TouchableOpacity>
    </View>
  );

  if (!isVisible) return null;

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <Text className="text-xl font-bold">Usuarios Bloqueados</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
      </View>
      {blockedUsers.length > 0 ? (
        <FlatList
          data={blockedUsers}
          renderItem={renderItem}
          keyExtractor={item => item.bloqueado_id}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">No hay usuarios bloqueados</Text>
        </View>
      )}
    </View>
  );
} 