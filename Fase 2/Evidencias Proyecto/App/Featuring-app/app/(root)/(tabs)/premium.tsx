import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, RefreshControl } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { icons } from "@/constants";
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import LegalAgreementModalPremium from '@/components/LegalAgreementModalPremium';
import { hispanicCountryCodes } from "@/utils/countryCodes";
import ENV from '@/config/env';
import { useLocation } from '@/hooks/useLocation';

interface PlanFeature {
  title: string;
  included: boolean;
}

interface PremiumPlan {
  name: string;
  monthlyPrice: number;
  months: number;
  features: PlanFeature[];
  recommended?: boolean;
  color: string[];
  trialDays: number;
}

interface TasaCambio {
  tasa: number;
  moneda: string;
  simbolo: string;
  decimales: number;
}

// Interfaz para la respuesta de la API
interface ExchangeRateResponse {
  conversion_rates: {
    [key: string]: number;
  };
}

const CURRENCY_CODES: { [key: string]: string } = {
  "Chile": "CLP",
  "Argentina": "ARS",
  "Bolivia": "BOB",
  "Colombia": "COP",
  "Costa Rica": "CRC",
  "Cuba": "CUP",
  "Ecuador": "USD",
  "El Salvador": "USD",
  "España": "EUR",
  "Guatemala": "GTQ",
  "Honduras": "HNL",
  "México": "MXN",
  "Nicaragua": "NIO",
  "Panamá": "USD",
  "Paraguay": "PYG",
  "Perú": "PEN",
  "Puerto Rico": "USD",
  "República Dominicana": "DOP",
  "Uruguay": "UYU",
  "Venezuela": "VES"
};

const CURRENCY_FORMATS: { [key: string]: { symbol: string, decimals: number } } = {
  CLP: { symbol: "$", decimals: 0 },
  ARS: { symbol: "ARS$", decimals: 0 },
  BOB: { symbol: "Bs", decimals: 2 },
  COP: { symbol: "COL$", decimals: 0 },
  CRC: { symbol: "₡", decimals: 0 },
  CUP: { symbol: "₱", decimals: 2 },
  USD: { symbol: "US$", decimals: 2 },
  EUR: { symbol: "€", decimals: 2 },
  GTQ: { symbol: "Q", decimals: 2 },
  HNL: { symbol: "L", decimals: 2 },
  MXN: { symbol: "MX$", decimals: 2 },
  NIO: { symbol: "C$", decimals: 2 },
  PYG: { symbol: "₲", decimals: 0 },
  PEN: { symbol: "S/", decimals: 2 },
  DOP: { symbol: "RD$", decimals: 2 },
  UYU: { symbol: "$U", decimals: 2 },
  VES: { symbol: "Bs.D", decimals: 2 }
};

const basePlans: PremiumPlan[] = [
  {
    name: "Mensual",
    monthlyPrice: 4000,
    months: 1,
    color: ['#4A148C', '#6D29D2'],
    trialDays: 7,
    features: [
      { title: "Mensajes directos sin conexión", included: true },
      { title: "Sin anuncios", included: true },
      { title: "Swipes ilimitados", included: true },
      { title: "Destacar canciones (2 semanas)", included: true },
      { title: "Chat prioritario", included: false },
    ]
  },
  {
    name: "Semestral",
    monthlyPrice: 3590,
    months: 6,
    color: ['#00796B', '#00BFA5'],
    recommended: true,
    trialDays: 7,
    features: [
      { title: "Mensajes directos sin conexión", included: true },
      { title: "Sin anuncios", included: true },
      { title: "Super Rock! (10 unidades)", included: true },
      { title: "Swipes ilimitados", included: true },
      { title: "Destacar canciones (1 mes)", included: true },
      { title: "Chat prioritario", included: true },
      { title: "Estadísticas avanzadas", included: true }
    ]
  },
  {
    name: "Anual",
    monthlyPrice: 3190,
    months: 12,
    color: ['#C2185B', '#FF4081'],
    trialDays: 7,
    features: [
      { title: "Mensajes directos sin conexión", included: true },
      { title: "Super Rock! (20 unidades)", included: true },
      { title: "Sin anuncios", included: true },
      { title: "Swipes ilimitados", included: true },
      { title: "Destacar canciones (2 meses)", included: true },
      { title: "Chat prioritario", included: true },
      { title: "Colaboraciones ilimitadas", included: true },
      { title: "Insignia premium", included: true },
      { title: "Estadísticas avanzadas", included: true }
    ]
  }
];

