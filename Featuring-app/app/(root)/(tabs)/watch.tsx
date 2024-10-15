import React, { useState, useEffect, useRef } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import VideoCard from "@/components/VideoCard";
import UploadVideoModal from "@/components/UploadVideoModal";
import useVideos from "@/hooks/useVideos";
import { supabase } from "@/lib/supabase";
import { VideoProvider, useVideo } from "@/contexts/VideoContext";
import { useFocusEffect } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

const STATUSBAR_HEIGHT = Platform.OS === "ios" ? 20 : StatusBar.currentHeight;
const BOTTOM_TAB_HEIGHT = 35; // Ajusta esto según la altura real de tu barra de pestañas inferior

const WatchContent = () => {
  const { videos, setVideos, isLoading, error, refetchVideos } = useVideos();
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { setCurrentPlayingId } = useVideo();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (currentIndex >= 0 && videos[currentIndex]) {
        setCurrentPlayingId(videos[currentIndex].id);
      }
      return () => {
        setCurrentPlayingId(null);
        videos.forEach((video) => {
          if (video.ref && video.ref.current) {
            video.ref.current.pauseAsync();
          }
        });
      };
    }, [currentIndex, videos, setCurrentPlayingId])
  );

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const handleUploadSuccess = () => {
    refetchVideos();
    setIsUploadModalVisible(false);
  };

  const onViewableItemsChanged = React.useCallback(
    ({ viewableItems }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index);
        setCurrentPlayingId(viewableItems[0].item.id);
      }
    },
    [setCurrentPlayingId]
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const handleDeleteVideo = (videoId: number) => {
    setVideos((prevVideos) => prevVideos.filter((v) => v.id !== videoId));
  };

  const handleUpdateVideo = (
    videoId: number,
    updatedData: { titulo: string; descripcion: string }
  ) => {
    setVideos((prevVideos) =>
      prevVideos.map((v) => (v.id === videoId ? { ...v, ...updatedData } : v))
    );
  };

  if (isLoading || error) {
    return null; // O un componente de carga/error
  }

  const videoHeight = height - STATUSBAR_HEIGHT - BOTTOM_TAB_HEIGHT;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <View style={{ flex: 1 }}>
        <View
          style={{ position: "absolute", top: 620, right: 175, zIndex: 10 }}
        >
          <TouchableOpacity
            onPress={() => setIsUploadModalVisible(true)}
            style={{
              backgroundColor: "#66E7D5",
              padding: 10,
              borderRadius: 30,
            }}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <FlatList
          ref={flatListRef}
          data={videos}
          renderItem={({ item, index }) => (
            <VideoCard
              video={item}
              currentUserId={currentUserId || ""}
              isActive={index === currentIndex}
              height={videoHeight}
              onDeleteVideo={handleDeleteVideo}
              onUpdateVideo={handleUpdateVideo}
              setVideos={setVideos}
              refetchVideos={refetchVideos}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          pagingEnabled
          snapToInterval={videoHeight}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
        <UploadVideoModal
          isVisible={isUploadModalVisible}
          onClose={() => setIsUploadModalVisible(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      </View>
    </SafeAreaView>
  );
};

const Watch = () => (
  <VideoProvider>
    <WatchContent />
  </VideoProvider>
);

export default Watch;
