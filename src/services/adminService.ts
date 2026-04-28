import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { authState } from "./authStateService";

export type Profile = Tables<"profiles">;

export interface CreditUpdate {
  user_id: string;
  amount: number;
  description: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  total_credits_distributed: number;
}

export interface AdminSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string;
}

export const adminService = {
  async isAdmin(): Promise<boolean> {
    try {
      const user = await authState.getUser();
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
    } catch (error) {
      console.error("Error in isAdmin:", error);
      return false;
    }
  },

  async getAdminSettings(): Promise<AdminSetting[]> {
    const { data, error } = await supabase.from("admin_settings" as any).select("*");
    if (error) {
      console.error("Error fetching admin settings:", error);
      return [];
    }
    return data || [];
  },

  async saveAdminSetting(key: string, value: any): Promise<void> {
    const { error } = await supabase.from("admin_settings" as any).upsert({ setting_key: key, setting_value: value });
    if (error) {
      console.error("Error saving admin setting:", error);
      throw error;
    }
  },

  async getAllUsers(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
      throw error;
    }

    return data || [];
  },

  async updateUserCredits(update: CreditUpdate): Promise<void> {
    const { error } = await supabase.rpc("admin_update_credits", {
      p_user_id: update.user_id,
      p_amount: update.amount,
      p_description: update.description,
    });

    if (error) {
      console.error("Error updating credits:", error);
      throw error;
    }
  },

  async getUserStats(): Promise<UserStats> {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, credits, last_sign_in_at");

    const totalUsers = profiles?.length || 0;
    const activeUsers =
      profiles?.filter((p) => {
        if (!p.last_sign_in_at) return false;
        const lastSignIn = new Date(p.last_sign_in_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return lastSignIn > thirtyDaysAgo;
      }).length || 0;

    const totalCreditsDistributed =
      profiles?.reduce((sum, p) => sum + (p.credits || 0), 0) || 0;

    return {
      total_users: totalUsers,
      active_users: activeUsers,
      total_credits_distributed: totalCreditsDistributed,
    };
  },

  async toggleAdminStatus(userId: string, isAdmin: boolean): Promise<void> {
    const { error } = await supabase
      .from("profiles")
      .update({ is_admin: isAdmin })
      .eq("id", userId);

    if (error) {
      console.error("Error toggling admin status:", error);
      throw error;
    }
  },

  async getCreditTransactions() {
    const { data, error } = await supabase
      .from("credit_transactions")
      .select(`
        *,
        profiles:user_id (
          email,
          full_name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching credit transactions:", error);
      throw error;
    }

    return data || [];
  },
};