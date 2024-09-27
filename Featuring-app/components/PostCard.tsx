import { Image, TouchableOpacity } from "react-native";
import { Post } from "@/lib/api";
import { View, Text } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

interface Props {
  post: Post;
}

export default function PostCard({ post }: Props) {
  return (
    <View className="bg-white rounded-lg shadow-md my-4">
      {/* Header */}
      <View className="flex-row items-center p-4">
        <Image
          source={{ uri: "https://picsum.photos/200" }}
          className="h-8 w-8 rounded-full mr-4"
        />
        <Text className="font-bold">John Doe</Text>
      </View>
      {/* Image */}
      {post.image && (
        <View className="w-full h-72">
          <Image source={{ uri: post.image }} className="w-full h-full" />
        </View>
      )}
      {/* Content */}
      <View className="p-4">
        <Text className="text-base">{post.contenido}</Text>
        {/* Footer */}
        <View className="flex-row pt-4">
          <TouchableOpacity>
            <FontAwesome name="heart-o" size={24} color="#FF0000" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
