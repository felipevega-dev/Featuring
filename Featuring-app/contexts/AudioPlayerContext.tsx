import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
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
  resumeSound: () => Promise<void>;
  seekSound: (position: number) => Promise<void>;
  setPosition: React.Dispatch<React.SetStateAction<number | null>>;
  setDuration: React.Dispatch<React.SetStateAction<number | null>>;
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
  const positionRef = useRef<number | null>(null);

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
      if (currentSong?.id === song.id) {
        // Si es la misma canción, reanudar desde la posición actual
        await resumeSound();
      } else {
        // Si es una nueva canción, detener la actual y cargar la nueva
        await sound.unloadAsync();
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: song.audioUrl },
          { shouldPlay: true, positionMillis: 0 },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setCurrentSong(song);
        setIsPlaying(true);
        positionRef.current = 0;
      }
    } else {
      // Si no hay sonido cargado, cargar y reproducir la nueva canción
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.audioUrl },
        { shouldPlay: true, positionMillis: 0 },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setCurrentSong(song);
      setIsPlaying(true);
      positionRef.current = 0;
    }
  };

  const pauseSound = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  const resumeSound = async () => {
    if (sound) {
      await sound.playFromPositionAsync(positionRef.current || 0);
      setIsPlaying(true);
    }
  };

  const seekSound = async (position: number) => {
    if (sound) {
      await sound.setPositionAsync(position);
      positionRef.current = position;
    }
  };

  const onPlaybackStatusUpdate = (status: Audio.PlaybackStatus) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis);
      setPosition(status.positionMillis);
      positionRef.current = status.positionMillis;
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
        resumeSound,
        seekSound,
        setPosition,
        setDuration,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};