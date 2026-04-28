import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { authState } from "./authStateService";
import QRCode from "qrcode";

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

export interface BankTransferDetails {
  accountNumber: string;
  amount: number;
  currency: string;
  variableSymbol: string;
  specificSymbol?: string;
  message: string;
  qrCodeUrl: string;
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
        // Check for bank_account_number (actual key in DB)
        return !!(settings.bank_account_number || settings.bank_account);
      default:
        return false;
    }
  },

  async initPayPalPayment(packageId: string): Promise<string> {
    const settings = await this.getPaymentSettings();
    if (!settings.paypal_client_id) {
      throw new Error("PayPal není nakonfigurován");
    }

    const pkg = await this.getCreditPackage(packageId);
    if (!pkg) throw new Error("Balíček nenalezen");

    // Create payment record
    const payment = await this.createPayment({
      amount: pkg.price,
      currency: pkg.currency,
      description: `Nákup kreditů: ${pkg.name}`,
      method: "paypal",
      metadata: {
        package_id: packageId,
        credits: pkg.credits + pkg.bonus_credits,
      },
    });

    // TODO: Implement PayPal SDK integration
    // For now return PayPal URL with payment details
    return `https://www.paypal.com/checkoutnow?token=${payment.id}`;
  },

  async initStripePayment(packageId: string): Promise<string> {
    const settings = await this.getPaymentSettings();
    if (!settings.stripe_publishable_key) {
      throw new Error("Stripe není nakonfigurován");
    }

    const pkg = await this.getCreditPackage(packageId);
    if (!pkg) throw new Error("Balíček nenalezen");

    // Create payment record
    const payment = await this.createPayment({
      amount: pkg.price,
      currency: pkg.currency,
      description: `Nákup kreditů: ${pkg.name}`,
      method: "stripe",
      metadata: {
        package_id: packageId,
        credits: pkg.credits + pkg.bonus_credits,
      },
    });

    // TODO: Implement Stripe Checkout Session
    // For now return Stripe URL
    return `https://checkout.stripe.com/pay/${payment.id}`;
  },

  async generateBankTransferQR(packageId: string): Promise<BankTransferDetails> {
    const settings = await this.getPaymentSettings();
    if (!settings.bank_account_number) {
      throw new Error("Bankovní převod není nakonfigurován");
    }

    const user = await authState.getUser();
    if (!user) throw new Error("Uživatel není přihlášen");

    const pkg = await this.getCreditPackage(packageId);
    if (!pkg) throw new Error("Balíček nenalezen");

    // Create payment record
    const payment = await this.createPayment({
      amount: pkg.price,
      currency: pkg.currency,
      description: `Nákup kreditů: ${pkg.name}`,
      method: "bank_transfer",
      metadata: {
        package_id: packageId,
        credits: pkg.credits + pkg.bonus_credits,
      },
    });

    // Use user ID as variable symbol (last 10 digits)
    const variableSymbol = user.id.replace(/-/g, "").substring(0, 10);

    // Generate Czech bank QR code (SPAYD format)
    const amount = pkg.price.toFixed(2);
    const accountNumber = settings.bank_account_number;
    
    // SPAYD format for Czech banking QR codes
    const spaydString = `SPD*1.0*ACC:${accountNumber}*AM:${amount}*CC:CZK*MSG:Platba kaikus.cz*X-VS:${variableSymbol}`;
    
    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(spaydString, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    return {
      accountNumber,
      amount: pkg.price,
      currency: pkg.currency,
      variableSymbol,
      message: "Platba kaikus.cz",
      qrCodeUrl,
    };
  },

  async getCreditPackage(packageId: string): Promise<CreditPackage | null> {
    const { data, error } = await supabase
      .from("credit_packages")
      .select("*")
      .eq("id", packageId)
      .single();

    if (error) {
      console.error("Error fetching package:", error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      credits: data.credits,
      bonus_credits: data.bonus_credits,
      price: Number(data.price),
      currency: data.currency,
      description: data.name,
    };
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
        metadata: intent.metadata,
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
      credits: Number(pkg.credits),
      bonus_credits: Number(pkg.bonus_credits),
      price: Number(pkg.price),
      currency: pkg.currency,
      description: pkg.name,
    }));
  },
};