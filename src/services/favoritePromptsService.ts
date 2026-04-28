import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { authState } from "./authStateService";

export type FavoritePrompt = Tables<"favorite_prompts">;
export type PromptCategory = "chat" | "image" | "video" | "voice" | "ad" | "summary" | "general";

export interface CreatePromptData {
  title: string;
  prompt_text: string;
  category: PromptCategory;
  tags?: string[];
  is_favorite?: boolean;
}

export const favoritePromptsService = {
  async getAllPrompts(): Promise<FavoritePrompt[]> {
    const user = await authState.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("favorite_prompts")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching prompts:", error);
      throw error;
    }

    return data || [];
  },

  async getPromptsByCategory(category: PromptCategory): Promise<FavoritePrompt[]> {
    const user = await authState.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("favorite_prompts")
      .select("*")
      .eq("user_id", user.id)
      .eq("category", category)
      .order("use_count", { ascending: false });

    if (error) {
      console.error("Error fetching prompts by category:", error);
      throw error;
    }

    return data || [];
  },

  async getFavorites(): Promise<FavoritePrompt[]> {
    const user = await authState.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("favorite_prompts")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_favorite", true)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching favorites:", error);
      throw error;
    }

    return data || [];
  },

  async createPrompt(promptData: CreatePromptData): Promise<FavoritePrompt> {
    const user = await authState.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("favorite_prompts")
      .insert({
        user_id: user.id,
        title: promptData.title,
        prompt_text: promptData.prompt_text,
        category: promptData.category,
        tags: promptData.tags || [],
        is_favorite: promptData.is_favorite || false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating prompt:", error);
      throw error;
    }

    return data;
  },

  async updatePrompt(promptId: string, updates: Partial<FavoritePrompt>): Promise<void> {
    const { error } = await supabase
      .from("favorite_prompts")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", promptId);

    if (error) {
      console.error("Error updating prompt:", error);
      throw error;
    }
  },

  async deletePrompt(promptId: string): Promise<void> {
    const { error } = await supabase
      .from("favorite_prompts")
      .delete()
      .eq("id", promptId);

    if (error) {
      console.error("Error deleting prompt:", error);
      throw error;
    }
  },

  async incrementUseCount(promptId: string): Promise<void> {
    const { data: prompt } = await supabase
      .from("favorite_prompts")
      .select("use_count")
      .eq("id", promptId)
      .single();

    if (prompt) {
      await this.updatePrompt(promptId, {
        use_count: (prompt.use_count || 0) + 1,
      });
    }
  },

  async toggleFavorite(promptId: string): Promise<void> {
    const { data: prompt } = await supabase
      .from("favorite_prompts")
      .select("is_favorite")
      .eq("id", promptId)
      .single();

    if (prompt) {
      await this.updatePrompt(promptId, {
        is_favorite: !prompt.is_favorite,
      });
    }
  },

  async searchPrompts(query: string): Promise<FavoritePrompt[]> {
    const user = await authState.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("favorite_prompts")
      .select("*")
      .eq("user_id", user.id)
      .or(`title.ilike.%${query}%,prompt_text.ilike.%${query}%`)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error searching prompts:", error);
      throw error;
    }

    return data || [];
  },
};