import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@/contexts/ThemeProvider";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { authState } from "@/services/authStateService";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Global auth state listener for token refresh
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] Event:', event, 'Session:', !!session);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('[Auth] Token refreshed successfully');
        authState.invalidateCache();
      } else if (event === 'SIGNED_OUT') {
        console.log('[Auth] User signed out');
        authState.invalidateCache();
      } else if (event === 'SIGNED_IN') {
        console.log('[Auth] User signed in');
        authState.invalidateCache();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Component {...pageProps} />
        <Toaster />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
