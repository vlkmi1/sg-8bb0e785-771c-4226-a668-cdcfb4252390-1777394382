import { supabase } from "@/integrations/supabase/client";
import { authState } from "./authStateService";

export const creditsService = {
  async getCredits(): Promise<number> {
    const user = await authState.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc("get_user_credits", {
      p_user_id: user.id,
    });

    if (error) {
      console.error("Error getting credits:", error);
      throw error;
    }

    return data || 0;
  },

  async deductCredits(
    amount: number,
    description: string = "Service usage"
  ): Promise<number> {
    const user = await authState.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc("deduct_credits", {
      p_user_id: user.id,
      p_amount: amount,
      p_description: description,
    });

    if (error) {
      console.error("Error deducting credits:", error);
      throw error;
    }

    return data || 0;
  },

  async getCreditTransactions() {
    const user = await authState.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error getting transactions:", error);
      throw error;
    }

    return data || [];
  },
};