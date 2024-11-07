import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { ReactNativeModal } from 'react-native-modal';
import CustomButton from './CustomButton';
import CustomCheckbox from './CustomCheckbox';
import TermsAndConditionsModal from './TermsAndConditionsModal';
import PrivacyPolicyModal from './PrivacyPolicyModal';

interface LegalAgreementModalProps {
  isVisible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function LegalAgreementModal({
  isVisible,
  onAccept,
  onDecline,
}: LegalAgreementModalProps) {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const handleContinue = () => {
    if (!acceptedTerms || !acceptedPrivacy) {
      Alert.alert(
        "Acción Requerida",
        "Por favor, acepta los términos y condiciones y la política de privacidad para continuar."
      );
      return;
    }
    onAccept();
  };

  return (
    <>
      <ReactNativeModal isVisible={isVisible}>
        <View className="bg-white rounded-2xl p-4">
          <Text className="text-xl font-JakartaBold text-center mb-4">
            Términos Legales
          </Text>
          
          <Text className="text-sm font-Jakarta text-general-200 mb-6 text-center">
            Para continuar con el registro, debes aceptar nuestros términos y condiciones y política de privacidad.
          </Text>

          <View className="space-y-4 mb-6">
            <TouchableOpacity 
              onPress={() => setShowTerms(true)}
              className="bg-primary-100 p-3 rounded-lg"
            >
              <Text className="text-primary-700 font-JakartaMedium text-center">
                Ver Términos y Condiciones
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setShowPrivacy(true)}
              className="bg-primary-100 p-3 rounded-lg"
            >
              <Text className="text-primary-700 font-JakartaMedium text-center">
                Ver Política de Privacidad
              </Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-3 mb-6">
            <CustomCheckbox
              title="Acepto los términos y condiciones"
              checked={acceptedTerms}
              onPress={() => setAcceptedTerms(!acceptedTerms)}
            />
            <CustomCheckbox
              title="Acepto la política de privacidad"
              checked={acceptedPrivacy}
              onPress={() => setAcceptedPrivacy(!acceptedPrivacy)}
            />
          </View>

          <View className="flex-row justify-between space-x-2">
            <CustomButton
              title="Cancelar"
              onPress={onDecline}
              className="flex-1 bg-danger-500"
            />
            <CustomButton
              title="Continuar"
              onPress={handleContinue}
              className={`flex-1 ${(!acceptedTerms || !acceptedPrivacy) ? 'opacity-50' : ''}`}
              disabled={!acceptedTerms || !acceptedPrivacy}
            />
          </View>
        </View>
      </ReactNativeModal>

      <TermsAndConditionsModal
        isVisible={showTerms}
        onAccept={() => {
          setShowTerms(false);
          setAcceptedTerms(true);
        }}
        onDecline={() => setShowTerms(false)}
      />

      <PrivacyPolicyModal
        isVisible={showPrivacy}
        onAccept={() => {
          setShowPrivacy(false);
          setAcceptedPrivacy(true);
        }}
        onDecline={() => setShowPrivacy(false)}
      />
    </>
  );
} 