import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAudioRecording } from "@/hooks/useAudioRecording";
import { useMessages } from "@/hooks/useMessages";
import { useUserInfo } from "@/hooks/useUserInfo";
import { Message } from "@/types/message";
import { MessageItem } from "@/components/chat/MessageItem";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageInput } from "@/components/chat/MessageInput";
import { DeleteMessageModal } from "@/components/chat/DeleteMessageModal";
import { useAnimatedMessages } from "@/hooks/useAnimatedMessages";
import { MESSAGES_PER_PAGE } from "@/constants/chat";

export default function ChatDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentUserId, getCurrentUser } = useUserInfo();
  const {
    messages,
    isLoading,
    fetchMessages,
    sendMessage,
    deleteMessage,
    loadMoreMessages,
  } = useMessages(id, currentUserId);
  const { otherUserName, otherUserAvatar, getOtherUserInfo } = useUserInfo(id);
  const { isRecording, startRecording, stopRecording } = useAudioRecording();
  const { animatedMessages, onMessageSent } = useAnimatedMessages(messages);

  const [newMessage, setNewMessage] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  useEffect(() => {
    getCurrentUser();
    fetchMessages();
    getOtherUserInfo();
  }, [id, currentUserId]);

  const handleSendMessage = useCallback(async () => {
    if (newMessage.trim()) {
      await sendMessage(newMessage.trim(), "texto");
      setNewMessage("");
      onMessageSent();
    }
  }, [newMessage, sendMessage, onMessageSent]);

  const handleLongPress = useCallback((message: Message) => {
    if (message.emisor_id === currentUserId) {
      setSelectedMessage(message);
      setIsDeleteModalVisible(true);
    }
  }, [currentUserId]);

  const handleDeleteMessage = useCallback(() => {
    if (selectedMessage) {
      deleteMessage(selectedMessage);
      setSelectedMessage(null);
      setIsDeleteModalVisible(false);
    }
  }, [selectedMessage, deleteMessage]);

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => (
    <MessageItem
      message={item}
      currentUserId={currentUserId}
      otherUserAvatar={otherUserAvatar}
      onLongPress={handleLongPress}
      isSelected={selectedMessage?.id === item.id}
      animatedStyle={animatedMessages[index]}
    />
  ), [currentUserId, otherUserAvatar, handleLongPress, selectedMessage, animatedMessages]);

  const memoizedFlatList = useMemo(() => (
    <FlatList
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item) => item.id.toString()}
      inverted
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "flex-end",
        paddingVertical: 10,
      }}
      onEndReached={() => loadMoreMessages(MESSAGES_PER_PAGE)}
      onEndReachedThreshold={0.1}
    />
  ), [messages, renderMessage, loadMoreMessages]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#6D29D2" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ChatHeader
        otherUserName={otherUserName}
        otherUserAvatar={otherUserAvatar}
        onBackPress={() => router.push("/chat")}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setSelectedMessage(null)}
          className="flex-1 p-2"
        >
          {memoizedFlatList}
        </TouchableOpacity>

        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSendPress={handleSendMessage}
          isRecording={isRecording}
          onRecordPress={isRecording ? stopRecording : startRecording}
        />
      </KeyboardAvoidingView>

      <DeleteMessageModal
        isVisible={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
        onDelete={handleDeleteMessage}
      />
    </SafeAreaView>
  );
}
