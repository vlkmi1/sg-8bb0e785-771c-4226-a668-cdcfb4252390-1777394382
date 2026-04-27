import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { authState } from "./authStateService";

export type SocialPlatform = "facebook" | "instagram" | "linkedin" | "twitter" | "youtube" | "tiktok";
export type PostStatus = "draft" | "scheduled" | "published" | "failed";

export type SocialPost = Tables<"social_posts">;
export type SocialAccount = Tables<"social_accounts">;

export interface CreatePostParams {
  platform: SocialPlatform;
  content: string;
  image_url?: string;
  scheduled_time?: string;
  status?: PostStatus;
}

export interface CreateAccountParams {
  platform: SocialPlatform;
  account_name: string;
  access_token?: string;
}

export const socialPostsService = {
  async createPost(params: CreatePostParams): Promise<SocialPost> {
    const user = await authState.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("social_posts")
      .insert({
        user_id: user.id,
        platform: params.platform,
        content: params.content,
        image_url: params.image_url,
        scheduled_time: params.scheduled_time,
        status: params.scheduled_time ? "scheduled" : "draft",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPosts(): Promise<SocialPost[]> {
    const user = await authState.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("social_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updatePost(id: string, updates: Partial<CreatePostParams>): Promise<SocialPost> {
    const { data, error } = await supabase
      .from("social_posts")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePost(id: string): Promise<boolean> {
    const user = await authState.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { error } = await supabase
      .from("social_posts")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  },

  async createAccount(params: CreateAccountParams): Promise<SocialAccount> {
    const user = await authState.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("social_accounts")
      .insert({
        user_id: user.id,
        platform: params.platform,
        account_name: params.account_name,
        access_token: params.access_token,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAccounts(): Promise<SocialAccount[]> {
    const { data, error } = await supabase
      .from("social_accounts")
      .select("*")
      .order("platform");

    if (error) throw error;
    return data || [];
  },

  async deleteAccount(id: string): Promise<void> {
    const { error } = await supabase
      .from("social_accounts")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async generateContent(topic: string, platform: SocialPlatform): Promise<string> {
    // Simulace AI generování - v produkci by volalo OpenAI API
    const templates = {
      facebook: `🌟 ${topic}\n\nZajímavé informace o tomto tématu! Co si o tom myslíte? 💭\n\n#${topic.replace(/\s/g, "")} #Facebook`,
      instagram: `✨ ${topic}\n\n📸 Tento obsah inspiruje! 🎨\n\n#${topic.replace(/\s/g, "")} #InstaDaily #Inspiration`,
      linkedin: `${topic}\n\nProfesionální pohled na tuto problematiku. Jaké jsou vaše zkušenosti?\n\n#${topic.replace(/\s/g, "")} #LinkedIn #Professional`,
      twitter: `🚀 ${topic}\n\nKrátce a výstižně o aktuálním tématu!\n\n#${topic.replace(/\s/g, "")}`,
    };

    return templates[platform] || topic;
  },

  getTemplateForPlatform(platform: SocialPlatform, topic: string): string {
    const templates: Record<SocialPlatform, string> = {
      facebook: `${topic}\n\nCo si o tom myslíte? Podělte se o svůj názor v komentářích! 💬`,
      instagram: `${topic} ✨\n\n#${topic.replace(/\s/g, "")} #AI #Tech #Innovation`,
      linkedin: `🚀 ${topic}\n\nV dnešní době je důležité držet krok s nejnovějším vývojem. Rád se s vámi podělím o své poznatky.\n\n#ProfessionalDevelopment #Technology`,
      twitter: `${topic}\n\n#${topic.replace(/\s/g, "")}`,
      youtube: `${topic}\n\n📹 Sledujte celé video pro více informací!\n👍 Dejte like, pokud se vám to líbí\n🔔 Zapněte notifikace pro další obsah\n\n#${topic.replace(/\s/g, "")} #YouTube #Video`,
      tiktok: `${topic} 🎵\n\n✨ Sleduj pro víc\n❤️ Like pokud souhlasíš\n💬 Napiš do komentářů\n\n#${topic.replace(/\s/g, "")} #FYP #Viral #TikTok`,
    };

    return templates[platform] || topic;
  },
};