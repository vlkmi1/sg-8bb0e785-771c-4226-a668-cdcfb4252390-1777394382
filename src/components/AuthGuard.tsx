import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      console.log("AuthGuard: Checking authentication...");
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      console.log("AuthGuard Session Check:", {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        error: error?.message,
        currentPath: router.pathname
      });

      if (error) {
        console.error("AuthGuard: Session error:", error);
      }

      if (!session) {
        console.log("AuthGuard: No session, redirecting to login");
        router.push("/auth/login");
        return;
      }

      console.log("AuthGuard: Session valid, user authenticated");
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("AuthGuard: Auth state changed:", {
          event,
          hasSession: !!session,
          userId: session?.user?.id
        });

        if (event === "SIGNED_OUT" || !session) {
          console.log("AuthGuard: User signed out, redirecting to login");
          router.push("/auth/login");
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