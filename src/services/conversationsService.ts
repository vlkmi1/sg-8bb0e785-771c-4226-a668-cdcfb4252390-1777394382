import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { authState } from "./authStateService";

export type Conversation = Tables<"conversations">;
export type Message = Tables<"messages">;

export const conversationsService = {
  async getConversations(): Promise<Conversation[]> {
    const session = await authState.getSession();
    if (!session) {
      // Don't log this as error - it's expected when not logged in
      return [];
    }

    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      throw error;
    }

    return data || [];
  },

  async getConversation(conversationId: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (error) {
      console.error("Error fetching conversation:", error);
      return null;
    }

    return data;
  },

  async createConversation(
    title: string,
    provider: string,
    modelName: string
  ): Promise<Conversation> {
    const user = await authState.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: user.id,
        title,
        provider,
        model_name: modelName,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }

    return data;
  },

  async updateConversation(
    conversationId: string,
    updates: Partial<Conversation>
  ): Promise<void> {
    const { error } = await supabase
      .from("conversations")
      .update(updates)
      .eq("id", conversationId);

    if (error) {
      console.error("Error updating conversation:", error);
      throw error;
    }
  },

  async deleteConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", conversationId);

    if (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }

    return data || [];
  },

  async addMessage(
    conversationId: string,
    role: "user" | "assistant",
    content: string
  ): Promise<Message> {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding message:", error);
      throw error;
    }

    // Update conversation's updated_at timestamp
    await this.updateConversation(conversationId, {
      updated_at: new Date().toISOString(),
    });

    return data;
  },
};