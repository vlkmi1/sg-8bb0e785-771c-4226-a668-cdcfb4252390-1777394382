import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
          router.push("/auth/login");
          return;
        }

        if (!session) {
          console.log("AuthGuard: No session found, redirecting to login");
          router.push("/auth/login");
          return;
        }

        console.log("AuthGuard: Session valid, user authenticated");
        setLoading(false);
      } catch (err) {
        console.error("AuthGuard: Unexpected error:", err);
        router.push("/auth/login");
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

        if (event === "SIGNED_OUT" || !session) {
          console.log("AuthGuard: User signed out or no session, redirecting to login");
          router.push("/auth/login");
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          console.log("AuthGuard: User signed in or token refreshed, allowing access");
          setLoading(false);
        }
      }
    );

    return () => {
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

  return <>{children}</>;
}