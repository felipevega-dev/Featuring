import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants";

const Watch = () => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <Text className="text-center text-2xl font-JakartaBold">Watch</Text>
      <View className="flex-1 h-fit flex justify-center items-center">
        <Image
          source={images.onboarding1}
          alt="message"
          className="w-full h-80"
          resizeMode="contain"
        />
        <Text className="text-3xl font-JakartaBold mt-3">WATCH</Text>
        <Text className="text-base mt-2 text-center px-7">
          AQUI HAY QUE HACER EL WATCH
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default Watch;
