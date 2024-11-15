import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ReactNativeModal } from 'react-native-modal';
import CustomButton from './CustomButton';
import TermsAndConditionsModal from './TermsAndConditionsModal';
import PrivacyPolicyModal from './PrivacyPolicyModal';

interface LegalAgreementModalProps {
  isVisible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function LegalAgreementModalPremium({
  isVisible,
  onAccept,
  onDecline,
}: LegalAgreementModalProps) {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <>
      <ReactNativeModal 
        isVisible={isVisible}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <View className="bg-white rounded-2xl p-4">
          <Text className="text-xl font-JakartaBold text-center mb-4">
            Términos de Suscripción
          </Text>
          
          <Text className="text-sm font-Jakarta text-general-200 mb-6 text-center">
            Antes de continuar, te invitamos a revisar nuestros términos y política de privacidad.
          </Text>

          <View className="space-y-4 mb-6">
            <TouchableOpacity 
              onPress={() => setShowTerms(true)}
              className="bg-primary-100 p-3 rounded-lg active:opacity-90"
            >
              <Text className="text-primary-700 font-JakartaMedium text-center">
                Ver Términos y Condiciones
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowPrivacy(true)}
              className="bg-primary-100 p-3 rounded-lg active:opacity-90"
            >
              <Text className="text-primary-700 font-JakartaMedium text-center">
                Ver Política de Privacidad
              </Text>
            </TouchableOpacity>
          </View>

          <CustomButton
            title="Comprendo"
            onPress={onDecline}
            className="bg-primary-500 w-full"
          />
        </View>
      </ReactNativeModal>

      <TermsAndConditionsModal
        isVisible={showTerms}
        onAccept={() => setShowTerms(false)}
        onDecline={() => setShowTerms(false)}
      />

      <PrivacyPolicyModal
        isVisible={showPrivacy}
        onAccept={() => setShowPrivacy(false)}
        onDecline={() => setShowPrivacy(false)}
      />
    </>
  );
} 