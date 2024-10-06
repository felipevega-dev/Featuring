import "react-native-url-polyfill/auto";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Redirect } from "expo-router";

const Home = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const session = await supabase.auth.getSession();
    setIsSignedIn(!!session.data.session);
  };
  
  if (isSignedIn) {
    //poner dsp de terminar perfiles
    //return <Redirect href="/(root)/(tabs)/home" />;
    return <Redirect href="/(auth)/preguntas" />;

  }

  return <Redirect href="/(auth)/welcome" />;
};

export default Home;
