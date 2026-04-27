import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const checkingAuth = useRef(false);

  useEffect(() => {
    // Prevent duplicate auth checks
    if (checkingAuth.current) return;
    checkingAuth.current = true;

    const checkAuth = async () => {
      console.log("AuthGuard: Checking authentication...");
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log("AuthGuard Session Check:", {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          error: error?.message,
          currentPath: router.pathname,
          timestamp: new Date().toISOString()
        });

        if (error) {
          console.error("AuthGuard: Session error:", error);
          setAuthenticated(false);
          setLoading(false);
          router.push("/auth/login");
          return;
        }

        if (!session) {
          console.log("AuthGuard: No session found, redirecting to login");
          setAuthenticated(false);
          setLoading(false);
          router.push("/auth/login");
          return;
        }

        console.log("AuthGuard: Session valid, user authenticated");
        setAuthenticated(true);
        setLoading(false);
      } catch (err) {
        console.error("AuthGuard: Unexpected error:", err);
        setAuthenticated(false);
        setLoading(false);
        router.push("/auth/login");
      } finally {
        checkingAuth.current = false;
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("AuthGuard: Auth state changed:", {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          timestamp: new Date().toISOString()
        });

        // Only handle actual sign in/out events, not token refreshes
        if (event === "SIGNED_OUT") {
          console.log("AuthGuard: User signed out, redirecting to login");
          setAuthenticated(false);
          router.push("/auth/login");
        } else if (event === "SIGNED_IN") {
          console.log("AuthGuard: User signed in, allowing access");
          setAuthenticated(true);
          setLoading(false);
        }
        // TOKEN_REFRESHED is normal and doesn't need any action
        // It happens automatically in the background
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array - only run once on mount

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Načítání...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Will redirect to login
  }

  return <>{children}</>;
}