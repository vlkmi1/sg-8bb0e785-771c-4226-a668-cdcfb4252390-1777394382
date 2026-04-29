import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type GeneratedVideo = Tables<"generated_videos">;
export type VideoProvider = "runway" | "runwayml" | "pika" | "sora" | "kling" | "stability-video";

export const videoGenerationService = {
  async generateVideo(params: {
    prompt: string;
    provider: VideoProvider | string;
    duration?: number;
  }): Promise<GeneratedVideo | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Simulace generování - v reálné aplikaci by zde bylo volání API
    const mockVideoUrl = `https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`;

    const { data, error } = await supabase
      .from("generated_videos")
      .insert({
        user_id: user.id,
        prompt: params.prompt,
        video_url: mockVideoUrl,
        provider: params.provider,
        model_name: params.provider,
        duration: params.duration || 5,
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
    const { data: { user } } = await supabase.auth.getUser();
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
    const { data: { user } } = await supabase.auth.getUser();
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