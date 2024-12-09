import React, { createContext, useState, useContext } from "react";

interface VideoContextType {
  currentPlayingId: number | null;
  setCurrentPlayingId: (id: number | null) => void;
  isScreenFocused: boolean;
  setIsScreenFocused: (isFocused: boolean) => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export const VideoProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentPlayingId, setCurrentPlayingId] = useState<number | null>(null);
  const [isScreenFocused, setIsScreenFocused] = useState(true);  // Inicializado como true

  return (
    <VideoContext.Provider value={{ currentPlayingId, setCurrentPlayingId, isScreenFocused, setIsScreenFocused }}>
      {children}
    </VideoContext.Provider>
  );
};

export const useVideo = () => {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error("useVideo must be used within a VideoProvider");
  }
  return context;
};
