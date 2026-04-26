import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type AdminSetting = Tables<"admin_settings">;

export interface CreateAdminSettingParams {
  provider: string;
  api_key: string;
  model_name?: string;
  is_active?: boolean;
}

export interface UpdateAdminSettingParams {
  api_key?: string;
  model_name?: string;
  is_active?: boolean;
}

export const adminService = {
  async isAdmin(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error checking admin status:", error);
      return false;
    }

    return data?.is_admin || false;
  },

  async getAdminSettings(): Promise<AdminSetting[]> {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("*")
      .order("provider");

    if (error) {
      console.error("Error fetching admin settings:", error);
      throw error;
    }

    return data || [];
  },

  async getAdminSetting(provider: string): Promise<AdminSetting | null> {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("*")
      .eq("provider", provider)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      console.error("Error fetching admin setting:", error);
      throw error;
    }

    return data;
  },

  async saveAdminSetting(provider: string, apiKey: string): Promise<AdminSetting> {
    const existing = await this.getAdminSetting(provider);
    if (existing) {
      return this.updateAdminSetting(provider, { api_key: apiKey });
    } else {
      return this.createAdminSetting({ provider, api_key: apiKey });
    }
  },

  async createAdminSetting(params: CreateAdminSettingParams): Promise<AdminSetting> {
    const { data, error } = await supabase
      .from("admin_settings")
      .insert({
        provider: params.provider,
        api_key: params.api_key,
        model_name: params.model_name,
        is_active: params.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating admin setting:", error);
      throw error;
    }

    return data;
  },

  async updateAdminSetting(provider: string, params: UpdateAdminSettingParams): Promise<AdminSetting> {
    const { data, error } = await supabase
      .from("admin_settings")
      .update({
        ...params,
        updated_at: new Date().toISOString(),
      })
      .eq("provider", provider)
      .select()
      .single();

    if (error) {
      console.error("Error updating admin setting:", error);
      throw error;
    }

    return data;
  },

  async deleteAdminSetting(provider: string): Promise<void> {
    const { error } = await supabase
      .from("admin_settings")
      .delete()
      .eq("provider", provider);

    if (error) {
      console.error("Error deleting admin setting:", error);
      throw error;
    }
  },

  async toggleAdminSetting(provider: string, isActive: boolean): Promise<void> {
    const { error } = await supabase
      .from("admin_settings")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("provider", provider);

    if (error) {
      console.error("Error toggling admin setting:", error);
      throw error;
    }
  },
};