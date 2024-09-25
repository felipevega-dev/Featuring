import React from "react";
import { FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MusicPostCard from "@/components/MusicPostCard";

const recentPosts = [
  {
    post_id: "1",
    artist_name: "Luna Stellar",
    song_title: "Midnight Serenade",
    genre: "Indie Pop",
    release_date: "2024-08-12",
    likes: 1250,
    streams: 50000,
    artist_image:
      "https://ucarecdn.com/6ea6d83d-ef1a-483f-9106-837a3a5b3f67/-/preview/1000x666/",
    song_cover:
      "https://img.freepik.com/free-vector/gradient-album-cover-template_23-2150597427.jpg?t=st=1727114416~exp=1727118016~hmac=a07571a92575588289a5d84a64d6554947dac69e997db8c3d56bf387725e07ae&w=740",
  },
  {
    post_id: "2",
    artist_name: "Neon Pulse",
    song_title: "Electric Dreams",
    genre: "Synthwave",
    release_date: "2024-08-10",
    likes: 980,
    streams: 35000,
    artist_image:
      "https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x666/",
    song_cover:
      "https://img.freepik.com/free-vector/gradient-album-cover-template_23-2150597431.jpg?t=st=1727114368~exp=1727117968~hmac=1a62f9801849989cbc7456f62a4847f8254799c2a3d2805ad2717e2c1a344729&w=740",
  },
  {
    post_id: "3",
    artist_name: "Acoustic Harmony",
    song_title: "Whispers in the Wind",
    genre: "Folk",
    release_date: "2024-08-08",
    likes: 750,
    streams: 28000,
    artist_image:
      "https://ucarecdn.com/0330d85c-232e-4c30-bd04-e5e4d0e3d688/-/preview/826x822/",
    song_cover:
      "https://img.freepik.com/free-vector/gradient-album-cover-template_23-2150597439.jpg?t=st=1727114351~exp=1727117951~hmac=e69e4a8d583f9a7538aa8198591554b7e30a085e75b3190f697637dc94d1c7b0&w=740",
  },
  {
    post_id: "4",
    artist_name: "Quantum Beat",
    song_title: "Digital Horizon",
    genre: "Electronic",
    release_date: "2024-08-05",
    likes: 1100,
    streams: 42000,
    artist_image:
      "https://ucarecdn.com/6ea6d83d-ef1a-483f-9106-837a3a5b3f67/-/preview/1000x666/",
    song_cover:
      "https://img.freepik.com/free-vector/electro-music-album_53876-67225.jpg?t=st=1727114451~exp=1727118051~hmac=4c07935692d221d085e51f80d054009d7443cc862d990db87ff809a01cd0129f&w=740",
  },
];

export default function Feed() {
  return (
    <SafeAreaView className="bg-general-500 flex-1">
      <FlatList
        data={recentPosts}
        renderItem={({ item }) => <MusicPostCard post={item} />}
        keyExtractor={(item) => item.post_id}
      />
    </SafeAreaView>
  );
}
