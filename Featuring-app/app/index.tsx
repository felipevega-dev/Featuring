import "react-native-url-polyfill/auto";
import { useEffect } from "react";
import { Redirect, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        // Verificar si el perfil está completo
        const { data: profile } = await supabase
          .from("perfil")
          .select("username")
          .eq("usuario_id", session.user.id)
          .maybeSingle();

        if (profile?.username) {
          router.replace("/(root)/(tabs)/home");
        } else {
          router.replace("/(auth)/preguntas");
        }
      } else {
        router.replace("/(auth)/welcome");
      }
    } catch (error) {
      console.error("Error checking session:", error);
      router.replace("/(auth)/welcome");
    }
  };

  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
}
