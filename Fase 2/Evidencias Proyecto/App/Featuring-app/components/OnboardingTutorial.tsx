import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

interface OnboardingTutorialProps {
  isVisible: boolean;
  onClose: () => void;
  userId: string;
}

const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ isVisible, onClose, userId }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const width = Dimensions.get('window').width;
  const height = Dimensions.get('window').height;

  const iconSize = Math.min(width * 0.2, 80);
  const iconContainerSize = Math.min(width * 0.3, 120);
  const fontSize = {
    title: Math.min(width * 0.07, 28),
    description: Math.min(width * 0.045, 16),
    feature: Math.min(width * 0.04, 14),
  };

  const tutorialSlides = [
    {
      title: "¡Bienvenido a Featuring!",
      description: "Tu nueva plataforma para conectar con otros artistas y crear música increíble juntos.",
      icon: "home-outline",
      gradient: ['#6D29D2', '#8B5CF6'],
      features: [
        "Explora perfiles de artistas",
        "Descubre nueva música",
        "Conecta con la comunidad"
      ]
    },
    {
      title: "Explora la Comunidad",
      description: "Una comunidad vibrante de artistas esperando colaborar contigo.",
      icon: "people-outline",
      gradient: ['#2563EB', '#3B82F6'],
      features: [
        "Encuentra artistas por género",
        "Interactúa con publicaciones",
        "Construye tu red musical"
      ]
    },
    {
      title: "Sube tus Canciones",
      description: "Comparte tu música con el mundo y recibe feedback valioso de otros artistas.",
      icon: "cloud-upload-outline",
      gradient: ['#059669', '#10B981'],
      features: [
        "Sube tus mejores tracks",
        "Personaliza la presentación",
        "Recibe comentarios constructivos"
      ]
    },
    {
      title: "Colabora",
      description: "Crea conexiones significativas y produce música junto a otros talentos.",
      icon: "people-circle-outline",
      gradient: ['#DC2626', '#EF4444'],
      features: [
        "Encuentra colaboradores ideales",
        "Trabaja en proyectos conjuntos",
        "Crece como artista"
      ]
    },
    {
      title: "Match Musical",
      description: "Encuentra artistas que comparten tu visión y estilo musical.",
      icon: "musical-notes-outline",
      gradient: ['#D97706', '#FBBF24'],
      features: [
        "Match por géneros musicales",
        "Conecta por habilidades",
        "Descubre artistas cercanos"
      ]
    },
    {
      title: "Sistema de Beneficios",
      description: "Gana recompensas por tu participación activa en la comunidad.",
      icon: "trophy-outline",
      gradient: ['#7C3AED', '#9333EA'],
      features: [
        "Obtén insignias por tus logros",
        "Desbloquea títulos especiales",
        "Gana puntos de reputación",
        "Accede a funciones premium"
      ]
    }
  ];

  const markTutorialAsCompleted = async () => {
    try {
      const { error } = await supabase
        .from('perfil')
        .update({ tutorial_completado: true })
        .eq('usuario_id', userId);
        
      if (error) throw error;
      onClose();
    } catch (error) {
      console.error('Error al marcar tutorial como completado:', error);
    }
  };

  // Cargar fuentes
  const [fontsLoaded] = useFonts({
    'Jakarta-Bold': require('@/assets/fonts/PlusJakartaSans-Bold.ttf'),
    'Jakarta-Medium': require('@/assets/fonts/PlusJakartaSans-Medium.ttf'),
  });

  // Si las fuentes no están cargadas, no mostrar nada
  if (!fontsLoaded) {
    return null;
  }

  return (
    <Modal
      visible={isVisible && fontsLoaded}
      animationType="fade"
      transparent={true}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={tutorialSlides[activeSlide].gradient}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <Carousel
              loop={false}
              width={width}
              height={height * 0.75}
              data={tutorialSlides}
              onSnapToItem={setActiveSlide}
              renderItem={({ item }) => (
                <View style={styles.slide}>
                  <View style={[
                    styles.iconContainer,
                    { 
                      width: iconContainerSize,
                      height: iconContainerSize,
                      borderRadius: iconContainerSize / 2,
                      marginBottom: height * 0.02
                    }
                  ]}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={iconSize}
                      color="white"
                    />
                  </View>

                  <Text style={[styles.title, { fontSize: fontSize.title }]}>
                    {item.title}
                  </Text>

                  <Text style={[styles.description, { fontSize: fontSize.description }]}>
                    {item.description}
                  </Text>

                  <View style={[styles.featuresContainer, { maxHeight: height * 0.3 }]}>
                    {item.features.map((feature, index) => (
                      <View 
                        key={index} 
                        style={[
                          styles.featureItem,
                          { padding: Math.min(width * 0.03, 16) }
                        ]}
                      >
                        <Ionicons 
                          name="checkmark-circle" 
                          size={Math.min(width * 0.05, 20)} 
                          color="#4ADE80" 
                        />
                        <Text style={[
                          styles.featureText,
                          { fontSize: fontSize.feature }
                        ]}>
                          {feature}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            />

            <View style={[styles.navigationContainer, { paddingBottom: height * 0.03 }]}>
              <View style={styles.pagination}>
                {tutorialSlides.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      activeSlide === index && styles.paginationDotActive
                    ]}
                  />
                ))}
              </View>

              {activeSlide === tutorialSlides.length - 1 ? (
                <TouchableOpacity
                  onPress={markTutorialAsCompleted}
                  style={[styles.button, { paddingVertical: height * 0.02 }]}
                >
                  <Text style={[styles.buttonText, { fontSize: fontSize.description }]}>
                    ¡Comenzar Ahora!
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => setActiveSlide(tutorialSlides.length - 1)}
                  style={[styles.skipButton, { paddingVertical: height * 0.02 }]}
                >
                  <Text style={[styles.skipButtonText, { fontSize: fontSize.feature }]}>
                    Saltar Tutorial
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: Dimensions.get('window').height * 0.05,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Dimensions.get('window').width * 0.05,
    justifyContent: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontFamily: 'Jakarta-Bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: Dimensions.get('window').height * 0.01,
  },
  description: {
    fontFamily: 'Jakarta-Medium',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: Dimensions.get('window').height * 0.02,
    lineHeight: 24,
  },
  featuresContainer: {
    width: '100%',
    paddingHorizontal: Dimensions.get('window').width * 0.05,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 12,
    fontFamily: 'Jakarta-Medium',
    color: 'white',
  },
  navigationContainer: {
    paddingHorizontal: Dimensions.get('window').width * 0.05,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Dimensions.get('window').height * 0.02,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: 'white',
    width: 20,
  },
  button: {
    backgroundColor: 'white',
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontFamily: 'Jakarta-Bold',
    color: '#6D29D2',
  },
  skipButton: {
    alignItems: 'center',
  },
  skipButtonText: {
    fontFamily: 'Jakarta-Medium',
    color: 'white',
    opacity: 0.8,
  },
});

export default OnboardingTutorial; 