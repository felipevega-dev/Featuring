import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { CollaborationProvider } from '@/contexts/CollaborationContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Jakarta': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'Jakarta-Bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'Jakarta-SemiBold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'Jakarta-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'Jakarta-Light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),
    'Jakarta-ExtraLight': require('../assets/fonts/PlusJakartaSans-ExtraLight.ttf'),
    'Jakarta-ExtraBold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
  });

  const router = useRouter();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }

    const handleDeepLink = (event: Linking.EventType) => {
      let data = Linking.parse(event.url);
      
      if (data.path === 'change-password') {
        // Navegar a la pantalla de cambio de contraseña
        router.push('/change-password');
      }
    };

    // Agregar el listener para deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Manejar el caso en que la app se abre desde un deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url, type: 'url' } as Linking.EventType);
      }
    });

    return () => {
      // Remover el listener cuando el componente se desmonte
      subscription.remove();
    };
  }, [fontsLoaded, router]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <CollaborationProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(root)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="change-password" options={{ title: "Cambiar Contraseña" }} />
      </Stack>
    </CollaborationProvider>
  );
}
