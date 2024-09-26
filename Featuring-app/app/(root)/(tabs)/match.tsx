import { Image, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants";

const Match = () => {
  return (
    <SafeAreaView className="flex-1 bg-white p-5">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Text className="text-2xl font-JakartaBold">Chat</Text>
        <View className="flex-1 h-fit flex justify-center items-center">
          <Image
            source={images.onboarding3}
            alt="message"
            className="w-full h-80"
            resizeMode="contain"
          />
          <Text className="text-3xl font-JakartaBold mt-3">MATCH</Text>
          <Text className="text-base mt-2 text-center px-7">
            AQUI HAY QUE HACER EL MATCH
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Match;
