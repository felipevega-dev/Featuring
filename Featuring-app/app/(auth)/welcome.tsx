import { Text, TouchableOpacity, View, Image, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Swiper from "react-native-swiper";
import { useRef, useState } from "react";
import { onboarding } from "@/constants";
import CustomButton from "@/components/CustomButton";

const Onboarding = () => {
  const swiperRef = useRef<Swiper>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isLastSlide = activeIndex === onboarding.length - 1;
  const { width, height } = useWindowDimensions();

  const getImageSize = () => {
    if (width < 640) return "h-[250px]";
    if (width < 768) return "h-[300px]";
    return "h-[350px]";
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <TouchableOpacity
        onPress={() => router.replace("/(auth)/sign-up")}
        className="absolute top-5 right-0 p-5 z-10"
      >
        <Text className="text-secondary-500 text-lg font-JakartaBold">Saltar</Text>
      </TouchableOpacity>

      <View className="flex-1">
        <Swiper
          ref={swiperRef}
          loop={false}
          dot={<View className="w-[32px] h-[4px] mx-1 bg-[#E2E8F0] rounded-full" />}
          activeDot={<View className="w-[32px] h-[4px] mx-1 bg-[#6D29D2] rounded-full" />}
          onIndexChanged={(index) => setActiveIndex(index)}
          showsButtons={false}
        >
          {onboarding.map((item) => (
            <View key={item.id} className="flex-1 items-center justify-center px-5">
              <Image
                source={item.image}
                className={`w-full ${getImageSize()} poco-c65:h-[270px]`}
                resizeMode="contain"
              />
              <View className="mt-12 w-full">
                <Text className="text-black text-3xl sm:text-4xl font-bold text-center px-5">
                  {item.title}
                </Text>
              </View>
              <Text className="text-lg sm:text-xl font-JakartaSemiBold text-center text-[#858585] mt-4 px-5">
                {item.description}
              </Text>
            </View>
          ))}
        </Swiper>
      </View>

      <View className="px-5 pb-12">
        <CustomButton
          title={isLastSlide ? "Comencemos" : "Siguiente"}
          onPress={() =>
            isLastSlide
              ? router.replace("/(auth)/sign-up")
              : swiperRef.current?.scrollBy(1)
          }
          className="w-full"
        />
      </View>
    </SafeAreaView>
  );
};

export default Onboarding;
