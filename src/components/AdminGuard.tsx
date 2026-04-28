import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAdminStatus = async () => {
      try {
        // First check if user is authenticated
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (sessionError || !session) {
          console.log("No session found, redirecting to login");
          router.replace("/auth/login");
          return;
        }

        // Then check admin status from profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", session.user.id)
          .single();

        if (!isMounted) return;

        if (profileError) {
          console.error("Error fetching admin status:", profileError);
          router.replace("/dashboard");
          return;
        }

        if (!profile?.is_admin) {
          console.log("User is not admin, redirecting to dashboard");
          router.replace("/dashboard");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        if (!isMounted) return;
        console.error("Error in AdminGuard:", error);
        router.replace("/dashboard");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAdminStatus();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Ověřování admin přístupu...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}