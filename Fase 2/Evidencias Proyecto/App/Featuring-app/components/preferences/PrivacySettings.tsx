import React from 'react';
import { View, Text, Switch } from 'react-native';
import { PrivacySettings } from '@/lib/privacy';

interface PrivacySettingsProps {
  settings: PrivacySettings;
  onToggle: (setting: keyof PrivacySettings) => void;
}

export const PrivacySettingsSection: React.FC<PrivacySettingsProps> = ({
  settings,
  onToggle
}) => {
  return (
    <View className="bg-white rounded-lg p-4">
      <Text className="text-lg font-bold mb-4 text-primary-600">
        Privacidad del perfil
      </Text>
      
      <View className="space-y-4">
        <View className="flex-row justify-between items-start space-x-4">
          <View className="flex-1 flex-shrink">
            <Text className="text-base font-medium break-words">Mostrar Edad</Text>
            <Text className="text-sm text-gray-500 break-words">
              Tu edad será visible en tu perfil
            </Text>
          </View>
          <Switch
            value={settings.mostrar_edad}
            onValueChange={() => onToggle('mostrar_edad')}
          />
        </View>

        <View className="flex-row justify-between items-start space-x-4">
          <View className="flex-1 flex-shrink">
            <Text className="text-base font-medium break-words">Mostrar Ubicación</Text>
            <Text className="text-sm text-gray-500 break-words">
              Tu ubicación será visible en tu perfil
            </Text>
          </View>
          <Switch
            value={settings.mostrar_ubicacion}
            onValueChange={() => onToggle('mostrar_ubicacion')}
          />
        </View>

        <View className="flex-row justify-between items-start space-x-4">
          <View className="flex-1 flex-shrink">
            <Text className="text-base font-medium break-words">Mostrar Redes Sociales</Text>
            <Text className="text-sm text-gray-500 break-words">
              Tus redes sociales serán visibles en tu perfil
            </Text>
          </View>
          <Switch
            value={settings.mostrar_redes_sociales}
            onValueChange={() => onToggle('mostrar_redes_sociales')}
          />
        </View>

        <View className="flex-row justify-between items-start space-x-4">
          <View className="flex-1 flex-shrink">
            <Text className="text-base font-medium break-words">Mostrar Valoraciones</Text>
            <Text className="text-sm text-gray-500 break-words">
              Tus valoraciones serán visibles en tu perfil
            </Text>
          </View>
          <Switch
            value={settings.mostrar_valoraciones}
            onValueChange={() => onToggle('mostrar_valoraciones')}
          />
        </View>
      </View>
    </View>
  );
}; 