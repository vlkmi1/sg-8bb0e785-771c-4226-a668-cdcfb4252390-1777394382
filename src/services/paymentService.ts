import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { authState } from "./authStateService";

export type Payment = Tables<"payments">;
export type PaymentMethod = "stripe" | "paypal" | "crypto" | "bank_transfer";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";

export interface PaymentIntent {
  amount: number;
  currency: string;
  description: string;
  method: PaymentMethod;
  paymentType?: string;
  metadata?: any;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  bonus_credits: number;
  price: number;
  currency: string;
  description: string;
  badge?: string;
}

export const paymentService = {
  async getPaymentSettings(): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from("payment_settings")
      .select("*")
      .eq("is_active", true);

    if (error) {
      console.error("Error fetching payment settings:", error);
      return {};
    }

    const settings: Record<string, string> = {};
    (data || []).forEach((setting: any) => {
      settings[setting.setting_key] = setting.setting_value;
    });

    return settings;
  },

  async isPaymentMethodAvailable(method: PaymentMethod): Promise<boolean> {
    const settings = await this.getPaymentSettings();
    
    switch (method) {
      case "paypal":
        return !!(settings.paypal_client_id && settings.paypal_secret);
      case "stripe":
        return !!(settings.stripe_publishable_key && settings.stripe_secret_key);
      case "bank_transfer":
        return !!settings.bank_account_number;
      default:
        return false;
    }
  },

  async initPayPalPayment(packageId: string) {
    const settings = await this.getPaymentSettings();
    if (!settings.paypal_client_id) {
      throw new Error("PayPal není nakonfigurován");
    }
    
    // TODO: Implement PayPal SDK integration
    return "https://paypal.com";
  },

  async generateBankTransferQR(packageId: string) {
    const settings = await this.getPaymentSettings();
    if (!settings.bank_account_number) {
      throw new Error("Bankovní převod není nakonfigurován");
    }
    
    // TODO: Generate QR code with bank details
    return "qr_code_data";
  },

  async createPayment(intent: PaymentIntent): Promise<Payment> {
    const user = await authState.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        amount: intent.amount,
        currency: intent.currency,
        method: intent.method,
        payment_type: intent.method,
        status: "pending",
      } as any)
      .select()
      .single();

    if (error) {
      console.error("Error creating payment:", error);
      throw error;
    }

    return data;
  },

  async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    transactionId?: string
  ): Promise<void> {
    const updates: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (transactionId) {
      updates.transaction_id = transactionId;
    }

    const { error } = await supabase
      .from("payments")
      .update(updates)
      .eq("id", paymentId);

    if (error) {
      console.error("Error updating payment status:", error);
      throw error;
    }
  },

  async getPaymentHistory(): Promise<Payment[]> {
    const user = await authState.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payment history:", error);
      return [];
    }

    return data || [];
  },

  async getPayment(paymentId: string): Promise<Payment | null> {
    const user = await authState.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error fetching payment:", error);
      return null;
    }

    return data;
  },

  async refundPayment(paymentId: string): Promise<void> {
    const { error } = await supabase
      .from("payments")
      .update({
        status: "refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    if (error) {
      console.error("Error refunding payment:", error);
      throw error;
    }
  },

  async getCreditPackages(): Promise<CreditPackage[]> {
    const { data, error } = await supabase
      .from("credit_packages")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching credit packages:", error);
      return [];
    }

    return (data || []).map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      credits: pkg.credits,
      bonus_credits: pkg.bonus_credits,
      price: Number(pkg.price),
      currency: pkg.currency,
      description: pkg.name,
    }));
  },
};