import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import "react-native-reanimated";
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';
import { CollaborationProvider } from '../contexts/CollaborationContext';
import { supabase } from '@/lib/supabase';
import { useSuspensionCheck } from '@/hooks/useSuspensionCheck';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  try {
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
    const { isSuspended, suspensionDetails } = useSuspensionCheck();

    useEffect(() => {
      if (fontsLoaded) {
        SplashScreen.hideAsync().catch(console.error);
      }
    }, [fontsLoaded]);

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
  } catch (error) {
    console.error('Error en RootLayout:', error);
    return null;
  }
}
