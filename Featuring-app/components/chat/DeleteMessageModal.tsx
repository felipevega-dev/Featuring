import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';

interface DeleteMessageModalProps {
  isVisible: boolean;
  onClose: () => void;
  onDelete: () => void;
}

export const DeleteMessageModal: React.FC<DeleteMessageModalProps> = ({
  isVisible,
  onClose,
  onDelete,
}) => {
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>¿Eliminar mensaje?</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={onClose} style={{ padding: 10 }}>
              <Text style={{ color: '#6D29D2' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete} style={{ padding: 10 }}>
              <Text style={{ color: 'red' }}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
