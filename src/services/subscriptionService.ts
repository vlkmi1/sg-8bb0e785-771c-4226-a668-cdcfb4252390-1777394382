import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { authState } from "./authStateService";

export type Subscription = Tables<"user_subscriptions">;
export type SubscriptionPlan = "free" | "basic" | "pro" | "enterprise";

export const subscriptionService = {
  async getCurrentSubscription(): Promise<Subscription | null> {
    const user = await authState.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching subscription:", error);
      return null;
    }

    return data;
  },

  async createSubscription(plan: SubscriptionPlan): Promise<Subscription> {
    const user = await authState.getUser();
    if (!user) throw new Error("Not authenticated");

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const { data, error } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: user.id,
        plan_id: plan,
        status: "active",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      } as any)
      .select()
      .single();

    if (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }

    return data;
  },

  async upgradeSubscription(
    subscriptionId: string,
    newPlan: SubscriptionPlan
  ): Promise<void> {
    const { error } = await supabase
      .from("user_subscriptions")
      .update({
        plan_id: newPlan,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", subscriptionId);

    if (error) {
      console.error("Error upgrading subscription:", error);
      throw error;
    }
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const user = await authState.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("user_subscriptions")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error cancelling subscription:", error);
      throw error;
    }
  },

  async getSubscriptionHistory(): Promise<Subscription[]> {
    const user = await authState.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching subscription history:", error);
      return [];
    }

    return data || [];
  },

  getPlanLimits(plan: SubscriptionPlan) {
    const limits = {
      free: {
        credits_per_month: 10,
        max_conversations: 5,
        max_images: 3,
        max_videos: 0,
        support: "community",
      },
      basic: {
        credits_per_month: 100,
        max_conversations: 50,
        max_images: 30,
        max_videos: 5,
        support: "email",
      },
      pro: {
        credits_per_month: 500,
        max_conversations: -1,
        max_images: -1,
        max_videos: 50,
        support: "priority",
      },
      enterprise: {
        credits_per_month: -1,
        max_conversations: -1,
        max_images: -1,
        max_videos: -1,
        support: "dedicated",
      },
    };

    return limits[plan];
  },
};