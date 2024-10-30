import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

interface CollaborationRatingModalProps {
  isVisible: boolean;
  onClose: () => void;
  colaboracionId: number;
  colaboradorUsername: string;
  usuarioId: string;
}

export default function CollaborationRatingModal({
  isVisible,
  onClose,
  colaboracionId,
  colaboradorUsername,
  usuarioId,
}: CollaborationRatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comentario, setComentario] = useState('');

  const handleRate = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Por favor selecciona una valoración');
      return;
    }

    try {
      const { data: valoracionPrevia, error: valoracionError } = await supabase
        .from('valoracion_colaboracion')
        .select('id')
        .eq('usuario_id', usuarioId)
        .eq('colaboracion_id', colaboracionId)
        .single();

      if (!valoracionError && valoracionPrevia) {
        Alert.alert(
          'Valoración no permitida',
          'Ya has valorado a este usuario anteriormente. Solo se permite una valoración por colaborador.'
        );
        return;
      }

      const { error: insertError } = await supabase
        .from('valoracion_colaboracion')
        .insert({
          colaboracion_id: colaboracionId,
          usuario_id: usuarioId,
          valoracion: rating,
          comentario: comentario.trim() || null,
        });

      if (insertError) throw insertError;

      Alert.alert('Éxito', 'Tu valoración ha sido registrada');
      onClose();
    } catch (error) {
      console.error('Error al enviar valoración:', error);
      Alert.alert('Error', 'No se pudo registrar tu valoración');
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          onPressIn={() => setHoveredRating(i)}
          onPressOut={() => setHoveredRating(0)}
        >
          <Ionicons
            name={i <= (hoveredRating || rating) ? 'star' : 'star-outline'}
            size={40}
            color="#FFD700"
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white p-6 rounded-2xl w-4/5">
          <Text className="text-xl font-bold text-center mb-4">
            Valora tu experiencia
          </Text>
          <Text className="text-center mb-6">
            ¿Cómo calificarías tu colaboración con {colaboradorUsername}?
          </Text>
          
          <View className="flex-row justify-center space-x-2 mb-6">
            {renderStars()}
          </View>

          <TextInput
            className="border border-gray-300 rounded-lg p-3 mb-6"
            placeholder="Deja un comentario sobre tu experiencia (opcional)"
            value={comentario}
            onChangeText={setComentario}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View className="flex-row justify-end space-x-4">
            <TouchableOpacity
              onPress={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200"
            >
              <Text>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleRate}
              className="px-4 py-2 rounded-lg bg-primary-500"
            >
              <Text className="text-white">Enviar valoración</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
} 