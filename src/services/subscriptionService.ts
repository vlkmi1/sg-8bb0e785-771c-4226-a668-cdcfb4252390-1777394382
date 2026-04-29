import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Subscription = Tables<"user_subscriptions">;
export type SubscriptionPlan = Tables<"subscription_plans">;
export type SubscriptionTier = "free" | "basic" | "pro" | "enterprise";

export interface SubscriptionWithPlan extends Subscription {
  plan?: SubscriptionPlan;
}

export const subscriptionService = {
  async getCurrentSubscription(): Promise<SubscriptionWithPlan | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        plan:plan_id (*)
      `)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching subscription:", error);
      return null;
    }

    return data as unknown as SubscriptionWithPlan;
  },

  async getUserSubscription(userId: string): Promise<SubscriptionWithPlan | null> {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        plan:plan_id (*)
      `)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching user subscription:", error);
      return null;
    }

    return data as unknown as SubscriptionWithPlan;
  },

  async getAllPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true });

    if (error) {
      console.error("Error fetching plans:", error);
      return [];
    }

    // Parse string numeric values to actual numbers for React rendering
    return (data || []).map(plan => ({
      ...plan,
      price: Number(plan.price),
      credits_included: Number(plan.credits_included),
      features: Array.isArray(plan.features) ? plan.features : []
    })) as unknown as SubscriptionPlan[];
  },

  async createSubscription(planId: string): Promise<Subscription> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const { data, error } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: "active",
        started_at: startDate.toISOString(),
        expires_at: endDate.toISOString(),
      } as any)
      .select()
      .single();

    if (error) {
      console.error("Error creating subscription:", error);
      throw error;
    }

    return data;
  },

  async updateUserSubscription(userId: string, planId: string): Promise<void> {
    // First, cancel any existing active subscriptions
    await supabase
      .from("user_subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      } as any)
      .eq("user_id", userId)
      .eq("status", "active");

    // Create new subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    const { error } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        plan_id: planId,
        status: "active",
        started_at: startDate.toISOString(),
        expires_at: endDate.toISOString(),
      } as any);

    if (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }
  },

  async upgradeSubscription(newPlanId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    await this.updateUserSubscription(user.id, newPlanId);
  },

  async cancelSubscription(subscriptionId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("user_subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", subscriptionId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error cancelling subscription:", error);
      throw error;
    }
  },

  async getSubscriptionHistory(): Promise<SubscriptionWithPlan[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        plan:plan_id (*)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching subscription history:", error);
      return [];
    }

    return (data || []) as unknown as SubscriptionWithPlan[];
  },

  getPlanBadgeColor(tier: string): string {
    const colors: Record<string, string> = {
      free: "bg-muted text-muted-foreground",
      basic: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      pro: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      enterprise: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    };
    return colors[tier] || colors.free;
  },

  getPlanDisplayName(tier: string): string {
    const names: Record<string, string> = {
      free: "Free",
      basic: "Basic",
      pro: "Pro",
      enterprise: "Premium",
    };
    return names[tier] || "Free";
  },
};