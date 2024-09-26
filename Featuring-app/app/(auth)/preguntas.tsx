import { ScrollView, View, Text, Image, Alert } from "react-native";
import { useState } from "react";
import InputField from "@/components/InputField";
import CustomButton from "@/components/CustomButton";
import { Link, router } from "expo-router";
import OAuth from "@/components/OAuth";
import { useSignUp } from "@clerk/clerk-expo";
import { ReactNativeModal } from "react-native-modal";
import { supabase } from "@/lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";

const preguntas = () => {
  <SafeAreaView>
    <View>
      <Text>COMPLETAR</Text>
    </View>
  </SafeAreaView>;
};

export default preguntas;
