import "react-native-url-polyfill/auto";
import { Redirect } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

const Home = () => {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    //poner dsp de terminar perfiles
    //return <Redirect href="/(root)/(tabs)/home" />;
    return <Redirect href="/(auth)/preguntas" />;

  }

  return <Redirect href="/(auth)/welcome" />;
};

export default Home;
