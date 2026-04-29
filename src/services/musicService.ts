import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Create initial record with processing status
    const { data: initialRecord, error: insertError } = await supabase
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

    if (insertError) throw insertError;

    // Call API to generate music (non-blocking)
    fetch("/api/generate-music", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
      body: JSON.stringify({
        generationId: initialRecord.id,
        prompt: params.prompt,
        genre: params.genre,
        mood: params.mood,
        duration: params.duration,
        provider: params.provider,
        userId: user.id,
      }),
    }).catch(error => {
      console.error("Music generation API error:", error);
      // Update status to failed if API call fails
      supabase
        .from("music_generations")
        .update({ status: "failed" })
        .eq("id", initialRecord.id)
        .then(() => {});
    });

    return initialRecord;
  },

  async getGenerations(): Promise<MusicGeneration[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("music_generations")
      .select("*")
      .eq("user_id", user.id)
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from("music_generations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

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