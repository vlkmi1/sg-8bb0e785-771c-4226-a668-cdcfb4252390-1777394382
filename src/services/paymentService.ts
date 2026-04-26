import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type CreditPackage = Tables<"credit_packages">;
export type Payment = Tables<"payments">;
export type PaymentMethod = "paypal" | "bank_transfer" | "card" | "crypto";

export const paymentService = {
  async getCreditPackages(): Promise<CreditPackage[]> {
    const { data, error } = await supabase
      .from("credit_packages")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createPayment(params: {
    amount: number;
    method: PaymentMethod;
    paymentType: "subscription" | "credits";
    metadata?: any;
  }): Promise<Payment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("payments")
      .insert({
        user_id: user.id,
        amount: params.amount,
        method: params.method,
        payment_type: params.paymentType,
        status: "pending",
        metadata: params.metadata,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePaymentStatus(paymentId: string, status: "completed" | "failed" | "refunded"): Promise<void> {
    const { error } = await supabase
      .from("payments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", paymentId);

    if (error) throw error;

    // If payment completed and it was for credits, add them
    if (status === "completed") {
      const { data: payment } = await supabase
        .from("payments")
        .select("*, metadata")
        .eq("id", paymentId)
        .single();

      if (payment && payment.payment_type === "credits" && payment.metadata) {
        const credits = (payment.metadata as any).credits || 0;
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && credits > 0) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("credits")
            .eq("id", user.id)
            .single();

          await supabase
            .from("profiles")
            .update({ credits: (profile?.credits || 0) + credits })
            .eq("id", user.id);
        }
      }
    }
  },

  async getUserPayments(): Promise<Payment[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  generateBankTransferQR(payment: Payment): string {
    // Generate SPAYD QR code for Czech bank transfer
    const accountNumber = "123456789/0100"; // TODO: Get from admin settings
    const amount = payment.amount.toFixed(2);
    const variableSymbol = payment.id.substring(0, 10);
    const message = `kAIkus - ${payment.payment_type === "credits" ? "Kredity" : "Předplatné"}`;

    const spayd = `SPD*1.0*ACC:${accountNumber}*AM:${amount}*CC:CZK*X-VS:${variableSymbol}*MSG:${message}`;
    
    // Return QR code data (in real app, use QR code library)
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(spayd)}`;
  },

  async initPayPalPayment(packageId: string): Promise<string> {
    // TODO: Integrate with PayPal API
    // This is a placeholder - real implementation would call PayPal API
    const pkg = await this.getCreditPackages();
    const selectedPkg = pkg.find(p => p.id === packageId);
    
    if (!selectedPkg) throw new Error("Package not found");

    // Create payment record
    const payment = await this.createPayment({
      amount: selectedPkg.price,
      method: "paypal",
      paymentType: "credits",
      metadata: {
        package_id: packageId,
        credits: selectedPkg.credits + selectedPkg.bonus_credits,
      },
    });

    // In real app, return PayPal redirect URL
    return `https://paypal.com/checkout?payment_id=${payment.id}`;
  },
};