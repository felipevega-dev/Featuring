import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import Slider from "@react-native-community/slider";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { Ionicons } from "@expo/vector-icons";

const GlobalAudioPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    duration,
    position,
    playSound,
    pauseSound,
    resumeSound,
    seekSound,
  } = useAudioPlayer();

  if (!currentSong) return null;

  const formatTime = (millis: number | null) => {
    if (millis === null) return "0:00";
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? "0" : ""}${seconds}`;
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseSound();
    } else {
      resumeSound();
    }
  };

  return (
    <View className="bg-white border-t border-gray-200 p-2 flex-row items-center absolute bottom-14 left-0 right-0">
      <Image
        source={{ uri: currentSong.coverUrl }}
        className="w-12 h-12 rounded-md mr-3"
      />
      <View className="flex-1">
        <Text className="font-bold text-md" numberOfLines={1}>
          {currentSong.title}
        </Text>
        <Slider
          style={{ width: "100%", height: 20 }}
          minimumValue={0}
          maximumValue={duration || 0}
          value={position || 0}
          onSlidingComplete={seekSound}
          minimumTrackTintColor="#6D29D2"
          maximumTrackTintColor="#E6E1F1"
          thumbTintColor="#6D29D2"
        />
        <View className="flex-row justify-between">
          <Text className="text-xs text-gray-500">{formatTime(position)}</Text>
          <Text className="text-xs text-gray-500">{formatTime(duration)}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={handlePlayPause}>
        <Ionicons
          name={isPlaying ? "pause" : "play"}
          size={32}
          color="#6D29D2"
        />
      </TouchableOpacity>
    </View>
  );
};

export default GlobalAudioPlayer;
