import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/(auth)/preguntas');
      } else {
        router.replace('/sign-in');
      }
    });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Procesando autenticación...</Text>
    </View>
  );
}
