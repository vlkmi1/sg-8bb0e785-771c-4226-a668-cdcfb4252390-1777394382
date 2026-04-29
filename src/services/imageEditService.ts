import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ImageEdit = Tables<"image_edits">;
export type EditType = "inpaint" | "outpaint" | "variation" | "remove" | "upscale";

export interface EditImageParams {
  originalImageUrl: string;
  originalImageId?: string;
  editType: EditType;
  prompt?: string;
  maskData?: string;
  model?: "openai" | "stability";
}

export const imageEditService = {
  async editImage(params: EditImageParams): Promise<ImageEdit> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const response = await fetch("/api/edit-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to edit image");
    }

    const data = await response.json();
    return data.edit;
  },

  async getEdits(): Promise<ImageEdit[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("image_edits")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching edits:", error);
      throw error;
    }

    return data || [];
  },

  async getEditsByOriginalImage(originalImageId: string): Promise<ImageEdit[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("image_edits")
      .select("*")
      .eq("user_id", user.id)
      .eq("original_image_id", originalImageId)
      .order("created_at", { ascending: false});

    if (error) {
      console.error("Error fetching edits:", error);
      throw error;
    }

    return data || [];
  },

  async deleteEdit(editId: string): Promise<void> {
    const { error } = await supabase
      .from("image_edits")
      .delete()
      .eq("id", editId);

    if (error) {
      console.error("Error deleting edit:", error);
      throw error;
    }
  },
};