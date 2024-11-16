import Constants from 'expo-constants';

const ENV = {
  EXCHANGE_RATE_API_KEY: Constants.expoConfig?.extra?.exchangeRateApiKey || '',
};

export default ENV; 