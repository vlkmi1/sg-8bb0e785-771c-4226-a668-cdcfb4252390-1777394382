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
  async initPayPalPayment(packageId: string) {
    return "https://paypal.com";
  },

  async generateBankTransferQR(packageId: string) {
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

  getCreditPackages(): CreditPackage[] {
    return [
      {
        id: "starter",
        name: "Starter Pack",
        credits: 50,
        bonus_credits: 0,
        price: 4.99,
        currency: "USD",
        description: "Pro začátečníky",
      },
      {
        id: "popular",
        name: "Popular Pack",
        credits: 150,
        bonus_credits: 50,
        price: 12.99,
        currency: "USD",
        description: "Nejoblíbenější",
        badge: "Nejprodávanější",
      },
      {
        id: "pro",
        name: "Pro Pack",
        credits: 500,
        bonus_credits: 200,
        price: 39.99,
        currency: "USD",
        description: "Pro pokročilé uživatele",
      },
      {
        id: "enterprise",
        name: "Enterprise Pack",
        credits: 2000,
        bonus_credits: 1000,
        price: 149.99,
        currency: "USD",
        description: "Pro firemní použití",
      },
    ];
  },
};