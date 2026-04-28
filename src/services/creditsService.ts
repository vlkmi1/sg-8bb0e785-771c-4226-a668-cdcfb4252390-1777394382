import { supabase } from "@/integrations/supabase/client";
import { authState } from "./authStateService";

export const creditsService = {
  async getCredits(): Promise<number> {
    try {
      const user = await authState.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error getting credits:", error);
        return 0;
      }

      return data?.credits ? Number(data.credits) : 0;
    } catch (err) {
      console.error("Credits error:", err);
      return 0;
    }
  },

  async deductCredits(
    amount: number,
    description: string = "Service usage"
  ): Promise<number> {
    const user = await authState.getUser();
    if (!user) throw new Error("Not authenticated");

    // Fetch current credits
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (fetchError) {
      console.error("Error fetching credits before deduction:", fetchError);
      throw fetchError;
    }

    const currentCredits = profile?.credits ? Number(profile.credits) : 0;
    const newCredits = currentCredits - amount;

    if (newCredits < 0) {
      throw new Error("Nedostatek kreditů");
    }

    // Update credits in profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating credits:", updateError);
      throw updateError;
    }

    // Attempt to log transaction (fail silently if table doesn't exist)
    try {
      await supabase.from("credit_transactions").insert({
        user_id: user.id,
        amount: -amount,
        description: description,
      });
    } catch (e) {
      console.log("Could not log transaction", e);
    }

    return newCredits;
  },

  async getCreditTransactions() {
    try {
      const user = await authState.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error getting transactions:", error);
        return [];
      }

      return data || [];
    } catch (e) {
      console.error("Error in getCreditTransactions:", e);
      return [];
    }
  },
};