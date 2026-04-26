import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type VideoProvider = "runwayml" | "pika" | "stability-video";

export interface GenerateVideoParams {
  prompt: string;
  provider: VideoProvider;
  duration?: number;
  model_name?: string;
}

export type GeneratedVideo = Tables<"generated_videos">;

export const videoGenerationService = {
  async generateVideo(params: GenerateVideoParams): Promise<GeneratedVideo> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Simulate video generation (in production, this would call actual AI API)
    const mockVideoUrl = `https://example.com/video-${Date.now()}.mp4`;

    const { data, error } = await supabase
      .from("generated_videos")
      .insert({
        user_id: user.id,
        prompt: params.prompt,
        video_url: mockVideoUrl,
        provider: params.provider,
        duration: params.duration || 5,
        model_name: params.model_name,
      })
      .select()
      .single();

    if (error) {
      console.error("Error generating video:", error);
      throw error;
    }

    return data;
  },

  async getGeneratedVideos(): Promise<GeneratedVideo[]> {
    const { data, error } = await supabase
      .from("generated_videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching videos:", error);
      throw error;
    }

    return data || [];
  },

  async deleteVideo(id: string): Promise<void> {
    const { error } = await supabase
      .from("generated_videos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting video:", error);
      throw error;
    }
  },
};