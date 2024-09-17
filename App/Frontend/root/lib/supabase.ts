import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ieptfdhimqlwkpazklvp.supabase.co/"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllcHRmZGhpbXFsd2twYXprbHZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY1MjEyODcsImV4cCI6MjA0MjA5NzI4N30.hR56cykbgJwsOk9lx0Ylj3aoxJn44CL5MqbNh-GwBIw"

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})