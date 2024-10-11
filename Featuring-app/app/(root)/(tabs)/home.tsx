import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, Image, ScrollView } from "react-native";
import { icons } from "@/constants";

interface Update {
  id: number;
  title: string;
  date: string;
  features: string[];
  icon: keyof typeof icons;
}

const updates: Update[] = [
  {
    id: 1,
    title: "Colaborar",
    date: "11 de Octubre, 2023",
    features: [
      "Búsqueda de colaboradores musicales",
      "Filtros por género y habilidades",
      "Sistema de matching para colaboraciones",
      "Solicitudes de colaboración",
    ],
    icon: "globe",
  },
  {
    id: 2,
    title: "Watch",
    date: "5 de Octubre, 2023",
    features: [
      "Transmisiones en vivo de performances",
      "Interacción en tiempo real con la audiencia",
      "Programación de eventos en vivo",
      "Notificaciones de transmisiones de artistas seguidos",
    ],
    icon: "watch",
  },
  {
    id: 3,
    title: "Chat y Mensajería",
    date: "28 de Septiembre, 2023",
    features: [
      "Implementación de chat en tiempo real",
      "Envío de mensajes de texto y audio",
      "Eliminación de mensajes",
      "Lista de conversaciones activas",
    ],
    icon: "chat",
  },
  {
    id: 4,
    title: "Comunidad Musical",
    date: "15 de Septiembre, 2023",
    features: [
      "Subida y reproducción de canciones",
      "Comentarios y likes en publicaciones",
      "Perfil de usuario mejorado",
      "Exploración de contenido musical",
    ],
    icon: "community",
  },
  {
    id: 5,
    title: "Perfil de Usuario",
    date: "1 de Septiembre, 2023",
    features: [
      "Edición de información personal",
      "Carga de foto de perfil",
      "Gestión de géneros musicales",
      "Gestión de habilidades musicales",
    ],
    icon: "profile",
  },
];

const UpdateCard = ({ update }: { update: Update }) => (
  <View className="bg-white rounded-xl shadow-lg p-6 mb-6">
    <View className="flex-row items-center mb-3">
      <Image
        source={icons[update.icon]}
        className="w-8 h-8 mr-3"
        style={{ tintColor: "#6D29D2" }}
      />
      <Text className="text-primary-600 text-xl font-bold">{update.title}</Text>
    </View>
    <Text className="text-primary-400 text-sm mb-3">{update.date}</Text>
    <View className="ml-11">
      {update.features.map((feature, index) => (
        <Text key={index} className="text-primary-500 text-base mb-2">
          • {feature}
        </Text>
      ))}
    </View>
  </View>
);

const Inicio = () => {
  return (
    <View className="flex-1 bg-primary-100">
      <View className="bg-primary-500 shadow-md py-4 px-6 mb-4">
        <View className="flex flex-row justify-center items-center mb-2 ">
          <Text className="text-white text-3xl font-bold mr-2">
            Actualizaciones
          </Text>
          <Image
            source={icons.features}
            className="w-8 h-8"
            style={{ tintColor: "#00BFA5" }}
          />
        </View>
        <Text className="text-secondary-400 text-xl font-semibold text-center">
          Featuring V.1.0
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 mb-14">
        {updates.map((update) => (
          <UpdateCard key={update.id} update={update} />
        ))}
      </ScrollView>
    </View>
  );
};

export default Inicio;
