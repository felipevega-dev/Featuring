import { Stack } from "expo-router";

const Layout = () => {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
};

export default Layout;
