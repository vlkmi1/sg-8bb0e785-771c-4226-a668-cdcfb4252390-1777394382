import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { authState } from "./authStateService";

export type ReferralCode = Tables<"referral_codes">;
export type Referral = Tables<"referrals">;
export type ReferralEarning = Tables<"referral_earnings">;
export type ReferralPayout = Tables<"referral_payouts">;
export type CommissionSetting = Tables<"admin_commission_settings">;

export interface AffiliateStats {
  totalClicks: number;
  totalConversions: number;
  totalEarned: number;
  pendingEarnings: number;
  availableForPayout: number;
  totalReferrals: number;
  activeReferrals: number;
}

export interface CreatePayoutParams {
  amount: number;
  method: "bank_transfer" | "paypal" | "credits";
  bank_account?: string;
  paypal_email?: string;
  notes?: string;
}

export const affiliateService = {
  // Get user's referral code
  async getReferralCode(): Promise<ReferralCode | null> {
    const user = await authState.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  // Create referral code if doesn't exist
  async createReferralCode(): Promise<ReferralCode | null> {
    const user = await authState.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Call generate_referral_code function
    const { data: codeData, error: codeError } = await supabase
      .rpc("generate_referral_code");

    if (codeError) throw codeError;

    const { data, error } = await supabase
      .from("referral_codes")
      .insert({
        user_id: user.id,
        code: codeData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Track click on referral link
  async trackClick(code: string): Promise<void> {
    const { error } = await supabase
      .rpc("increment_referral_click", {
        code_val: code,
      });

    if (error) console.error("Error tracking click:", error);
  },

  // Get affiliate statistics
  async getStats(): Promise<AffiliateStats> {
    const user = await authState.getUser();
    if (!user) throw new Error("User not authenticated");

    const [codeData, referralsData, earningsData] = await Promise.all([
      supabase
        .from("referral_codes")
        .select("clicks, conversions, total_earned")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("referrals")
        .select("status, commission_earned")
        .eq("referrer_id", user.id),
      supabase
        .from("referral_earnings")
        .select("commission_amount, status")
        .eq("referrer_id", user.id),
    ]);

    const code = codeData.data || { clicks: 0, conversions: 0, total_earned: 0 };
    const referrals = referralsData.data || [];
    const earnings = earningsData.data || [];

    const pendingEarnings = earnings
      .filter(e => e.status === "pending")
      .reduce((sum, e) => sum + Number(e.commission_amount), 0);

    const approvedEarnings = earnings
      .filter(e => e.status === "approved")
      .reduce((sum, e) => sum + Number(e.commission_amount), 0);

    return {
      totalClicks: code.clicks,
      totalConversions: code.conversions,
      totalEarned: Number(code.total_earned),
      pendingEarnings,
      availableForPayout: approvedEarnings,
      totalReferrals: referrals.length,
      activeReferrals: referrals.filter(r => r.status === "active").length,
    };
  },

  // Get referred users
  async getReferrals(): Promise<Referral[]> {
    const user = await authState.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("referrals")
      .select("*, profiles!referrals_referred_user_id_fkey(email, full_name)")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get earnings history
  async getEarnings(): Promise<ReferralEarning[]> {
    const user = await authState.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("referral_earnings")
      .select("*")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get payout history
  async getPayouts(): Promise<ReferralPayout[]> {
    const user = await authState.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("referral_payouts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Request payout
  async requestPayout(params: CreatePayoutParams): Promise<ReferralPayout> {
    const user = await authState.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("referral_payouts")
      .insert({
        user_id: user.id,
        amount: params.amount,
        method: params.method,
        bank_account: params.bank_account,
        paypal_email: params.paypal_email,
        notes: params.notes,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get commission settings
  async getCommissionSettings(): Promise<CommissionSetting[]> {
    const { data, error } = await supabase
      .from("admin_commission_settings")
      .select("*");

    if (error) throw error;
    return data || [];
  },

  // Admin: Get all payouts
  async getAllPayouts(): Promise<ReferralPayout[]> {
    const { data, error } = await supabase
      .from("referral_payouts")
      .select("*, profiles!referral_payouts_user_id_fkey(email, full_name)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Admin: Update payout status
  async updatePayoutStatus(
    payoutId: string,
    status: "processing" | "completed" | "rejected",
    notes?: string
  ): Promise<void> {
    const user = await authState.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("referral_payouts")
      .update({
        status,
        notes,
        processed_by: user.id,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", payoutId);

    if (error) throw error;
  },

  // Admin: Update commission settings
  async updateCommissionSettings(
    paymentType: "subscription" | "credits",
    rate: number,
    minPayout: number
  ): Promise<void> {
    const { error } = await supabase
      .from("admin_commission_settings")
      .update({
        commission_rate: rate,
        min_payout_amount: minPayout,
        updated_at: new Date().toISOString(),
      })
      .eq("payment_type", paymentType);

    if (error) throw error;
  },
};