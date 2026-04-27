import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Centralized auth state service with caching and concurrent request handling
 * Prevents "lock was released because another request stole it" errors
 */
class AuthStateService {
  private static instance: AuthStateService;
  private userCache: User | null = null;
  private userPromise: Promise<User | null> | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5000; // 5 seconds

  private constructor() {
    // Subscribe to auth state changes to invalidate cache
    supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        this.clearCache();
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Invalidate cache to force fresh fetch
        this.cacheTimestamp = 0;
      }
    });
  }

  public static getInstance(): AuthStateService {
    if (!AuthStateService.instance) {
      AuthStateService.instance = new AuthStateService();
    }
    return AuthStateService.instance;
  }

  private clearCache(): void {
    this.userCache = null;
    this.userPromise = null;
    this.cacheTimestamp = 0;
  }

  private isCacheValid(): boolean {
    if (!this.userCache) return false;
    const now = Date.now();
    return (now - this.cacheTimestamp) < this.CACHE_DURATION;
  }

  /**
   * Get current user with caching to prevent concurrent auth requests
   * This is the main method services should use instead of supabase.auth.getUser()
   */
  public async getUser(): Promise<User | null> {
    // Return cached user if valid
    if (this.isCacheValid() && this.userCache) {
      return this.userCache;
    }

    // If there's already a pending request, wait for it
    if (this.userPromise) {
      return this.userPromise;
    }

    // Create new promise and cache it
    this.userPromise = (async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Auth state error:", error);
          this.clearCache();
          return null;
        }

        this.userCache = user;
        this.cacheTimestamp = Date.now();
        return user;
      } catch (error) {
        console.error("Auth state exception:", error);
        this.clearCache();
        return null;
      } finally {
        // Clear promise reference after completion
        this.userPromise = null;
      }
    })();

    return this.userPromise;
  }

  /**
   * Get current session (lighter than getUser, no validation)
   * Use this when you just need to check if user is logged in
   */
  public async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  /**
   * Force cache invalidation - use after manual auth operations
   */
  public invalidateCache(): void {
    this.cacheTimestamp = 0;
  }
}

// Export singleton instance
export const authState = AuthStateService.getInstance();