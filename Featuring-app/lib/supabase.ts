import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import { Database } from "@/types/db_types";
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = Constants?.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants?.expoConfig?.extra?.supabaseAnonKey;

const customStorageAdapter = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage:customStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });