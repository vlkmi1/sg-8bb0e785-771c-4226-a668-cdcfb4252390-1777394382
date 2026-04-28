import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { authState } from "./authStateService";

export type Assistant = Tables<"assistants">;
export type AssistantConversation = Tables<"assistant_conversations">;

export interface CreateAssistantParams {
  name: string;
  description?: string;
  instructions: string;
  personality?: string;
  model: string;
  avatar_emoji?: string;
  is_public?: boolean;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export const assistantTemplates = [
  {
    id: "business",
    name: "Business Consultant",
    emoji: "💼",
    description: "Expert v obchodní strategii, marketingu a růstu firmy",
    instructions: "Jsi zkušený business konzultant. Pomáháš s obchodní strategií, marketingovým plánováním, finanční analýzou a růstem firmy. Poskytuj konkrétní, praktické rady podložené příklady.",
    personality: "Profesionální, analytický, pragmatický",
    model: "gpt-4",
  },
  {
    id: "developer",
    name: "Senior Developer",
    emoji: "👨‍💻",
    description: "Programátor pro code review, debugging a architekturu",
    instructions: "Jsi senior programátor s expertízou v různých jazycích a frameworcích. Pomáháš s debuggingem, code review, architekturou aplikací a best practices. Vždy vysvětli PROČ a přidej příklady kódu.",
    personality: "Technický, precizní, trpělivý učitel",
    model: "gpt-4",
  },
  {
    id: "writer",
    name: "Creative Writer",
    emoji: "✍️",
    description: "Kreativní psaní, copywriting a editace textů",
    instructions: "Jsi kreativní spisovatel a copywriter. Pomáháš s psaním článků, příběhů, marketingových textů a editací obsahu. Tvůj styl je poutavý, autentický a přizpůsobený cílové skupině.",
    personality: "Kreativní, empatický, inspirující",
    model: "claude-3-opus",
  },
  {
    id: "marketing",
    name: "Marketing Guru",
    emoji: "📱",
    description: "Digital marketing, SEO a sociální média expert",
    instructions: "Jsi marketing expert se zaměřením na digital marketing, SEO, PPC kampaně a sociální média. Poskytuj strategie, které skutečně fungují a jsou měřitelné. Vždy přidej konkrétní KPI a metriky.",
    personality: "Energický, kreativní, data-driven",
    model: "gpt-4",
  },
  {
    id: "teacher",
    name: "Patient Teacher",
    emoji: "🎓",
    description: "Trpělivý učitel pro jakékoliv téma",
    instructions: "Jsi trpělivý učitel, který dokáže vysvětlit složité koncepty jednoduchým způsobem. Používáš příklady, analogie a postupné vysvětlování. Vždy se ujistíš, že student rozumí, než pokračuješ dál.",
    personality: "Trpělivý, podporující, jasný komunikátor",
    model: "gemini-pro",
  },
  {
    id: "health",
    name: "Health Coach",
    emoji: "🏃",
    description: "Fitness, výživa a wellness koučink",
    instructions: "Jsi health coach se znalostmi ve fitness, výživě a wellnessu. Pomáháš s vytvářením zdravých návyků, fitness plánů a výživových doporučení. DŮLEŽITÉ: Nejsi lékař, vždy doporuč konzultaci s odborníkem u zdravotních problémů.",
    personality: "Motivující, pozitivní, informovaný",
    model: "gpt-4",
  },
  {
    id: "finance",
    name: "Financial Advisor",
    emoji: "💰",
    description: "Osobní finance, investice a rozpočtování",
    instructions: "Jsi finanční poradce pro osobní finance. Pomáháš s rozpočtováním, spořením, investicemi a finančním plánováním. Poskytuj konzervativní, dlouhodobě udržitelné rady. DŮLEŽITÉ: Nejsi certifikovaný finanční poradce, vždy doporuč konzultaci s odborníkem u velkých investic.",
    personality: "Opatrný, analytický, edukativní",
    model: "gpt-4",
  },
  {
    id: "travel",
    name: "Travel Planner",
    emoji: "✈️",
    description: "Plánování cest, tipy a doporučení",
    instructions: "Jsi zkušený travel planner. Pomáháš s plánováním cest, doporučuješ destinace, ubytování, aktivity a poskytuj kulturní tipy. Tvoje doporučení jsou praktická a šitá na míru preferencím cestovatele.",
    personality: "Dobrodružný, organizovaný, kulturně citlivý",
    model: "gemini-pro",
  },
];

export const assistantService = {
  async getAssistants(): Promise<Assistant[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("assistants")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAssistant(id: string): Promise<Assistant | null> {
    const { data, error } = await supabase
      .from("assistants")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  async createAssistant(params: CreateAssistantParams): Promise<Assistant> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("assistants")
      .insert({
        user_id: user.id,
        ...params,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAssistant(id: string, params: Partial<CreateAssistantParams>): Promise<Assistant> {
    const { data, error } = await supabase
      .from("assistants")
      .update({
        ...params,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAssistant(id: string): Promise<void> {
    const { error } = await supabase
      .from("assistants")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getConversation(assistantId: string): Promise<AssistantConversation | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("assistant_conversations")
      .select("*")
      .eq("assistant_id", assistantId)
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data;
  },

  async createConversation(assistantId: string): Promise<AssistantConversation> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("assistant_conversations")
      .insert({
        assistant_id: assistantId,
        user_id: user.id,
        messages: [],
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async addMessage(conversationId: string, message: Message): Promise<void> {
    const { data: conversation, error: fetchError } = await supabase
      .from("assistant_conversations")
      .select("messages")
      .eq("id", conversationId)
      .single();

    if (fetchError) throw fetchError;

    const messages = [...(conversation.messages as unknown as Message[] || []), message];

    const { error: updateError } = await supabase
      .from("assistant_conversations")
      .update({
        messages: messages as any,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (updateError) throw updateError;
  },

  async generateResponse(assistantId: string, userMessage: string): Promise<string> {
    const user = await authState.getUser();
    if (!user) throw new Error("Not authenticated");

    try {
      const response = await fetch("/api/assistant-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistantId,
          userMessage,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate response");
      }

      const data = await response.json();
      return data.response;
    } catch (error: any) {
      console.error("Error generating response:", error);
      throw new Error(error.message || "Failed to generate response");
    }
  },

  async clearConversation(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from("assistant_conversations")
      .update({
        messages: [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (error) throw error;
  },
};