const PremiumScreen = () => {
  const [userCountry, setUserCountry] = useState<string>("Chile");
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [currencyFormat, setCurrencyFormat] = useState(CURRENCY_FORMATS.CLP);
  const [hasUsedTrial, setHasUsedTrial] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { requestLocationPermission } = useLocation();

  useEffect(() => {
    checkUserLocation();
    checkTrialStatus();
  }, []);

  useEffect(() => {
    if (userCountry) {
      fetchExchangeRate();
    }
  }, [userCountry]);

  const fetchExchangeRate = async () => {
    try {
      const currencyCode = CURRENCY_CODES[userCountry] || "CLP";
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${ENV.EXCHANGE_RATE_API_KEY}/latest/CLP`
      );
      
      if (!response.ok) {
        throw new Error('Error fetching exchange rates');
      }
      
      const data: ExchangeRateResponse = await response.json();
      
      if (data.conversion_rates) {
        const rate = data.conversion_rates[currencyCode] || 1;
        
        setExchangeRate(rate);
        setCurrencyFormat(CURRENCY_FORMATS[currencyCode] || CURRENCY_FORMATS.CLP);
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      setExchangeRate(1);
      setCurrencyFormat(CURRENCY_FORMATS.CLP);
    }
  };

  const checkUserLocation = async () => {
    try {
      const locationData = await requestLocationPermission();
      if (locationData?.ubicacion) {
        const country = locationData.ubicacion.split(',').pop()?.trim();
        
        const countryMapping: { [key: string]: string } = {
          'Argentina': 'Argentina',
          'Bolivia': 'Bolivia',
          'Chile': 'Chile',
          'Colombia': 'Colombia',
          'Costa Rica': 'Costa Rica',
          'Cuba': 'Cuba',
          'Ecuador': 'Ecuador',
          'El Salvador': 'El Salvador',
          'España': 'España',
          'Guatemala': 'Guatemala',
          'Honduras': 'Honduras',
          'México': 'México',
          'Nicaragua': 'Nicaragua',
          'Panamá': 'Panamá',
          'Paraguay': 'Paraguay',
          'Perú': 'Perú',
          'Puerto Rico': 'Puerto Rico',
          'República Dominicana': 'República Dominicana',
          'Uruguay': 'Uruguay',
          'Venezuela': 'Venezuela'
        };

        const matchedCountry = countryMapping[country || ''] || 'Chile';
        setUserCountry(matchedCountry);
      }
    } catch (error) {
      console.error('Error getting user location:', error);
      setUserCountry("Chile");
    }
  };

  const checkTrialStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: trialHistory } = await supabase
        .from('historial_premium')
        .select('*')
        .eq('perfil_id', user.id)
        .eq('motivo', 'trial')
        .single();

      setHasUsedTrial(!!trialHistory);
    } catch (error) {
      console.error('Error checking trial status:', error);
    }
  };

  const handleSubscribe = async (plan: PremiumPlan) => {
    setSelectedPlan(plan);
    setShowLegalModal(true);
  };

  const handleAcceptLegal = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/(auth)/sign-in");
        return;
      }

      if (!selectedPlan) return;

      // Aquí implementarías la lógica de pago
      console.log(`Suscribiendo a plan ${selectedPlan.name}`);
      
      // Después del pago exitoso, registrar en historial_premium
      const { data, error } = await supabase
        .from('historial_premium')
        .insert({
          perfil_id: user.id,
          fecha_inicio: new Date().toISOString(),
          fecha_fin: new Date(Date.now() + selectedPlan.months * 30 * 24 * 60 * 60 * 1000).toISOString(),
          motivo: hasUsedTrial ? 'subscription' : 'trial',
          nivel: selectedPlan.months === 12 ? 'oro' : selectedPlan.months === 6 ? 'plata' : 'bronce'
        });

      if (error) throw error;

      // Actualizar el estado premium del usuario
      await supabase
        .from('perfil')
        .update({
          is_premium: true,
          premium_until: new Date(Date.now() + selectedPlan.months * 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('usuario_id', user.id);

      setShowLegalModal(false);
      // Aquí podrías mostrar un mensaje de éxito o redirigir

    } catch (error) {
      console.error('Error en la suscripción:', error);
      setShowLegalModal(false);
    }
  };

  const formatPrice = (amount: number): string => {
    const convertedAmount = amount * exchangeRate;
    return `${currencyFormat.symbol}${convertedAmount.toFixed(currencyFormat.decimals)}`;
  };

  const PlanCard = ({ plan, index }: { plan: PremiumPlan; index: number }) => {
    const monthlyPrice = plan.monthlyPrice;
    const totalPrice = monthlyPrice * plan.months;

    return (
      <Animated.View
        entering={SlideInRight.delay(200 * index)}
        className={`mb-6 rounded-xl overflow-hidden ${plan.recommended ? 'scale-105' : ''}`}
      >
        <LinearGradient
          colors={plan.color}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="p-4"
        >
          {plan.recommended && (
            <View className="absolute top-4 right-4 bg-white/20 px-2 py-1 rounded-full">
              <Text className="text-white text-xs font-JakartaBold">
                Mejor valor
              </Text>
            </View>
          )}

          <Text className="text-white text-xl font-JakartaBold mb-2">
            {plan.name}
          </Text>
          
          <View className="mb-4">
            <View className="flex-row items-baseline">
              <Text className="text-white text-3xl font-JakartaBold">
                {formatPrice(monthlyPrice)}
              </Text>
              <Text className="text-white/80 ml-1">
                /mes
              </Text>
            </View>
            {plan.months > 1 && (
              <Text className="text-white/80 text-sm mt-1">
                Total: {formatPrice(totalPrice)}
              </Text>
            )}
            {!hasUsedTrial && (
              <Text className="text-white/90 text-sm mt-2 bg-white/20 p-2 rounded-lg">
                Incluye {plan.trialDays} días de prueba gratis
              </Text>
            )}
          </View>

          <View className="space-y-2">
            {plan.features.map((feature, idx) => (
              <View key={idx} className="flex-row items-center">
                <Image
                  source={icons.checkmark}
                  className="w-5 h-5 mr-2"
                  style={{ tintColor: 'white' }}
                />
                <Text className="text-white/90">
                  {feature.title}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => handleSubscribe(plan)}
            className="bg-white mt-4 py-3 rounded-lg active:opacity-90"
          >
            <Text className="text-center font-JakartaBold" 
              style={{ color: plan.color[0] }}>
              {!hasUsedTrial ? "Comenzar prueba gratis" : "Elegir plan"}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    );
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        checkUserLocation(),
        checkTrialStatus(),
        fetchExchangeRate()
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <>
      <ScrollView 
        className="flex-1 bg-primary-50"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6D29D2"
            colors={['#6D29D2']}
          />
        }
      >
        <LinearGradient
          colors={['#6D29D2', '#4A148C']}
          className="px-6 py-8"
        >
          <Animated.View entering={FadeInDown.delay(100)}>
            <Text className="text-white text-3xl font-JakartaBold mb-2">
              Premium
            </Text>
            <Text className="text-white/80 text-lg">
              Lleva tu música al siguiente nivel
            </Text>
          </Animated.View>
        </LinearGradient>

        <View className="p-4">
          {basePlans.map((plan, index) => (
            <PlanCard key={plan.name} plan={plan} index={index} />
          ))}

          <Animated.View 
            entering={FadeInDown.delay(800)}
            className="mb-20"
          >
            <Text className="text-center text-primary-700 text-sm mb-2">
              Al suscribirte aceptas nuestros
            </Text>
            <View className="flex-row justify-center">
              <TouchableOpacity onPress={() => setShowLegalModal(true)}>
                <Text className="text-primary-500 text-sm font-JakartaBold">
                  Términos y Condiciones
                </Text>
              </TouchableOpacity>
              <Text className="text-primary-700 text-sm mx-1">y</Text>
              <TouchableOpacity onPress={() => setShowLegalModal(true)}>
                <Text className="text-primary-500 text-sm font-JakartaBold">
                  Política de Privacidad
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </ScrollView>

      <LegalAgreementModalPremium
        isVisible={showLegalModal}
        onAccept={handleAcceptLegal}
        onDecline={() => {
          setShowLegalModal(false);
          setSelectedPlan(null);
        }}
      />
    </>
  );
};

export default PremiumScreen;
