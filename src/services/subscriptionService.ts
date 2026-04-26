import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type SubscriptionPlan = Tables<"subscription_plans">;
export type UserSubscription = Tables<"user_subscriptions"> & {
  subscription_plans?: SubscriptionPlan;
};
export type SubscriptionTier = "free" | "basic" | "pro" | "enterprise";

export const subscriptionService = {
  async getPlans(): Promise<SubscriptionPlan[]> {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getCurrentSubscription(): Promise<UserSubscription | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("*, subscription_plans(*)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data as UserSubscription | null;
  },

  async subscribeToPlan(planId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Check if user already has active subscription
    const current = await this.getCurrentSubscription();
    if (current) {
      // Cancel current subscription
      await supabase
        .from("user_subscriptions")
        .update({ 
          status: "cancelled", 
          cancelled_at: new Date().toISOString(),
          auto_renew: false 
        })
        .eq("id", current.id);
    }

    // Create new subscription
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { error } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: user.id,
        plan_id: planId,
        status: "active",
        expires_at: expiresAt.toISOString(),
      });

    if (error) throw error;

    // Add included credits
    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("credits_included")
      .eq("id", planId)
      .single();

    if (plan && plan.credits_included > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", user.id)
          .single();

        await supabase
          .from("profiles")
          .update({ credits: (profile?.credits || 0) + plan.credits_included })
          .eq("id", user.id);
      }
    }
  },

  async cancelSubscription(): Promise<void> {
    const current = await this.getCurrentSubscription();
    if (!current) throw new Error("No active subscription");

    const { error } = await supabase
      .from("user_subscriptions")
      .update({ 
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        auto_renew: false
      })
      .eq("id", current.id);

    if (error) throw error;
  },

  async hasModuleAccess(moduleName: string): Promise<boolean> {
    const subscription = await this.getCurrentSubscription();
    
    // No subscription = free tier (only chat)
    if (!subscription || !subscription.subscription_plans) {
      return moduleName === "chat";
    }

    const modules = subscription.subscription_plans.modules as string[] || [];
    return modules.includes(moduleName);
  },
};