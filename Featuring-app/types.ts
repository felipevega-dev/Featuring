// navigation/types.ts
import { StackNavigationProp } from '@react-navigation/stack';

// Define los parámetros para la navegación
export type RootStackParamList = {
  Chat: undefined; // No hay parámetros para la pantalla de Chat
  ChatDetail: { chatName: string }; // Parámetro que se pasa a ChatDetail
};

// Exporta los tipos de navegación
export type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;
export type ChatDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ChatDetail'>;