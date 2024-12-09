import { supabase } from "@/lib/supabase";

export const fetchPosts = async () => {
  const { data, error } = await supabase
    .from("publicacion")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) {
    return [];
  } else {
    return data;
  }
};

export type Posts = Awaited<ReturnType<typeof fetchPosts>>;
export type Post = Posts[number];
