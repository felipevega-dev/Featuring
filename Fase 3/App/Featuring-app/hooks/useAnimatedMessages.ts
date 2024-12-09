import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { Message } from '@/types/message';

export const useAnimatedMessages = (messages: Message[]) => {
  const animatedMessages = useRef(messages.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    messages.forEach((_, index) => {
      Animated.timing(animatedMessages[index], {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [messages, animatedMessages]);

  const onMessageSent = () => {
    const newAnimation = new Animated.Value(0);
    animatedMessages.unshift(newAnimation);
    Animated.timing(newAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return {
    animatedMessages: animatedMessages.map(anim => ({
      opacity: anim,
      transform: [
        {
          translateY: anim.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0],
          }),
        },
      ],
    })),
    onMessageSent,
  };
};
