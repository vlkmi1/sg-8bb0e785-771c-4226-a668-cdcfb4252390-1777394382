import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type AIInfluencer = Tables<"ai_influencers">;
export type InfluencerVideo = Tables<"influencer_videos"> & {
  ai_influencers?: {
    name: string;
    avatar_url: string | null;
  } | null;
};

export type VoiceType = "neutral" | "energetic" | "calm" | "professional" | "friendly";
export type Personality = "professional" | "casual" | "humorous" | "inspirational" | "educational";

export const aiInfluencerService = {
  // AI Influencers
  async getInfluencers(): Promise<AIInfluencer[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("ai_influencers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching influencers:", error);
      throw error;
    }

    return data || [];
  },

  async createInfluencer(influencer: {
    name: string;
    description?: string;
    avatar_url?: string;
    voice_type: VoiceType;
    personality: Personality;
    language?: string;
  }): Promise<AIInfluencer> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("ai_influencers")
      .insert({
        user_id: user.id,
        name: influencer.name,
        description: influencer.description,
        avatar_url: influencer.avatar_url,
        voice_type: influencer.voice_type,
        personality: influencer.personality,
        language: influencer.language || "cs",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating influencer:", error);
      throw error;
    }

    return data;
  },

  async updateInfluencer(id: string, updates: Partial<AIInfluencer>): Promise<void> {
    const { error } = await supabase
      .from("ai_influencers")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating influencer:", error);
      throw error;
    }
  },

  async deleteInfluencer(id: string): Promise<void> {
    const { error } = await supabase
      .from("ai_influencers")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting influencer:", error);
      throw error;
    }
  },

  // Influencer Videos
  async getVideos(influencerId?: string): Promise<InfluencerVideo[]> {
    let query = supabase
      .from("influencer_videos")
      .select("*, ai_influencers(name, avatar_url)")
      .order("created_at", { ascending: false });

    if (influencerId) {
      query = query.eq("influencer_id", influencerId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching videos:", error);
      throw error;
    }

    return data || [];
  },

  async createVideo(video: {
    influencer_id: string;
    script: string;
  }): Promise<InfluencerVideo> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Get influencer details for voice/personality
    const { data: influencer } = await supabase
      .from("ai_influencers")
      .select("voice_type, personality")
      .eq("id", video.influencer_id)
      .single();

    if (!influencer) {
      throw new Error("Influencer not found");
    }

    // Call API to generate video
    const response = await fetch("/api/generate-influencer-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({
        influencerId: video.influencer_id,
        script: video.script,
        voiceType: influencer.voice_type,
        personality: influencer.personality,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate video");
    }

    const result = await response.json();
    return result.video;
  },

  async deleteVideo(id: string): Promise<void> {
    const { error } = await supabase
      .from("influencer_videos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting video:", error);
      throw error;
    }
  },
};