import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DocumentSummary = Tables<"document_summaries">;
export type SummaryLevel = "short" | "medium" | "detailed";

export const documentSummaryService = {
  async getSummaries(): Promise<DocumentSummary[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("document_summaries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching summaries:", error);
      throw error;
    }

    return data || [];
  },

  async createSummary(params: {
    originalText: string;
    summaryText: string;
    summaryLevel: SummaryLevel;
    modelUsed: string;
    fileName?: string;
  }): Promise<DocumentSummary> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("document_summaries")
      .insert({
        user_id: user.id,
        original_text: params.originalText,
        summary_text: params.summaryText,
        summary_level: params.summaryLevel,
        model_used: params.modelUsed,
        file_name: params.fileName,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating summary:", error);
      throw error;
    }

    return data;
  },

  async deleteSummary(summaryId: string): Promise<void> {
    const { error } = await supabase
      .from("document_summaries")
      .delete()
      .eq("id", summaryId);

    if (error) {
      console.error("Error deleting summary:", error);
      throw error;
    }
  },
};