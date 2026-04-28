import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { authState } from "./authStateService";

export type MusicGeneration = Tables<"music_generations">;

export type MusicProvider = "suno" | "musicgen" | "mubert" | "aiva" | "soundraw";
export type MusicStatus = "processing" | "completed" | "failed";

export interface CreateMusicParams {
  prompt: string;
  genre?: string;
  mood?: string;
  duration: number;
  provider: MusicProvider;
}

export const musicService = {
  async createMusic(params: CreateMusicParams): Promise<MusicGeneration> {
    const user = await authState.getUser();
    if (!user) throw new Error("User not authenticated");

    // Create initial record with processing status
    const { data, error } = await supabase
      .from("music_generations")
      .insert({
        user_id: user.id,
        prompt: params.prompt,
        genre: params.genre,
        mood: params.mood,
        duration: params.duration,
        provider: params.provider,
        status: "processing",
      })
      .select()
      .single();

    if (error) throw error;

    // Call API to generate music in background
    try {
      const response = await fetch("/api/generate-music", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          prompt: params.prompt,
          genre: params.genre,
          mood: params.mood,
          duration: params.duration,
          provider: params.provider,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate music");
      }

      const result = await response.json();
      
      // Update record with completed status
      await supabase
        .from("music_generations")
        .update({ 
          audio_url: result.audioUrl,
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);

    } catch (error) {
      console.error("Music generation error:", error);
      // Update status to failed
      await supabase
        .from("music_generations")
        .update({ 
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);
      throw error;
    }

    return data;
  },

  async getGenerations(): Promise<MusicGeneration[]> {
    const user = await authState.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("music_generations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getGeneration(id: string): Promise<MusicGeneration | null> {
    const { data, error } = await supabase
      .from("music_generations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async deleteGeneration(id: string): Promise<void> {
    const user = await authState.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from("music_generations")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async uploadAudio(file: File, userId: string, generationId: string): Promise<string> {
    const fileName = `${userId}/${generationId}-${Date.now()}.mp3`;
    
    const { error: uploadError } = await supabase.storage
      .from("music-generations")
      .upload(fileName, file, {
        contentType: "audio/mpeg",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("music-generations")
      .getPublicUrl(fileName);

    return publicUrl;
  },
};