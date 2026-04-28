import { supabase } from "@/integrations/supabase/client";

export const creditsService = {
  async getCredits(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data?.credits || 0;
    } catch (error: any) {
      console.error("Error loading credits:", error);
      throw error;
    }
  },

  async deductCredits(amount: number): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get current credits
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();

      if (fetchError) throw fetchError;

      const currentCredits = profile?.credits || 0;
      const newCredits = currentCredits - amount;

      if (newCredits < 0) {
        throw new Error("Insufficient credits");
      }

      // Update credits
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ credits: newCredits })
        .eq("id", user.id);

      if (updateError) throw updateError;

      return newCredits;
    } catch (error: any) {
      console.error("Error deducting credits:", error);
      throw error;
    }
  },
};