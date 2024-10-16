import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import { FontAwesome } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AudioPlayerProps {
  uri: string;
}

export default function AudioPlayer({ uri }: AudioPlayerProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const loadSound = async () => {
    console.log('Loading Sound');
    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: false },
      onPlaybackStatusUpdate
    );
    setSound(sound);
  };

  useEffect(() => {
    loadSound();
  }, [uri]);

  const onPlaybackStatusUpdate = (status: Audio.PlaybackStatus) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0);
      setPosition(status.positionMillis || 0);
      setIsPlaying(status.isPlaying);
    }
  };

  const playPause = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    }
  };

  const onSliderValueChange = async (value: number) => {
    if (sound) {
      await sound.setPositionAsync(value);
    }
  };

  const getMinutesSeconds = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={playPause} style={styles.playButton}>
        <FontAwesome name={isPlaying ? 'pause' : 'play'} size={24} color="#6D29D2" />
      </TouchableOpacity>
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingComplete={onSliderValueChange}
          minimumTrackTintColor="#6D29D2"
          maximumTrackTintColor="#D1D5DB"
          thumbTintColor="#6D29D2"
        />
        <Text style={styles.time}>{getMinutesSeconds(position)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 10,
    width: SCREEN_WIDTH * 0.7, // Ajusta este valor según necesites
  },
  playButton: {
    marginRight: 10,
  },
  sliderContainer: {
    flex: 1,
  },
  slider: {
    width: '100%',
  },
  time: {
    fontSize: 12,
    color: '#6B7280',
    alignSelf: 'flex-end',
    marginTop: 5,
  },
});
