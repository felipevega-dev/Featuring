import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Chat from './app/(root)/(tabs)/chat';
import ChatDetail from './app/(root)/(tabs)/chatDetail';

// Define the navigation prop type
export type RootStackParamList = {
  Chat: undefined;
  ChatDetail: { chatName: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Chat">
          <Stack.Screen name="Chat" component={Chat} />
          <Stack.Screen name="ChatDetail" component={ChatDetail} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}