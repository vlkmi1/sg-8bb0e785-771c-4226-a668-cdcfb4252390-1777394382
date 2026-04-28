import { supabase } from "@/integrations/supabase/client";

export type SocialPlatform = "facebook" | "instagram" | "linkedin" | "twitter" | "youtube" | "tiktok";

export type SocialPost = {
  id: string;
  user_id: string;
  platform: SocialPlatform;
  content: string;
  image_url?: string;
  video_url?: string;
  scheduled_time?: string;
  status: "draft" | "scheduled" | "published" | "failed";
  created_at: string;
  updated_at: string;
};

export type SocialAccount = {
  id: string;
  user_id: string;
  platform: SocialPlatform;
  account_name: string;
  access_token?: string;
  is_connected: boolean;
};

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");
  return user.id;
}

export const socialPostsService = {
  async generateContent(topic: string, platform: SocialPlatform): Promise<string> {
    const userId = await getUserId();
    
    const response = await fetch("/api/generate-social-post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, platform, userId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate content");
    }

    const data = await response.json();
    return data.content;
  },

  async createPost(post: {
    platform: SocialPlatform;
    content: string;
    image_url?: string;
    video_url?: string;
    scheduled_time?: string;
  }): Promise<SocialPost> {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from("social_posts")
      .insert({
        user_id: userId,
        platform: post.platform,
        content: post.content,
        image_url: post.image_url,
        video_url: post.video_url,
        scheduled_time: post.scheduled_time,
        status: post.scheduled_time ? "scheduled" : "draft",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPosts(): Promise<SocialPost[]> {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from("social_posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updatePost(postId: string, updates: Partial<SocialPost>): Promise<void> {
    const { error } = await supabase
      .from("social_posts")
      .update(updates)
      .eq("id", postId);

    if (error) throw error;
  },

  async deletePost(postId: string): Promise<void> {
    const { error } = await supabase
      .from("social_posts")
      .delete()
      .eq("id", postId);

    if (error) throw error;
  },

  async getAccounts(): Promise<SocialAccount[]> {
    const userId = await getUserId();

    const { data, error } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return data || [];
  },
};