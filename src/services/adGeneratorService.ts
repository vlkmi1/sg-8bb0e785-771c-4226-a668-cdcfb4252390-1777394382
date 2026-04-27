import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { authState } from "./authStateService";

export type AdGeneration = Tables<"ad_generations">;
export type AdPlatform = "facebook" | "instagram" | "linkedin" | "google" | "tiktok";
export type AdFormat = "carousel" | "single_image" | "video" | "story";

export const adGeneratorService = {
  async getAds(): Promise<AdGeneration[]> {
    const user = await authState.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("ad_generations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching ads:", error);
      throw error;
    }

    return data || [];
  },

  async createAd(params: {
    productDescription: string;
    targetAudience: string;
    platform: AdPlatform;
    adFormat: AdFormat;
    headline: string;
    description: string;
    cta: string;
    hashtags: string;
    imageSuggestions: string;
    modelUsed: string;
  }): Promise<AdGeneration> {
    const user = await authState.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("ad_generations")
      .insert({
        user_id: user.id,
        product_description: params.productDescription,
        target_audience: params.targetAudience,
        platform: params.platform,
        ad_format: params.adFormat,
        headline: params.headline,
        description: params.description,
        cta: params.cta,
        hashtags: params.hashtags,
        image_suggestions: params.imageSuggestions,
        model_used: params.modelUsed,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating ad:", error);
      throw error;
    }

    return data;
  },

  async deleteAd(adId: string): Promise<void> {
    const { error } = await supabase
      .from("ad_generations")
      .delete()
      .eq("id", adId);

    if (error) {
      console.error("Error deleting ad:", error);
      throw error;
    }
  },
};