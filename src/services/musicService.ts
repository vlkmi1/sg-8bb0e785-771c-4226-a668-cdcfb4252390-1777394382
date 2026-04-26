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

    // Simulace generování - v produkci by volalo API
    setTimeout(async () => {
      const mockAudioUrl = `https://example.com/music/${data.id}.mp3`;
      await supabase
        .from("music_generations")
        .update({ 
          audio_url: mockAudioUrl, 
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);
    }, 3000);

    return data;
  },

  async getGenerations(): Promise<MusicGeneration[]> {
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