import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        // Používáme getSession místo getUser - je rychlejší a nekontroluje validitu na serveru
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (session) {
          setAuthenticated(true);
        } else {
          // Redirect pouze pokud opravdu není session
          router.push("/auth/login");
          setAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // Při chybě neodhlašujeme - může jít o dočasný problém sítě
        if (!mounted) return;
        setAuthenticated(false);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    // Listen for auth state changes - ale pouze pro sign out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      // Reagujeme pouze na explicitní sign out
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
  }, [router]);

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