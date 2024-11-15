import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
  ViewToken,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import VideoCard from "@/components/VideoCard";
import UploadVideoModal from "@/components/UploadVideoModal";
import useVideos from "@/hooks/useVideos";
import { supabase } from "@/lib/supabase";
import { VideoProvider, useVideo } from "@/contexts/VideoContext";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";

const { width, height } = Dimensions.get("window");

const STATUSBAR_HEIGHT = Platform.OS === "ios" ? 20 : StatusBar.currentHeight ?? 0;
const BOTTOM_TAB_HEIGHT = 35; 

export const WatchContent = () => {
  const { videos, setVideos, isLoading, error, refetchVideos } = useVideos();
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const { setCurrentPlayingId, setIsScreenFocused } = useVideo();
  const { scrollToId } = useLocalSearchParams<{ scrollToId: string }>();
  const [pendingScroll, setPendingScroll] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      if (currentIndex >= 0 && videos[currentIndex]) {
        setCurrentPlayingId(videos[currentIndex].id);
      }

      return () => {
        setIsScreenFocused(false);
        setCurrentPlayingId(null);
      };
    }, [currentIndex, videos, setCurrentPlayingId, setIsScreenFocused])
  );

  useEffect(() => {
    if (scrollToId) {
      setPendingScroll(scrollToId);
    }
  }, [scrollToId]);

  useEffect(() => {
    if (pendingScroll && videos.length > 0) {
      console.log('Intentando scroll a video:', pendingScroll);
      const videoIndex = videos.findIndex(
        video => video.id.toString() === pendingScroll
      );
      console.log('Índice encontrado:', videoIndex);
      
      if (videoIndex !== -1 && flatListRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: videoIndex,
            animated: true,
            viewPosition: 0,
            viewOffset: 0
          });
          setCurrentIndex(videoIndex);
          setCurrentPlayingId(videos[videoIndex].id);
          setPendingScroll(null); // Limpiar el scroll pendiente
        }, 100);
      }
    }
  }, [pendingScroll, videos]);

  // Agregar manejador de error de scroll
  const onScrollToIndexFailed = (info: {
    index: number;
    highestMeasuredFrameIndex: number;
    averageItemLength: number;
  }) => {
    console.log('Scroll falló, intentando de nuevo...');
    const wait = new Promise(resolve => setTimeout(resolve, 100));
    wait.then(() => {
      flatListRef.current?.scrollToIndex({
        index: info.index,
        animated: true,
        viewPosition: 0,
        viewOffset: 0
      });
    });
  };

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
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const newIndex = viewableItems[0].index || 0;
        setCurrentIndex(newIndex);
        setCurrentPlayingId(videos[newIndex].id);
      }
    },
    [setCurrentPlayingId, videos]
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
  };

  const handleDeleteVideo = (videoId: number) => {
    setVideos((prevVideos) => prevVideos.filter((v) => v.id !== videoId));
  };

  const handleUpdateVideo = (
    videoId: number,
    updatedData: { descripcion: string }
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
        <TouchableOpacity
          onPress={() => setIsUploadModalVisible(true)}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 10,
            backgroundColor: "#66E7D5",
            padding: 10,
            borderRadius: 30,
          }}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
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
          onScrollToIndexFailed={onScrollToIndexFailed}
          getItemLayout={(data, index) => ({
            length: videoHeight,
            offset: videoHeight * index,
            index,
          })}
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
