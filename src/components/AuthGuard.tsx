import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;
    let authCheckDone = false;

    const checkAuth = async () => {
      if (authCheckDone) return;
      authCheckDone = true;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session) {
          setAuthenticated(true);
          setLoading(false);
        } else {
          router.push("/auth/login");
          setAuthenticated(false);
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        if (!mounted) return;
        setAuthenticated(false);
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      if (event === "SIGNED_OUT") {
        setAuthenticated(false);
        router.push("/auth/login");
      } else if (event === "SIGNED_IN" && session) {
        setAuthenticated(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Prázdný dependency array - spustí se jen jednou

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
    return null;
  }

  return <>{children}</>;
}