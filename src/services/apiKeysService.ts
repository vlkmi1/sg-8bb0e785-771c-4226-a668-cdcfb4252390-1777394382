import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type AIProvider = 
  | "openai" 
  | "anthropic" 
  | "google" 
  | "mistral" 
  | "cohere"
  | "nano-bannana"
  | "nano-bannana-pro"
  | "stability"
  | "midjourney";

export type ApiKey = Tables<"api_keys">;

export interface CreateApiKeyData {
  provider: AIProvider;
  encrypted_key: string;
}

export const apiKeysService = {
  async getApiKeys(): Promise<ApiKey[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching API keys:", error);
      throw error;
    }

    return data || [];
  },

  async getApiKeyByProvider(provider: AIProvider): Promise<ApiKey | null> {
    const { data, error } = await supabase
      .from("api_keys")
      .select("*")
      .eq("provider", provider)
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Error fetching API key:", error);
      throw error;
    }

    return data;
  },

  async createOrUpdateApiKey(keyData: CreateApiKeyData): Promise<ApiKey> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("api_keys")
      .upsert({
        user_id: user.id,
        provider: keyData.provider,
        encrypted_key: keyData.encrypted_key,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,provider"
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating/updating API key:", error);
      throw error;
    }

    return data;
  },

  async deleteApiKey(id: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from("api_keys")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Error deleting API key:", error);
      throw error;
    }

    return true;
  },
};