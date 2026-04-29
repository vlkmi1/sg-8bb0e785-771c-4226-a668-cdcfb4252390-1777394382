import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type VoiceProvider = "openai" | "elevenlabs" | "google";

export interface CreateVoiceConversationParams {
  provider: VoiceProvider;
  audio_url?: string;
  transcript?: string;
  response_text?: string;
  response_audio_url?: string;
  duration?: number;
}

export type VoiceConversation = Tables<"voice_conversations">;

export const voiceService = {
  async createVoiceConversation(params: CreateVoiceConversationParams): Promise<VoiceConversation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("voice_conversations")
      .insert({
        user_id: user.id,
        provider: params.provider,
        audio_url: params.audio_url,
        transcript: params.transcript,
        response_text: params.response_text,
        response_audio_url: params.response_audio_url,
        duration: params.duration,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating voice conversation:", error);
      throw error;
    }

    return data;
  },

  async getVoiceConversations(): Promise<VoiceConversation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("voice_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching voice conversations:", error);
      throw error;
    }

    return data || [];
  },

  async deleteVoiceConversation(id: string): Promise<void> {
    const { error } = await supabase
      .from("voice_conversations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting voice conversation:", error);
      throw error;
    }
  },

  async processVoiceMessage(audioData: string, provider: VoiceProvider): Promise<{
    transcript: string;
    response: string;
    audioUrl: string;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    try {
      const response = await fetch("/api/voice-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioData,
          provider,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process voice message");
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error("Error processing voice message:", error);
      throw new Error(error.message || "Failed to process voice message");
    }
  },

  async uploadAudio(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("voice-conversations")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Error uploading audio:", uploadError);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("voice-conversations")
      .getPublicUrl(fileName);

    return publicUrl;
  },
};