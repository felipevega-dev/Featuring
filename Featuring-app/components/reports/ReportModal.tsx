import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { supabase } from "@/lib/supabase";

interface ReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  contentId: string | number;
  contentType: 'perfil' | 'cancion' | 'video' | 'texto' | 'audio' | 'imagen' | 'video_chat';
  reportedUserId: string;
  currentUserId: string;
}

const REPORT_REASONS = {
  perfil: [
    'Suplantación de identidad',
    'Contenido inapropiado',
    'Spam o comportamiento sospechoso',
    'Acoso o bullying',
    'Foto de perfil inapropiada'
  ],
  texto: [
    'Acoso',
    'Amenazas',
    'Contenido inapropiado',
    'Spam',
    'Información personal'
  ],
  audio: [
    'Contenido sexual',
    'Contenido violento',
    'Lenguaje inapropiado',
    'Spam',
    'Otro contenido inapropiado'
  ],
  imagen: [
    'Contenido sexual',
    'Contenido violento',
    'Contenido perturbador',
    'Spam',
    'Otro contenido inapropiado'
  ],
  video: [
    'Contenido sexual',
    'Contenido violento',
    'Contenido perturbador',
    'Spam',
    'Otro contenido inapropiado'
  ],
  chat: [
    'Acoso',
    'Spam',
    'Comportamiento inapropiado',
    'Amenazas',
    'Suplantación de identidad'
  ],
  video_chat: [
    'Contenido sexual',
    'Contenido violento',
    'Contenido perturbador',
    'Spam',
    'Otro contenido inapropiado'
  ]
};

export const ReportModal: React.FC<ReportModalProps> = ({
  isVisible,
  onClose,
  contentId,
  contentType,
  reportedUserId,
  currentUserId
}) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [isConfirmationVisible, setIsConfirmationVisible] = useState(false);
  const [userReportCount, setUserReportCount] = useState(0);

  const checkReportEligibility = async () => {
    try {
      if (contentType === 'perfil' || contentType === 'chat') {
        const { data: existingReport, error: existingReportError } = await supabase
          .from('reporte')
          .select('id')
          .eq('usuario_reportante_id', currentUserId)
          .eq('usuario_reportado_id', reportedUserId)
          .eq('tipo_contenido', contentType)
          .single();

        if (existingReportError && existingReportError.code !== 'PGRST116') {
          throw existingReportError;
        }

        if (existingReport) {
          Alert.alert('Error', `Ya has reportado este ${contentType === 'chat' ? 'chat' : 'perfil'} anteriormente.`);
          return false;
        }
      } else {
        const { data: existingReport, error: existingReportError } = await supabase
          .from('reporte')
          .select('id')
          .eq('usuario_reportante_id', currentUserId)
          .eq('contenido_id', contentId)
          .eq('tipo_contenido', contentType)
          .single();

        if (existingReportError && existingReportError.code !== 'PGRST116') {
          throw existingReportError;
        }

        if (existingReport) {
          Alert.alert('Error', 'Ya has reportado este contenido anteriormente.');
          return false;
        }
      }

      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      const { data: recentReports, error: recentReportsError } = await supabase
        .from('reporte')
        .select('id')
        .eq('usuario_reportante_id', currentUserId)
        .gte('created_at', twelveHoursAgo);

      if (recentReportsError) throw recentReportsError;

      const reportCount = recentReports ? recentReports.length : 0;
      setUserReportCount(reportCount);

      if (reportCount >= 3) {
        Alert.alert('Límite alcanzado', 'Has alcanzado el límite de 3 reportes en las últimas 12 horas.');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error al verificar elegibilidad para reportar:', error);
      Alert.alert('Error', 'No se pudo verificar tu elegibilidad para reportar.');
      return false;
    }
  };

  const handleReportConfirm = async () => {
    if (selectedReason) {
      const canReport = await checkReportEligibility();
      if (canReport) {
        setIsConfirmationVisible(true);
      }
    }
  };

  const sendReport = async () => {
    try {
      const reportData = (contentType === 'perfil' || contentType === 'chat') ? {
        usuario_reportante_id: currentUserId,
        usuario_reportado_id: reportedUserId,
        tipo_contenido: contentType,
        razon: selectedReason,
        estado: 'abierto'
      } : {
        usuario_reportante_id: currentUserId,
        usuario_reportado_id: reportedUserId,
        contenido_id: contentId,
        tipo_contenido: contentType,
        razon: selectedReason,
        estado: 'abierto'
      };

      const { error: reportError } = await supabase
        .from('reporte')
        .insert(reportData);

      if (reportError) throw reportError;

      Alert.alert(
        "Reporte Enviado",
        "Tu reporte ha sido enviado correctamente.",
        [{ text: "OK", onPress: onClose }]
      );
      
      setSelectedReason(null);
      setIsConfirmationVisible(false);
    } catch (error) {
      console.error('Error al enviar el reporte:', error);
      Alert.alert('Error', 'No se pudo enviar el reporte. Por favor, intenta de nuevo.');
    }
  };

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={onClose}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-4">
            <Text className="text-xl font-bold mb-4">Reportar contenido</Text>
            <Text className="text-sm text-gray-600 mb-4">
              Selecciona una razón para reportar. Un reporte injustificado podría resultar en una suspensión de tu cuenta.
            </Text>
            
            {REPORT_REASONS[contentType === 'perfil' ? 'perfil' : 
                         contentType === 'chat' ? 'chat' : 
                         contentType === 'video_chat' ? 'video_chat' : 
                         contentType].map((reason, index) => (
              <TouchableOpacity
                key={index}
                className={`py-3 border-b border-gray-200 ${
                  selectedReason === reason ? 'bg-primary-100' : ''
                }`}
                onPress={() => setSelectedReason(reason)}
              >
                <Text className="font-medium">{reason}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              className="mt-4 bg-primary-500 rounded-full py-3 items-center"
              onPress={handleReportConfirm}
              disabled={!selectedReason}
            >
              <Text className="text-white font-bold">Enviar reporte</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="mt-2 py-3 items-center"
              onPress={onClose}
            >
              <Text className="text-primary-500 font-medium">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isConfirmationVisible}
        onRequestClose={() => setIsConfirmationVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white rounded-lg p-4 w-5/6">
            <Text className="text-lg font-bold mb-4">Confirmar reporte</Text>
            <Text className="mb-4">
              ¿Estás seguro que quieres enviar este reporte?
            </Text>
            <Text className="mb-4 font-semibold text-primary-600">
              {userReportCount} de 3 reportes comunicados
            </Text>
            <Text className="mb-4 text-sm text-gray-600">
              Recuerda que solo puedes enviar un total de 3 reportes cada 12 horas.
            </Text>
            
            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => setIsConfirmationVisible(false)}
                className="bg-gray-300 rounded-md px-4 py-2 mr-2"
              >
                <Text>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={sendReport}
                className="bg-primary-500 rounded-md px-4 py-2"
              >
                <Text className="text-white">Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}; 