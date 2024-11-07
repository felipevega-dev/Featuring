import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { CollaborationProvider } from '@/contexts/CollaborationContext';
import { registerForPushNotificationsAsync } from '@/utils/pushNotifications';
import { supabase } from '@/lib/supabase';
import { useSuspensionCheck } from '@/hooks/useSuspensionCheck';
import { SuspendedScreen } from '@/components/SuspendedScreen';

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
  const { isSuspended } = useSuspensionCheck();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }

    const handleDeepLink = (event: Linking.EventType) => {
      let data = Linking.parse(event.url);
      
      if (data.path === 'change-password') {
        router.push('/change-password');
      }
    };

    // Setup listeners and handlers
    const setupListeners = async () => {
      // Deep link listener
      const linkingSubscription = Linking.addEventListener('url', handleDeepLink);

      // Auth state change listener
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const token = await registerForPushNotificationsAsync();
          console.log('Token registrado después de inicio de sesión:', token);
        }
      });

      // Manejar el caso en que la app se abre desde un deep link
      Linking.getInitialURL().then((url) => {
        if (url) {
          handleDeepLink({ url, type: 'url' } as Linking.EventType);
        }
      });

      // Setup push notifications
      const setupPushNotifications = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const token = await registerForPushNotificationsAsync();
            console.log('Token registrado en inicio:', token);
          }
        } catch (error) {
          console.error('Error al configurar notificaciones:', error);
        }
      };

      await setupPushNotifications();

      // Cleanup function
      return () => {
        linkingSubscription.remove();
        authSubscription.unsubscribe();
      };
    };

    // Initialize everything
    setupListeners();
  }, [fontsLoaded, router]);

  if (!fontsLoaded) {
    return null;
  }

  // Si el usuario está suspendido, mostrar la pantalla de suspensión
  if (isSuspended) {
    return <SuspendedScreen />;
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
