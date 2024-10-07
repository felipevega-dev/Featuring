import React, { createContext, useState, useContext, useEffect } from 'react';
import { Audio } from 'expo-av';

interface AudioPlayerContextType {
  currentSong: {
    id: number;
    title: string;
    audioUrl: string;
    coverUrl: string;
  } | null;
  isPlaying: boolean;
  duration: number | null;
  position: number | null;
  playSound: (song: { id: number; title: string; audioUrl: string; coverUrl: string }) => Promise<void>;
  pauseSound: () => Promise<void>;
  seekSound: (position: number) => Promise<void>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const useAudioPlayer = () => {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentSong, setCurrentSong] = useState<AudioPlayerContextType['currentSong']>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [position, setPosition] = useState<number | null>(null);

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playSound = async (song: { id: number; title: string; audioUrl: string; coverUrl: string }) => {
    if (sound) {
      await sound.unloadAsync();
    }
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: song.audioUrl },
      { shouldPlay: true },
      onPlaybackStatusUpdate
    );
    setSound(newSound);
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const pauseSound = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const seekSound = async (position: number) => {
    if (sound) {
      await sound.setPositionAsync(position);
    }
  };

  const onPlaybackStatusUpdate = (status: Audio.PlaybackStatus) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis);
      setPosition(status.positionMillis);
      setIsPlaying(status.isPlaying);
    }
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        duration,
        position,
        playSound,
        pauseSound,
        seekSound,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};