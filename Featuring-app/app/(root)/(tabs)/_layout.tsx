import React, { useEffect, useState } from 'react';
import { Tabs, useRouter, useSegments } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { icons, images } from "@/constants";
import { NotificationProvider } from '@/contexts/NotificationContext';
import { useNotification } from '@/contexts/NotificationContext';
import { UnreadMessagesProvider, useUnreadMessages } from '@/contexts/UnreadMessagesContext';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import MenuModal from '@/components/MenuModal';

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
      className={`rounded-full w-8 h-8 items-center justify-center ${focused ? "bg-secondary-300" : ""}`}
    >
      <Image
        source={source}
        tintColor="#6D29D2"
        resizeMode="contain"
        className="w-6 h-6"
      />
    </View>
  </View>
);

// Barra superior personalizada
const TopBar = ({ isMatchScreen }: { isMatchScreen: boolean }) => {
  const router = useRouter();
  const { unreadCount, updateUnreadCount } = useNotification();
  const { unreadMessagesCount, updateUnreadMessagesCount } = useUnreadMessages();

  useEffect(() => {
    const interval = setInterval(() => {
      updateUnreadCount();
      updateUnreadMessagesCount();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView className="bg-[#F6F8FA]">
      <View className="bg-[#F6F8FA] h-15 flex-row justify-between items-center px-5 mt-2 border-b-2 border-b-cyan-200">
        {isMatchScreen ? (
          <TouchableOpacity 
            onPress={() => router.push("/preferencias")}
            className="relative"
          >
            <Ionicons name="settings-outline" size={24} color="#5416A0" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={() => router.push("/(tabs)/notificaciones")} 
            className="relative"
          >
            <Image
              source={icons.bell}
              className="w-7 h-7"
              style={{ tintColor: "#5416A0" }}
            />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 justify-center items-center">
                <Text className="text-white text-xs">{unreadCount > 99 ? '99+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Logo en el centro */}
        <View className="items-center justify-center flex-grow">
          <Image
            source={images.FeatHeader}
            className="w-36 h-14"
            resizeMode="contain"
          />
        </View>

        {/* Icono de Chat */}
        <TouchableOpacity onPress={() => router.push("/(root)/(tabs)/chat")} className="relative">
          <Image
            source={icons.chat}
            className="w-7 h-7"
            style={{ tintColor: "#5416A0" }}
          />
          {unreadMessagesCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 justify-center items-center">
              <Text className="text-white text-xs">{unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Layout general de la aplicación
const Layout = () => {
  const segments = useSegments();
  const isChatScreen = segments.includes('chat' as any);
  const isMatchScreen = segments[1] === 'match';
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  return (
    <NotificationProvider>
      <UnreadMessagesProvider>
        {!isChatScreen && <TopBar isMatchScreen={isMatchScreen} />}
        {/* Barra inferior (Tabs) */}
        <Tabs
          initialRouteName="index"
          screenOptions={{
            tabBarActiveTintColor: "#6D29D2",
            tabBarInactiveTintColor: "#6D29D2",
            tabBarShowLabel: true,
            tabBarStyle: {
              backgroundColor: "white",
              height: 55,
              position: "absolute",
              display: isChatScreen ? 'none' : 'flex',
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
                <View className={`flex flex-row justify-center items-center rounded-full`}>
                  <View className={`rounded-full w-8 h-8 items-center justify-center`}>
                    <Image
                      source={icons.menu}
                      tintColor="#6D29D2"
                      resizeMode="contain"
                      className="w-6 h-6"
                    />
                  </View>
                </View>
              ),
              tabBarButton: (props) => (
                <TouchableOpacity
                  {...props}
                  onPress={() => setIsMenuVisible(true)}
                />
              ),
            }}
          />
          {/* Pantallas que no deben aparecer en la barra de navegación */}
          <Tabs.Screen
            name="chat"
            options={{
              tabBarButton: () => null,
              headerShown: false,
            }}
          />

          <Tabs.Screen
            name="chat/[id]"
            options={{
              tabBarButton: () => null,
              headerShown: false, // Esto ocultará el encabezado por defecto
            }}
          />

          <Tabs.Screen
            name="notificaciones"
            options={{
              tabBarButton: () => null,
              headerShown: false,
            }}
          />
          <Tabs.Screen
            name="colaboraciones"
            options={{
              href: null, // Esto hace que la tab no aparezca en la barra de navegación
              headerShown: false,
              title: "Historial de Colaboraciones",
            }}
          />
          <Tabs.Screen
            name="biblioteca"
            options={{
              href: null, // Esto hace que la tab no aparezca en la barra de navegación
              headerShown: false,
              
            }}
          />
          <Tabs.Screen
            name="preferencias"
            options={{
              href: null, // Esto hace que la tab no aparezca en la barra de navegación
              headerShown: false,
            }}
          />
        </Tabs>

        {currentUserId && (
          <MenuModal
            isVisible={isMenuVisible}
            onClose={() => setIsMenuVisible(false)}
            currentUserId={currentUserId}
          />
        )}
      </UnreadMessagesProvider>
    </NotificationProvider>
  );
};

export default Layout;
