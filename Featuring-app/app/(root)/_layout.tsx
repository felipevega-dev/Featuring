import { Stack } from "expo-router";
import { Tabs } from 'expo-router'

export default function RootLayout() {

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="public-profile/[id]" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen
        name="(edit)/editar_perfil"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="(edit)/preferencias"
        options={{ headerShown: false, presentation: "modal" }}
      />
    </Stack>
  );
}
