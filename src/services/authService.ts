import { supabase } from "@/integrations/supabase/client";
import type { User, AuthError, Session } from "@supabase/supabase-js";

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

// Get current app URL dynamically
function getRedirectUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export const authService = {
  async signUp(email: string, password: string, fullName?: string): Promise<{ user: User | null; error: AuthError | null }> {
    const redirectUrl = `${getRedirectUrl()}/auth/confirm-email`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) return { user: null, error };

    // Create profile entry
    if (data.user) {
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }
    }

    return { user: data.user, error: null };
  },

  async signIn(email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { user: null, error };
    return { user: data.user, error: null };
  },

  async signInWithOAuth(provider: any): Promise<{ error: AuthError | null }> {
    const redirectUrl = `${getRedirectUrl()}/auth/callback`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectUrl,
      },
    });

    return { error };
  },

  async signOut(): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getSession(): Promise<Session | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    const redirectUrl = `${getRedirectUrl()}/auth/update-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  },

  async updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  },

  async updateProfile(updates: { full_name?: string; avatar_url?: string }): Promise<{ error: any }> {
    const user = await this.getCurrentUser();
    if (!user) return { error: new Error("No user logged in") };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (error) return { error };

    // Also update auth metadata if full_name changed
    if (updates.full_name) {
      await supabase.auth.updateUser({
        data: { full_name: updates.full_name },
      });
    }

    return { error: null };
  },

  async getProfile(userId: string): Promise<{ data: any; error: any }> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    return { data, error };
  },

  onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  },
};

// Export individual functions for backwards compatibility
export const { 
  signUp, 
  signIn, 
  signInWithOAuth, 
  signOut, 
  getCurrentUser, 
  getSession,
  resetPassword,
  updatePassword,
  updateProfile,
  getProfile,
  onAuthStateChange
} = authService;
