// Chat.tsx
import React from 'react';
import { Image, ScrollView, Text, View, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../types'; // Asegúrate de que la ruta sea correcta
import user1 from '../../../assets/images/user1.jpg';
import user2 from '../../../assets/images/user2.jpg';
import user3 from '../../../assets/images/user3.jpg';

// Define tus tipos de navegación
type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

const matches = [
  { id: 1, name: 'Martin', image: user1 },
  { id: 2, name: 'Bob', image: user2 },
  { id: 3, name: 'Camilo', image: user3 },
];

const chats = [
  { id: 1, name: 'Martin', lastMessage: 'Hola, me gustaría colaborar contigo', image: user1 },
  { id: 2, name: 'Bob', lastMessage: 'Me gusta tu estilo', image: user2 },
];

const Chat = () => {
  const navigation = useNavigation<ChatScreenNavigationProp>(); // Usamos el tipo definido

  return (
    <SafeAreaView className="flex-1 bg-white p-5">
      <View className="mb-5">
        <Text className="text-xl font-JakartaBold mb-3">Matches</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {matches.map((match) => (
            <TouchableOpacity key={match.id} className="mr-4 items-center">
              <Image source={match.image} alt={match.name} className="w-20 h-20 rounded-full" resizeMode="cover" />
              <Text className="text-sm mt-2">{match.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View className="flex-1">
        <Text className="text-xl font-JakartaBold mb-3">Chats</Text>
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="flex-row items-center mb-4 p-3 bg-gray-100 rounded-lg"
              onPress={() => navigation.navigate('ChatDetail', { chatName: item.name })} // Navegamos con parámetros
            >
              <Image source={item.image} alt={item.name} className="w-12 h-12 rounded-full" resizeMode="cover" />
              <View className="ml-4 flex-1">
                <Text className="text-lg font-JakartaBold">{item.name}</Text>
                <Text className="text-sm text-gray-600">{item.lastMessage}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default Chat;