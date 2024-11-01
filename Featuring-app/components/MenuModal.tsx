import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useCollaboration } from '@/contexts/CollaborationContext';
import UserSongsModal from './UserSongsModal';

interface MenuModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentUserId: string;
}

const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.6;

export default function MenuModal({
  isVisible,
  onClose,
  currentUserId,
}: MenuModalProps) {
  const slideAnim = useRef(new Animated.Value(width)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [isUserSongsModalVisible, setIsUserSongsModalVisible] = useState(false);
  const { pendingCollaborations } = useCollaboration();

  React.useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.7,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: width,
          useNativeDriver: true
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [isVisible]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dx > 0) {
        slideAnim.setValue(gestureState.dx);
        const opacity = 1 - (gestureState.dx / DRAWER_WIDTH);
        backdropOpacity.setValue(opacity);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > DRAWER_WIDTH / 3) {
        onClose();
      } else {
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true
          }),
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          })
        ]).start();
      }
    }
  });

  const handleSignOut = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sí, cerrar sesión",
          style: "destructive",
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/(auth)/sign-in');
          }
        }
      ]
    );
  };

  const menuItems = [
    {
      icon: 'person-outline',
      label: 'Mi Perfil',
      onPress: () => {
        onClose();
        router.push("/(root)/(tabs)/profile");
      }
    },
    {
      icon: 'library-outline',
      label: 'Mi Biblioteca',
      onPress: () => {
        onClose();
        router.push("/biblioteca");
      }
    },
    {
      icon: 'people-outline',
      label: 'Colaboraciones',
      badge: pendingCollaborations > 0 ? pendingCollaborations : undefined,
      onPress: () => {
        onClose();
        router.push("/colaboraciones");
      }
    },
    {
      icon: 'log-out-outline',
      label: 'Cerrar Sesión',
      onPress: handleSignOut,
      danger: true
    }
  ];

  if (!isVisible) return null;

  return (
    <>
      <Modal
        transparent
        visible={isVisible}
        onRequestClose={onClose}
        animationType="none"
      >
        <View className="flex-1">
          <TouchableOpacity
            activeOpacity={1}
            onPress={onClose}
            className="absolute inset-0"
          >
            <View className="absolute inset-0 bg-black/70" />
          </TouchableOpacity>

          <Animated.View
            {...panResponder.panHandlers}
            className="absolute right-0 bg-white shadow-xl"
            style={{
              width: DRAWER_WIDTH,
              top: 90,
              bottom: 70,
              transform: [{ translateX: slideAnim }],
              borderTopLeftRadius: 20,
              borderBottomLeftRadius: 20,
              borderLeftWidth: 2,
              borderTopWidth: 2,
              borderBottomWidth: 2,
              borderColor: '#00BFA5',
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              className="flex-1"
            >
              <View className="flex-1 p-4">
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-xl font-bold">Menú</Text>
                  <TouchableOpacity onPress={onClose}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {menuItems.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={item.onPress}
                    className={`flex-row items-center py-4 ${
                      index < menuItems.length - 1 ? 'border-b border-gray-200' : ''
                    }`}
                  >
                    <View className="relative">
                      <Ionicons
                        name={item.icon as any}
                        size={24}
                        color={item.danger ? '#DC2626' : '#6D29D2'}
                      />
                      {item.badge && (
                        <View className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                          <Text className="text-white text-xs font-bold">
                            {item.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      className={`ml-4 text-lg ${
                        item.danger ? 'text-red-600' : 'text-gray-800'
                      }`}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <UserSongsModal
        isVisible={isUserSongsModalVisible}
        onClose={() => setIsUserSongsModalVisible(false)}
        userId={currentUserId}
      />
    </>
  );
} 