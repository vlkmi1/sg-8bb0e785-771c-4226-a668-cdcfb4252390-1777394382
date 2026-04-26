import { supabase } from "@/integrations/supabase/client";

export const creditsService = {
  async getCredits(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error fetching credits:", error);
      throw error;
    }

    return data?.credits || 0;
  },

  async deductCredits(amount: number): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase.rpc("deduct_credits", {
      user_id: user.id,
      amount,
    });

    if (error) {
      console.error("Error deducting credits:", error);
      throw error;
    }

    return data as number;
  },

  async addCredits(userId: string, amount: number): Promise<number> {
    const { data, error } = await supabase.rpc("add_credits", {
      target_user_id: userId,
      amount,
    });

    if (error) {
      console.error("Error adding credits:", error);
      throw error;
    }

    return data as number;
  },

  async getAllUsersCredits(): Promise<Array<{ id: string; email: string; full_name: string | null; credits: number }>> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, credits")
      .order("email");

    if (error) {
      console.error("Error fetching users credits:", error);
      throw error;
    }

    return data || [];
  },
};