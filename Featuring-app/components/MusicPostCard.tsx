import { View, Text, Image, TouchableOpacity } from "react-native";
import { icons } from "@/constants";

type MusicPost = {
  post_id: string;
  artist_name: string;
  song_title: string;
  genre: string;
  release_date: string;
  likes: number;
  streams: number;
  artist_image: string;
  song_cover: string;
};

const MusicPostCard = ({ post }: { post: MusicPost }) => (
  <View className="bg-white rounded-lg shadow-sm shadow-neutral-300 mb-3 mx-3 p-3">
    <View className="flex flex-row items-center mb-3">
      <Image
        source={{ uri: post.artist_image }}
        className="w-12 h-12 rounded-full mr-3"
      />
      <View>
        <Text className="text-lg font-JakartaSemiBold">{post.artist_name}</Text>
        <Text className="text-sm text-gray-500">{post.genre}</Text>
      </View>
    </View>
    <Image
      source={{ uri: post.song_cover }}
      className="w-full h-48 rounded-lg mb-3"
    />
    <Text className="text-xl font-JakartaBold mb-1">{post.song_title}</Text>
    <Text className="text-sm text-gray-500 mb-3">
      Lanzado el {post.release_date}
    </Text>
    <View className="flex flex-row justify-between">
      <TouchableOpacity className="flex flex-row items-center">
        <Image source={icons.heart} className="w-5 h-5 mr-1" />
        <Text>{post.likes}</Text>
      </TouchableOpacity>
      <TouchableOpacity className="flex flex-row items-center">
        <Image source={icons.play} className="w-5 h-5 mr-1" />
        <Text>{post.streams} reproducciones</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default MusicPostCard;
