import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import VideoCard from '@/components/VideoCard';
import UploadVideoModal from '@/components/UploadVideoModal';
import useVideos from '@/hooks/useVideos';
import { supabase } from '@/lib/supabase';
import { VideoProvider } from '@/contexts/VideoContext';
import { useFocusEffect } from '@react-navigation/native';

const { height } = Dimensions.get('window');

const Watch = () => {
  const { videos, isLoading, error, refetchVideos } = useVideos();
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // This runs when the screen is focused
      return () => {
        // This runs when the screen is unfocused
        // Stop all video playback here
      };
    }, [])
  );

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const handleUploadSuccess = () => {
    refetchVideos();
    setIsUploadModalVisible(false);
  };

  if (isLoading || error) {
    return null; // O un componente de carga/error
  }

  return (
    <VideoProvider>
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        <View style={{ position: 'absolute', top: 40, right: 10, zIndex: 10 }}>
          <TouchableOpacity
            onPress={() => setIsUploadModalVisible(true)}
            style={{ backgroundColor: '#5416A0', padding: 10, borderRadius: 30 }}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={videos}
          renderItem={({ item }) => (
            <VideoCard video={item} currentUserId={currentUserId || ''} />
          )}
          keyExtractor={(item) => item.id.toString()}
          pagingEnabled
          snapToInterval={height}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.y / height);
            // Set the current playing video based on the index
          }}
        />
        <UploadVideoModal
          isVisible={isUploadModalVisible}
          onClose={() => setIsUploadModalVisible(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      </View>
    </VideoProvider>
  );
};

export default Watch;