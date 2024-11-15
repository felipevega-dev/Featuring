import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { ReactNativeModal } from 'react-native-modal';
import CustomButton from './CustomButton';

interface PrivacyPolicyModalProps {
  isVisible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function PrivacyPolicyModal({
  isVisible,
  onAccept,
  onDecline,
}: PrivacyPolicyModalProps) {
  return (
    <ReactNativeModal isVisible={isVisible}>
      <View className="bg-white rounded-2xl p-4 max-h-[80%]">
        <Text className="text-xl font-JakartaBold text-center mb-4">
          Política de Privacidad
        </Text>
        
        <ScrollView className="mb-4">
          <Text className="text-sm font-Jakarta text-general-200 mb-4">
            Última actualización: {new Date().toLocaleDateString()}
          </Text>

          <Text className="text-base font-JakartaBold text-general-200 mb-3">
            I. Marco Legal
          </Text>
          <Text className="text-sm font-Jakarta text-general-200 mb-4">
            Featuring SpA opera bajo la Ley 19.628 sobre Protección de la Vida Privada de Chile y otras normativas aplicables en Latinoamérica. Nos comprometemos a proteger tu privacidad y datos personales.
          </Text>

          <Text className="text-base font-JakartaBold text-general-200 mb-3">
            II. Información que Recopilamos
          </Text>
          <Text className="text-sm font-Jakarta text-general-200 mb-4">
            Recopilamos y procesamos:
            {'\n\n'}• <Text className="font-JakartaBold">Datos de perfil:</Text> nombre, correo, contraseña
            {'\n'}• <Text className="font-JakartaBold">Contenido generado:</Text> música, videos, imágenes, textos
            {'\n'}• <Text className="font-JakartaBold">Datos de uso:</Text> interacciones, preferencias, actividad
            {'\n'}• <Text className="font-JakartaBold">Información técnica:</Text> dispositivo, IP, ubicación general
            {'\n'}• <Text className="font-JakartaBold">Datos de comunicación:</Text> mensajes, comentarios
          </Text>

          <Text className="text-base font-JakartaBold text-general-200 mb-3">
            III. Uso de la Información
          </Text>
          <Text className="text-sm font-Jakarta text-general-200 mb-4">
            Utilizamos tu información para:
            {'\n\n'}• <Text className="font-JakartaBold">Proporcionar el servicio:</Text> gestionar tu cuenta y contenido
            {'\n'}• <Text className="font-JakartaBold">Mejorar la experiencia:</Text> personalización y recomendaciones
            {'\n'}• <Text className="font-JakartaBold">Comunicación:</Text> notificaciones, actualizaciones, soporte
            {'\n'}• <Text className="font-JakartaBold">Seguridad:</Text> proteger la plataforma y usuarios
            {'\n'}• <Text className="font-JakartaBold">Análisis:</Text> estadísticas y mejoras del servicio
          </Text>

          <Text className="text-base font-JakartaBold text-general-200 mb-3">
            IV. Compartir Información
          </Text>
          <Text className="text-sm font-Jakarta text-general-200 mb-4">
            Podemos compartir información con:
            {'\n\n'}• <Text className="font-JakartaBold">Otros usuarios:</Text> según tus ajustes de privacidad
            {'\n'}• <Text className="font-JakartaBold">Proveedores de servicio:</Text> procesamiento, almacenamiento
            {'\n'}• <Text className="font-JakartaBold">Autoridades:</Text> por requerimiento legal o judicial
            {'\n'}• <Text className="font-JakartaBold">Nunca venderemos</Text> tus datos personales
          </Text>

          <Text className="text-base font-JakartaBold text-general-200 mb-3">
            V. Seguridad de Datos
          </Text>
          <Text className="text-sm font-Jakarta text-general-200 mb-4">
            Implementamos medidas de seguridad:
            {'\n\n'}• <Text className="font-JakartaBold">Encriptación</Text> de datos sensibles
            {'\n'}• <Text className="font-JakartaBold">Acceso restringido</Text> a información personal
            {'\n'}• <Text className="font-JakartaBold">Monitoreo</Text> de actividades sospechosas
            {'\n'}• <Text className="font-JakartaBold">Copias de seguridad</Text> regulares
          </Text>

          <Text className="text-base font-JakartaBold text-general-200 mb-3">
            VI. Tus Derechos
          </Text>
          <Text className="text-sm font-Jakarta text-general-200 mb-4">
            Según la Ley 19.628, tienes derecho a:
            {'\n\n'}• <Text className="font-JakartaBold">Acceder</Text> a tus datos personales
            {'\n'}• <Text className="font-JakartaBold">Rectificar</Text> información incorrecta
            {'\n'}• <Text className="font-JakartaBold">Cancelar</Text> o eliminar tus datos
            {'\n'}• <Text className="font-JakartaBold">Oponerte</Text> al procesamiento
            {'\n'}• <Text className="font-JakartaBold">Portabilidad</Text> de tus datos
          </Text>

          <Text className="text-base font-JakartaBold text-general-200 mb-3">
            VII. Menores de Edad
          </Text>
          <Text className="text-sm font-Jakarta text-general-200 mb-4">
            Los usuarios menores de 18 años requieren autorización de padres o tutores legales. Tomamos medidas especiales para proteger la privacidad de menores.
          </Text>

          <Text className="text-base font-JakartaBold text-general-200 mb-3">
            VIII. Cambios en la Política
          </Text>
          <Text className="text-sm font-Jakarta text-general-200 mb-4">
            Nos reservamos el derecho de actualizar esta política. Los cambios serán notificados a través de la aplicación.
          </Text>

          <Text className="text-base font-JakartaBold text-general-200 mb-3">
            IX. Contacto
          </Text>
          <Text className="text-sm font-Jakarta text-general-200 mb-4">
            Para ejercer tus derechos o consultas sobre privacidad:
            {'\n\n'}• Email: support@featuring.app
          </Text>
        </ScrollView>

        <View className="mt-2">
          <CustomButton
            title="Comprendo las Políticas"
            onPress={onAccept}
            className="bg-primary-600"
          />
        </View>
      </View>
    </ReactNativeModal>
  );
} 