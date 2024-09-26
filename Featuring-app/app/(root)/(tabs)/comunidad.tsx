import React from "react";
import { View, Text, FlatList } from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import AddPostForm from "@/components/AddPostForm";
import { fetchPosts, Posts } from "@/lib/api";
import PostCard from "@/components/PostCard";

const Comunidad = () => {
  const [posts, setPosts] = useState<Posts>([]);

  useEffect(() => {
    fetchPosts().then((data) => setPosts(data));
  }, []);

  const handleSubmit = async (content: string) => {
    const { data, error } = await supabase
      .from("publicacion")
      .insert({ contenido: content })
      .select();
    if (error) {
      console.log("Error creating post:", error);
    } else {
      setPosts([data[0], ...posts]);
    }
  };

  const renderItem = ({ item }) => <PostCard post={item} />;

  return (
    <View className="flex-1 bg-gray-100">
      <AddPostForm onSubmit={handleSubmit} />
      <Text className="text-xl font-bold text-center py-4">Comunidad</Text>
      {posts.length > 0 ? (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">
            No hay publicaciones para mostrar.
          </Text>
        </View>
      )}
    </View>
  );
};

export default Comunidad;
