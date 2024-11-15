import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { ColorSchemeName } from "react-native";
import RootLayout from "../app/(root)/_layout"; // Asegúrate de que la ruta es correcta
import Colors from "@/constants/Colors";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

// Definir temas
const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    ...Colors.dark,
  },
};

const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    ...Colors.light,
  },
};

// Componente de navegación
export default function Navigation({
  colorScheme,
}: {
  colorScheme: ColorSchemeName;
}) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ClerkLoaded>
        <NavigationContainer
          theme={colorScheme === "dark" ? darkTheme : lightTheme}
        >
          <RootLayout />
        </NavigationContainer>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
