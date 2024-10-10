// navigation/types.ts
import { StackNavigationProp } from '@react-navigation/stack';

// Define los parámetros para la navegación
export type RootStackParamList = {
  Chat: undefined; // No hay parámetros para la pantalla de Chat
  ChatDetail: { chatName: string }; // Parámetro que se pasa a ChatDetail
  '/chat/[id]': { id: string };
};





// Exporta los tipos de navegación
export type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;
export type ChatDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ChatDetail'>;

export interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  // Añade más campos según sea necesario para tu aplicación
}

export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
  // Puedes añadir más campos según las necesidades de tu aplicación
  avatar_url?: string;
  full_name?: string;
}

export type Users = User[];