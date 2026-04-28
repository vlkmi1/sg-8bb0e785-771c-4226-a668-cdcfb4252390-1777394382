import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Loader2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import Link from "next/link";

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          setError(sessionError.message);
          return;
        }

        if (!session) {
          console.error("No session found");
          setError("Přihlášení se nezdařilo. Zkuste to prosím znovu.");
          return;
        }

        console.log("OAuth callback: Session created successfully", {
          userId: session.user.id,
          email: session.user.email,
        });

        // Check if profile exists, create if not
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", session.user.id)
          .single();

        if (profileError && profileError.code === "PGRST116") {
          // Profile doesn't exist, create it
          console.log("Creating profile for OAuth user");
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: session.user.id,
              email: session.user.email!,
              full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name,
              avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
            });

          if (insertError) {
            console.error("Error creating profile:", insertError);
          }
        }

        // Redirect to dashboard
        router.push("/dashboard");
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError("Nastala chyba při přihlašování. Zkuste to prosím znovu.");
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <>
        <SEO 
          title="Chyba přihlášení - kAIkus"
          description="Chyba při OAuth přihlášení"
        />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-2">
              <div className="flex justify-center mb-2">
                <div className="p-3 bg-destructive/10 rounded-xl">
                  <Brain className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl font-heading">Chyba přihlášení</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Link 
                href="/auth/login" 
                className="text-primary hover:underline font-medium"
              >
                Zpět na přihlášení
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Přihlašování - kAIkus"
        description="Dokončování přihlášení"
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            </div>
            <CardTitle className="text-2xl font-heading">Dokončování přihlášení</CardTitle>
            <CardDescription>Počkejte prosím, zpracováváme vaše přihlášení...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </>
  );
}