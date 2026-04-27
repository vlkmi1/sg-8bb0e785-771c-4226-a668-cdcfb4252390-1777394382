import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { authState } from "./authStateService";

export type GeneratedVideo = Tables<"generated_videos">;
export type VideoProvider = "runway" | "pika" | "sora" | "kling";

export const videoGenerationService = {
  async generateVideo(params: {
    prompt: string;
    videoUrl: string;
    thumbnailUrl?: string;
    provider: string;
    modelName: string;
    duration?: number;
    creditsUsed: number;
  }): Promise<GeneratedVideo | null> {
    const user = await authState.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("generated_videos")
      .insert({
        user_id: user.id,
        prompt: params.prompt,
        video_url: params.videoUrl,
        thumbnail_url: params.thumbnailUrl,
        provider: params.provider,
        model_name: params.modelName,
        duration: params.duration || 5,
        credits_used: params.creditsUsed,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating generated video:", error);
      throw error;
    }

    return data;
  },

  async getGeneratedVideos(): Promise<GeneratedVideo[]> {
    const user = await authState.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("generated_videos")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching generated videos:", error);
      return [];
    }

    return data || [];
  },

  async deleteVideo(id: string): Promise<boolean> {
    const user = await authState.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from("generated_videos")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting generated video:", error);
      throw error;
    }

    return true;
  },
};