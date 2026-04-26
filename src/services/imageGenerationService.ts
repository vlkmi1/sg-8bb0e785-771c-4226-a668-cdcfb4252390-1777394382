import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ImageProvider = "openai" | "stability" | "midjourney";

export interface GenerateImageParams {
  prompt: string;
  provider: ImageProvider;
  size?: string;
  model_name?: string;
}

export type GeneratedImage = Tables<"generated_images">;

export const imageGenerationService = {
  async generateImage(params: GenerateImageParams): Promise<GeneratedImage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Simulace generování - v reálné aplikaci by zde bylo volání API
    const mockImageUrl = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1024&h=1024&fit=crop`;
    
    const { data, error } = await supabase
      .from("generated_images")
      .insert({
        user_id: user.id,
        prompt: params.prompt,
        image_url: mockImageUrl,
        provider: params.provider,
        model_name: params.model_name || "default",
        size: params.size || "1024x1024",
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving generated image:", error);
      throw error;
    }

    return data;
  },

  async getGeneratedImages(): Promise<GeneratedImage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("generated_images")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching generated images:", error);
      throw error;
    }

    return data || [];
  },

  async deleteImage(imageId: string): Promise<void> {
    const { error } = await supabase
      .from("generated_images")
      .delete()
      .eq("id", imageId);

    if (error) {
      console.error("Error deleting image:", error);
      throw error;
    }
  },
};