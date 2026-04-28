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
  id?: string;
  provider?: string;
  api_key?: string;
  setting_key?: string;
  setting_value?: any;
  description?: string;
  balance?: number;
  balance_updated_at?: string;
  last_used_at?: string;
  request_count?: number;
}

export interface APIUsageStats {
  provider: string;
  total_requests: number;
  requests_today: number;
  last_30_days: Array<{ date: string; count: number }>;
  total_cost: number;
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
    return (data as AdminSetting[]) || [];
  },

  async saveAdminSetting(key: string, value: any): Promise<void> {
    const { error } = await supabase.from("admin_settings" as any).upsert({ 
      provider: key, 
      api_key: value,
      updated_at: new Date().toISOString()
    });
    if (error) {
      console.error("Error saving admin setting:", error);
      throw error;
    }
  },

  async getAPIUsageStats(provider?: string): Promise<APIUsageStats[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let query = supabase
      .from("api_usage_stats" as any)
      .select("*")
      .gte("date", thirtyDaysAgo.toISOString().split("T")[0]);

    if (provider) {
      query = query.eq("provider", provider);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching usage stats:", error);
      return [];
    }

    // Aggregate stats by provider
    const statsByProvider = new Map<string, APIUsageStats>();

    (data || []).forEach((stat: any) => {
      const existing = statsByProvider.get(stat.provider) || {
        provider: stat.provider,
        total_requests: 0,
        requests_today: 0,
        last_30_days: [],
        total_cost: 0,
      };

      existing.total_requests += stat.request_count;
      existing.total_cost += parseFloat(stat.cost_estimate || 0);

      const today = new Date().toISOString().split("T")[0];
      if (stat.date === today) {
        existing.requests_today += stat.request_count;
      }

      const dateEntry = existing.last_30_days.find((d: any) => d.date === stat.date);
      if (dateEntry) {
        dateEntry.count += stat.request_count;
      } else {
        existing.last_30_days.push({ date: stat.date, count: stat.request_count });
      }

      statsByProvider.set(stat.provider, existing);
    });

    return Array.from(statsByProvider.values());
  },

  async trackAPIUsage(provider: string, requestType: string, tokensUsed?: number, costEstimate?: number): Promise<void> {
    const today = new Date().toISOString().split("T")[0];

    try {
      // Try to increment existing record
      const { data: existing } = await supabase
        .from("api_usage_stats" as any)
        .select("*")
        .eq("provider", provider)
        .eq("request_type", requestType)
        .eq("date", today)
        .single();

      if (existing) {
        await supabase
          .from("api_usage_stats" as any)
          .update({
            request_count: existing.request_count + 1,
            tokens_used: (existing.tokens_used || 0) + (tokensUsed || 0),
            cost_estimate: (parseFloat(existing.cost_estimate) || 0) + (costEstimate || 0),
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("api_usage_stats" as any).insert({
          provider,
          request_type: requestType,
          request_count: 1,
          tokens_used: tokensUsed || 0,
          cost_estimate: costEstimate || 0,
          date: today,
        });
      }

      // Update last_used_at and request_count in admin_settings
      await supabase
        .from("admin_settings" as any)
        .update({
          last_used_at: new Date().toISOString(),
          request_count: supabase.rpc("increment_request_count" as any, { provider_name: provider }),
        })
        .eq("provider", provider);
    } catch (error) {
      console.error("Error tracking API usage:", error);
    }
  },

  async checkAPIBalance(provider: string, apiKey: string): Promise<any> {
    try {
      const response = await fetch("/api/check-api-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey }),
      });

      if (response.ok) {
        return await response.json();
      }

      return { success: false, message: "Failed to check balance" };
    } catch (error) {
      console.error("Error checking balance:", error);
      return { success: false, message: error.message };
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