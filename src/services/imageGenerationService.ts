import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { authState } from "./authStateService";

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
    const user = await authState.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get session token for API call
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No session");

    // Call API endpoint to generate image
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        prompt: params.prompt,
        provider: params.provider,
        size: params.size || "1024x1024",
        model: params.model_name,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Image generation failed");
    }

    const data = await response.json();
    return data;
  },

  async getGeneratedImages(): Promise<GeneratedImage[]> {
    const user = await authState.getUser();
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