import * as SecureStore from "expo-secure-store";
import * as Linking from "expo-linking";
import { fetchAPI } from "@/lib/fetch";

export const tokenCache = {
  async getToken(key: string) {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`${key} was used 🔐 \n`);
      } else {
        console.log("No values stored under key: " + key);
      }
      return item;
    } catch (error) {
      console.error("SecureStore get item error: ", error);
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },

  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error("Error saving token: ", err);
      return;
    }
  },
};

export const googleOAuth = async (startOAuthFlow: any) => {
  try {
    const { createdSessionId, setActive, signUp } = await startOAuthFlow({
      redirectUrl: Linking.createURL("/(auth)/preguntas"),
    });

    if (createdSessionId) {
      if (setActive) {
        await setActive({ session: createdSessionId });

        if (signUp?.createdUserId) {
          const username =
            signUp?.username || `${signUp?.firstName} ${signUp?.lastName}`; // Ajusta esto según la respuesta

          await fetchAPI("/(api)/user", {
            method: "POST",
            body: JSON.stringify({
              username,
              email: signUp.emailAddress,
              clerkId: signUp.createdUserId,
            }),
          });
        }

        return {
          success: true,
          message: "Te has registrado correctamente usando Google.",
        };
      }
    }

    return {
      success: false,
      message: "Ha ocurrido un error al intentar registrarse con Google.",
    };
  } catch (err: any) {
    console.error("Google OAuth error: ", err);
    return {
      success: false,
      code: err.code || "UNKNOWN_ERROR",
      message:
        err?.errors?.[0]?.longMessage ||
        "Error desconocido. Intenta nuevamente.",
    };
  }
};
