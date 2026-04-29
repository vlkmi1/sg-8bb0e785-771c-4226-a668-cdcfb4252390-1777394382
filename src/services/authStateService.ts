import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

/**
 * Centralized auth state service with caching and session refresh
 * Prevents duplicate auth requests and handles token refresh gracefully
 */
class AuthStateService {
  private static instance: AuthStateService;
  private userCache: User | null = null;
  private sessionCache: Session | null = null;
  private userPromise: Promise<User | null> | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 5000; // 5 seconds

  private constructor() {
    this.initSession();
  }

  public static getInstance(): AuthStateService {
    if (!AuthStateService.instance) {
      AuthStateService.instance = new AuthStateService();
    }
    return AuthStateService.instance;
  }

  private async initSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        this.sessionCache = session;
        this.userCache = session.user;
        this.cacheTimestamp = Date.now();
      }
    } catch (error) {
      console.error('[AuthState] Init session error:', error);
    }
  }

  private clearCache(): void {
    this.userCache = null;
    this.sessionCache = null;
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
        // First try to get from session (faster, no validation)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          this.userCache = session.user;
          this.sessionCache = session;
          this.cacheTimestamp = Date.now();
          return session.user;
        }

        // If no session, try getUser (validates and refreshes token)
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          // Don't log session missing errors - they're expected when logged out
          if (error.message !== 'Auth session missing!') {
            console.error('[AuthState] Get user error:', error);
          }
          // Don't clear cache on network errors - keep existing cache
          return this.userCache;
        }

        if (user) {
          this.userCache = user;
          this.cacheTimestamp = Date.now();
        } else {
          // Only clear cache if we're sure there's no user
          this.clearCache();
        }
        
        return user;
      } catch (error) {
        console.error('[AuthState] Get user exception:', error);
        // Keep existing cache on network errors
        return this.userCache;
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
    // Return cached session if valid
    if (this.isCacheValid() && this.sessionCache) {
      return this.sessionCache;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      this.sessionCache = session;
      this.userCache = session.user;
      this.cacheTimestamp = Date.now();
    }
    
    return session;
  }

  /**
   * Force cache invalidation - use after manual auth operations
   */
  public invalidateCache(): void {
    this.cacheTimestamp = 0;
    this.userPromise = null;
  }

  /**
   * Clear all cached data - use on sign out
   */
  public clearAll(): void {
    this.clearCache();
  }
}

// Export singleton instance
export const authState = AuthStateService.getInstance();