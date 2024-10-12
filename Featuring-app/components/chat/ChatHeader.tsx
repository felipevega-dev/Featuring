import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface ChatHeaderProps {
  otherUserName: string;
  otherUserAvatar: string | null;
  onBackPress: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  otherUserName,
  otherUserAvatar,
  onBackPress,
}) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' }}>
      <TouchableOpacity onPress={onBackPress} style={{ marginRight: 10 }}>
        <FontAwesome name="arrow-left" size={24} color="#6D29D2" />
      </TouchableOpacity>
      {otherUserAvatar && (
        <Image
          source={{ uri: otherUserAvatar }}
          style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
        />
      )}
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#6D29D2' }}>
        {otherUserName}
      </Text>
    </View>
  );
};
