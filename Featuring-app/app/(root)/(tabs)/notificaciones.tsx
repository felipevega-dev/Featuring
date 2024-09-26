import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants";

const notificaciones = () => {
  return (
    <SafeAreaView className="flex-1 bg-white p-5 mb-5">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Text className="text-2xl font-JakartaBold">Notificaciones</Text>
        <View className="flex-1 flex justify-center items-center mb-4">
          <Image
            source={images.onboarding5}
            alt="message"
            className="w-full h-80"
            resizeMode="contain"
          />
          <Text className="text-3xl font-JakartaBold mt-3">NOTIS</Text>
          <Text className="text-base mt-2 text-center px-7">
            AQUI HAY QUE HACER LAS NOTIS
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default notificaciones;
