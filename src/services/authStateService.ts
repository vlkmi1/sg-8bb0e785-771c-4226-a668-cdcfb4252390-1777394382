import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

/**
 * Centralized auth state service with long-lived caching
 * Prevents rate limiting by minimizing auth requests to Supabase
 */
class AuthStateService {
  private static instance: AuthStateService;
  private userCache: User | null = null;
  private sessionCache: Session | null = null;
  private userPromise: Promise<User | null> | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 600000; // 10 minut (600s) - zvýšeno z 5 min
  private refreshInProgress: boolean = false;

  private constructor() {
    this.initSession();
    this.setupAutoRefresh();
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
        console.log('[AuthState] Session initialized, expires at:', new Date(session.expires_at! * 1000));
      }
    } catch (error) {
      console.error('[AuthState] Init session error:', error);
    }
  }

  /**
   * Setup auto-refresh before token expires (not on every call)
   */
  private setupAutoRefresh() {
    // Check session expiry every 5 minutes
    setInterval(async () => {
      if (this.sessionCache && !this.refreshInProgress) {
        const expiresAt = this.sessionCache.expires_at! * 1000;
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;
        
        // Refresh 2 minutes before expiry
        if (timeUntilExpiry < 120000) {
          console.log('[AuthState] Proactively refreshing session');
          await this.refreshSession();
        }
      }
    }, 300000); // Check every 5 minutes
  }

  private async refreshSession(): Promise<void> {
    if (this.refreshInProgress) {
      console.log('[AuthState] Refresh already in progress, skipping');
      return;
    }

    this.refreshInProgress = true;
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[AuthState] Refresh session error:', error);
        return;
      }

      if (session) {
        this.sessionCache = session;
        this.userCache = session.user;
        this.cacheTimestamp = Date.now();
        console.log('[AuthState] Session refreshed, new expiry:', new Date(session.expires_at! * 1000));
      }
    } catch (error) {
      console.error('[AuthState] Refresh session exception:', error);
    } finally {
      this.refreshInProgress = false;
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
   * Get current user with long-lived caching
   * Cache is valid for 5 minutes to prevent rate limiting
   */
  public async getUser(): Promise<User | null> {
    // Return cached user if valid (5 minute cache)
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
        // Use getSession (doesn't trigger refresh, just reads local storage)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          this.userCache = session.user;
          this.sessionCache = session;
          this.cacheTimestamp = Date.now();
          return session.user;
        }

        // No session found
        this.clearCache();
        return null;
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
   * Get current session (always uses cache if valid)
   */
  public async getSession(): Promise<Session | null> {
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
   * Force cache invalidation - use sparingly!
   */
  public invalidateCache(): void {
    this.cacheTimestamp = 0;
    this.userPromise = null;
  }

  /**
   * Clear all cached data - use on sign out only
   */
  public clearAll(): void {
    this.clearCache();
    this.refreshInProgress = false;
  }
}

// Export singleton instance
export const authState = AuthStateService.getInstance();