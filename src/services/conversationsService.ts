import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Conversation = Tables<"conversations">;
export type Message = Tables<"messages">;

export interface CreateConversationData {
  title: string;
  model_provider: string;
  model_name: string;
}

export interface CreateMessageData {
  conversation_id: string;
  role: string;
  content: string;
}

export const conversationsService = {
  async getConversations(): Promise<Conversation[]> {
    console.log("conversationsService.getConversations: Fetching conversations...");
    
    try {
      // First check if we have a session
      const { data: { session } } = await supabase.auth.getSession();
      console.log("conversationsService: Session check", {
        hasSession: !!session,
        userId: session?.user?.id
      });

      if (!session) {
        console.error("conversationsService: No session found!");
        return [];
      }

      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("conversationsService: Error fetching conversations:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log("conversationsService: Conversations fetched successfully", {
        count: data?.length || 0
      });

      return data || [];
    } catch (error) {
      console.error("conversationsService: Unexpected error:", error);
      throw error;
    }
  },

  async getConversationById(id: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching conversation:", error);
      throw error;
    }

    return data;
  },

  async createConversation(conversationData: CreateConversationData): Promise<Conversation> {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: session.session.user.id,
        title: conversationData.title,
        model_provider: conversationData.model_provider,
        model_name: conversationData.model_name,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }

    return data;
  },

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
    const { data, error } = await supabase
      .from("conversations")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating conversation:", error);
      throw error;
    }

    return data;
  },

  async deleteConversation(id: string): Promise<void> {
    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id);

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

  async createMessage(messageData: CreateMessageData): Promise<Message> {
    const { data, error } = await supabase
      .from("messages")
      .insert(messageData)
      .select()
      .single();

    if (error) {
      console.error("Error creating message:", error);
      throw error;
    }

    return data;
  },
};