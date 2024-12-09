import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { ReportButton } from '@/components/reports/ReportButton';

interface OptionsModalProps {
  isVisible: boolean;
  onClose: () => void;
  onBlockUser: () => void;
  onCancelConnection: () => void;
  isBlocked: boolean;
  contentId: string;
  currentUserId: string;
}

export const OptionsModal = ({
  isVisible,
  onClose,
  onBlockUser,
  onCancelConnection,
  isBlocked,
  contentId,
  currentUserId,
}: OptionsModalProps) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="w-[80%] bg-white rounded-2xl p-5 items-center shadow-lg">
          <Text className="text-xl font-JakartaBold mb-5 text-primary-700">
            Opciones
          </Text>
          
          <TouchableOpacity
            onPress={onBlockUser}
            className={`w-full p-4 rounded-xl mb-3 ${
              isBlocked ? 'bg-success-500' : 'bg-danger-500'
            }`}
          >
            <Text className="text-white text-center font-JakartaMedium text-base">
              {isBlocked ? "Desbloquear usuario" : "Bloquear usuario"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onCancelConnection}
            className="w-full p-4 rounded-xl mb-3 bg-danger-500"
          >
            <Text className="text-white text-center font-JakartaMedium text-base">
              Cancelar conexión
            </Text>
          </TouchableOpacity>

          <ReportButton
            contentId={contentId}
            contentType="chat"
            reportedUserId={contentId}
            currentUserId={currentUserId}
            buttonStyle="w-full mb-3 bg-warning-500 font-JakartaMedium"
            buttonText="Reportar chat"
          />

          <TouchableOpacity
            onPress={onClose}
            className="w-full p-4 rounded-xl bg-primary-500"
          >
            <Text className="text-white text-center font-JakartaMedium text-base">
              Cerrar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}; 