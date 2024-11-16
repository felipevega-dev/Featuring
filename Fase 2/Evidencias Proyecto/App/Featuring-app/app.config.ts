import { ExpoConfig, ConfigContext } from "@expo/config";
import * as dotenv from "dotenv";

dotenv.config();

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  slug: "featuring-app",
  name: "Featuring-app",
  extra: {
    ...config.extra,
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    exchangeRateApiKey: process.env.EXCHANGE_RATE_API_KEY,
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    eas: {
      projectId: "3c032550-ab89-4b62-aadf-92576aa5ee1d",
    },
  },
  plugins: [...(config.plugins || [])],
});
