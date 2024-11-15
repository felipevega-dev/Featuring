import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { ReactNativeModal } from 'react-native-modal';
import CustomButton from './CustomButton';

interface TermsAndConditionsModalProps {
  isVisible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function TermsAndConditionsModal({
  isVisible,
  onAccept,
  onDecline,
}: TermsAndConditionsModalProps) {
  return (
    <ReactNativeModal isVisible={isVisible}>
      <View className="bg-white rounded-2xl p-4 max-h-[80%]">
        <Text className="text-xl font-JakartaBold text-center mb-4">
          Términos y Condiciones
        </Text>
        
        <ScrollView className="mb-4">
          <Text className="text-sm font-Jakarta text-general-200 mb-4">
            Última actualización: {new Date().toLocaleDateString()}
          </Text>

          <Text className="text-base font-JakartaBold text-general-200 mb-3">
            I. Aceptación de Términos
          </Text>
          <Text className="text-sm font-Jakarta text-general-200 mb-4">
            Al utilizar Featuring, una aplicación desarrollada por Featuring SpA, empresa constituida bajo las leyes de Chile, aceptas estos términos y condiciones en su totalidad. Si eres menor de 18 años, necesitas el consentimiento de tus padres o tutores legales.
          </Text>

          <Text className="text-base font-JakartaBold text-general-200 mb-3">
            II. Responsabilidad del Usuario
          </Text>
          <Text className="text-sm font-Jakarta text-general-200 mb-4">
            De acuerdo con la Ley 17.336 sobre Propiedad Intelectual de Chile y legislaciones similares en Latinoamérica, el usuario es legalmente responsable de:
            {'\n\n'}• <Text className="font-JakartaBold">Todo el contenido</Text> que sube o comparte en la plataforma
            {'\n'}• <Text className="font-JakartaBold">La veracidad</Text> de la información proporcionada
            {'\n'}• <Text className="font-JakartaBold">El cumplimiento</Text> de derechos de autor y propiedad intelectual
            {'\n'}• <Text className="font-JakartaBold">Las interacciones</Text> con otros usuarios
            {'\n'}• <Text className="font-JakartaBold">El uso apropiado</Text> de la plataforma
          </Text>

          <Text className="text-base font-JakartaBold text-general-200 mb-3">
            III. Contenido Prohibido
          </Text>
          <Text className="text-sm font-Jakarta text-general-200 mb-4">
            Está estrictamente prohibido publicar:
            {'\n\n'}• <Text className="font-JakartaBold">Contenido sexual explícito</Text> o pornográfico
            {'\n'}• <Text className="font-JakartaBold">Material discriminatorio</Text> o que promueva el odio
            {'\n'}• <Text className="font-JakartaBold">Contenido protegido</Text> por derechos de autor sin autorización
            {'\n'}• <Text className="font-JakartaBold">Material ilegal</Text> o que promueva actividades ilegales
            {'\n'}• <Text className="font-JakartaBold">Información personal</Text> de terceros sin autorización
            {'\n'}• <Text className="font-JakartaBold">Contenido violento</Text> o perturbador
            {'\n'}• <Text className="font-JakartaBold">Spam</Text> o publicidad no autorizada
          </Text>

          <Text className="text-base font-JakartaBold text-general-200 mb-3">
            IV. Moderación y Control
          </Text>
          <Text className="text-sm font-Jakarta text-general-200 mb-4">
            Featuring SpA se reserva el derecho de:
            {'\n\n'}• <Text className="font-JakartaBold">Revisar y moderar</Text> todo el contenido subido
            {'\n'}• <Text className="font-JakartaBold">Eliminar contenido</Text> que viole estos términos
            {'\n'}• <Text className="font-JakartaBold">Suspender o cancelar</Text> cuentas infractoras
            {'\n'}• <Text className="font-JakartaBold">Reportar</Text> a las autoridades contenido ilegal
            {'\n'}• <Text className="font-JakartaBold">Cooperar</Text> con investigaciones legales
          </Text>

          <Text className="text-base font-JakartaBold text-general-200 mb-3">
            V. Propiedad Intelectual
          </Text>
          <Text className="text-sm font-Jakarta text-general-200 mb-4">
            Según la Ley 17.336 y el Convenio de Berna:
            {'\n\n'}• <Text className="font-JakartaBold">Mantienes los derechos</Text> de tu contenido original
            {'\n'}• <Text className="font-JakartaBold">Otorgas a Featuring</Text> licencia para mostrar y distribuir tu contenido
            {'\n'}• <Text className="font-JakartaBold">Garantizas</Text> tener los derechos necesarios del contenido que subes
            {'\n'}• <Text className="font-JakartaBold">Aceptas</Text> que Featuring puede usar tu contenido con fines promocionales
          </Text>

          <Text className="text-base font-JakartaBold text-general-200 mb-3">
            VI. Limitación de Responsabilidad
          </Text>
          <Text className="text-sm font-Jakarta text-general-200 mb-4">
            De acuerdo con la legislación chilena:
            {'\n\n'}• <Text className="font-JakartaBold">Featuring actúa como intermediario</Text> y no es responsable del contenido generado por usuarios
            {'\n'}• <Text className="font-JakartaBold">Los usuarios son responsables</Text> de sus acciones y contenido
            {'\n'}• <Text className="font-JakartaBold">Featuring no garantiza</Text> la precisión del contenido de usuarios
            {'\n'}• <Text className="font-JakartaBold">Las disputas entre usuarios</Text> son responsabilidad de las partes involucradas
          </Text>

          <Text className="text-base font-JakartaBold text-general-200 mb-3">
            VII. Jurisdicción
          </Text>
          <Text className="text-sm font-Jakarta text-general-200 mb-4">
            Estos términos se rigen por las leyes de Chile y las disputas se resolverán en los tribunales de Santiago de Chile. Los usuarios de otros países de Latinoamérica aceptan esta jurisdicción al usar el servicio.
          </Text>

          <Text className="text-base font-JakartaBold text-general-200 mb-3">
            VIII. Modificaciones
          </Text>
          <Text className="text-sm font-Jakarta text-general-200 mb-4">
            Featuring SpA se reserva el derecho de modificar estos términos en cualquier momento, notificando los cambios a través de la aplicación.
          </Text>
        </ScrollView>

        <View className="mt-2">
          <CustomButton
            title="Comprendo los Términos"
            onPress={onAccept}
            className="bg-primary-600"
          />
        </View>
      </View>
    </ReactNativeModal>
  );
} 