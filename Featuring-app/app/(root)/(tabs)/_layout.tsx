import { Tabs, useRouter } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { icons, images } from "@/constants";

// Componente para los íconos en la barra inferior
const TabIcon = ({
  source,
  focused,
}: {
  source: ImageSourcePropType;
  focused: boolean;
}) => (
  <View
    className={`flex flex-row justify-center items-center rounded-full ${focused ? "bg-general-400" : ""}`}
  >
    <View
      className={`rounded-full w-8 h-8 items-center justify-center ${focused ? "bg-secondary-400" : ""}`}
    >
      <Image
        source={source}
        tintColor="white"
        resizeMode="contain"
        className="w-6 h-6"
      />
    </View>
  </View>
);

// Barra superior personalizada
const TopBar = () => {
  const router = useRouter();

  // @ts-ignore
  // @ts-ignore
  return (
    <SafeAreaView className="bg-[#F6F8FA]">
      <View className="bg-[#F6F8FA] h-15 flex-row justify-between items-center px-5 mt-2 border-b-2 border-b-cyan-200">
        {/* Icono de Notificaciones */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/notificaciones")}
        >
          <Image
            source={icons.bell}
            className="w-7 h-7"
            style={{ tintColor: "#5416A0" }}
          />
        </TouchableOpacity>

        {/* Logo en el centro */}
        <View className="items-center justify-center flex-grow">
          <Image
            source={images.FeatHeader} // Aquí debes agregar tu logo en el archivo de constantes
            className="w-36 h-14"
            resizeMode="contain"
          />
        </View>

        {/* Icono de Chat */}
        <TouchableOpacity onPress={() => router.push("/(root)/(tabs)/chat")}>
          <Image
            source={icons.chat}
            className="w-7 h-7"
            style={{ tintColor: "#5416A0" }}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Layout general de la aplicación
const Layout = () => {
  return (
    <>
      {/* Barra superior */}
      <TopBar />

      {/* Barra inferior (Tabs) */}
      <Tabs
        initialRouteName="index"
        screenOptions={{
          tabBarActiveTintColor: "#00BFA5",
          tabBarInactiveTintColor: "white",
          tabBarShowLabel: true,
          tabBarStyle: {
            backgroundColor: "#5416A0",
            height: 55,
            position: "absolute",
          },
          tabBarLabelStyle: {
            fontSize: 10, // Ajusta el tamaño de la fuente
            marginTop: -8, // Ajusta el espacio entre el ícono y el texto
            marginBottom: 3,
            fontWeight: "bold",
          },
          tabBarIconStyle: {
            marginBottom: 5, // Ajusta el espacio entre el ícono y el texto
            marginTop: 3,
          },
        }}
      >
        <Tabs.Screen
          name="comunidad"
          options={{
            title: "Comunidad",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} source={icons.community} />
            ),
          }}
        />
        <Tabs.Screen
          name="watch"
          options={{
            title: "Watch",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} source={icons.watch} />
            ),
          }}
        />
        <Tabs.Screen
          name="home"
          options={{
            title: "Inicio",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} source={icons.home} />
            ),
          }}
        />

        <Tabs.Screen
          name="match"
          options={{
            title: "Colaborar",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} source={icons.globe} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Menú",
            headerShown: false,
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} source={icons.profile} />
            ),
          }}
        />
        {/* Excluir las pantallas de notificaciones y chat de la barra inferior */}
        <Tabs.Screen
          name="notificaciones"
          options={{
            tabBarButton: () => null, // Esto excluye la pantalla de la barra inferior
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            tabBarButton: () => null, // Esto excluye la pantalla de la barra inferior
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="chatDetail"
          options={{
            tabBarButton: () => null, // Esto excluye la pantalla de la barra inferior
            headerShown: false,
          }}
        />
      </Tabs>
    </>
  );
};

export default Layout;
