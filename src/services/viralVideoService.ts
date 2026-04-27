import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { authState } from "./authStateService";

export type ViralVideo = Tables<"viral_videos">;
export type Platform = "tiktok" | "reels" | "shorts";
export type VideoTrend = "transition" | "dance" | "comedy" | "tutorial" | "challenge" | "aesthetic" | "trending-sound";
export type VideoStyle = "cinematic" | "minimal" | "energetic" | "dark" | "colorful" | "retro" | "modern";
export type VideoEffect = "glitch" | "zoom" | "slow-motion" | "fast-forward" | "reverse" | "split-screen" | "green-screen";

export interface CreateViralVideoParams {
  prompt: string;
  trend: VideoTrend;
  style: VideoStyle;
  platform: Platform;
  duration: 15 | 30 | 60;
  effects: VideoEffect[];
  provider: string;
}

export const viralVideoService = {
  async getVideos(): Promise<ViralVideo[]> {
    const { data, error } = await supabase
      .from("viral_videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createVideo(params: CreateViralVideoParams): Promise<ViralVideo> {
    const { data: { user } } = await authState.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("viral_videos")
      .insert({
        user_id: user.id,
        prompt: params.prompt,
        trend: params.trend,
        style: params.style,
        platform: params.platform,
        duration: params.duration,
        effects: params.effects,
        provider: params.provider,
        status: "processing",
      })
      .select()
      .single();

    if (error) throw error;

    // Simulate AI video generation
    setTimeout(async () => {
      const mockVideoUrl = await this.generateMockVideo(params);
      await supabase
        .from("viral_videos")
        .update({ 
          status: "completed",
          video_url: mockVideoUrl,
          thumbnail_url: `https://picsum.photos/seed/${data.id}/720/1280`
        })
        .eq("id", data.id);
    }, 5000);

    return data;
  },

  async generateMockVideo(params: CreateViralVideoParams): Promise<string> {
    // Mock video URL - in production would call actual AI provider
    return `https://example.com/viral-video-${Date.now()}.mp4`;
  },

  async deleteVideo(id: string): Promise<void> {
    const { error } = await supabase
      .from("viral_videos")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async uploadVideo(file: File): Promise<string> {
    const { data: { user } } = await authState.getUser();
    if (!user) throw new Error("User not authenticated");

    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from("viral-videos")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("viral-videos")
      .getPublicUrl(fileName);

    return publicUrl;
  },

  getCreditsRequired(duration: number): number {
    switch (duration) {
      case 15: return 8;
      case 30: return 12;
      case 60: return 20;
      default: return 8;
    }
  },
};