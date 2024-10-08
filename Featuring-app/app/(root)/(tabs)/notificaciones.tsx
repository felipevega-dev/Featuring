import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants";

const notificaciones = () => {
  const notificacionesMock = [
    { id: '1', titulo: 'Nueva solicitud de amistad', mensaje: 'Juan te ha enviado una solicitud de amistad.' },
    { id: '2', titulo: 'Recordatorio de evento', mensaje: 'Tu evento "Reunión de trabajo" comienza en 1 hora.' },
    { id: '3', titulo: 'Actualización de la aplicación', mensaje: 'Hay una nueva versión disponible. ¡Actualiza ahora!' },
  ];

  const renderNotificacion = ({ item }) => (
    <View className="bg-gray-100 p-4 mb-2 rounded-lg">
      <Text className="font-JakartaBold text-lg">{item.titulo}</Text>
      <Text className="text-gray-600 mt-1">{item.mensaje}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white p-5">
      <Text className="text-2xl font-JakartaBold mb-4">Notificaciones</Text>
      <FlatList
        data={notificacionesMock}
        renderItem={renderNotificacion}
        keyExtractor={item => item.id}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </SafeAreaView>
  );
};

export default notificaciones;
