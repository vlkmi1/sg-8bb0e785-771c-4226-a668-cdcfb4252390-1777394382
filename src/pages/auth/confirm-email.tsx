import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ConfirmEmail() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for email confirmation token in URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    const type = hashParams.get("type");

    if (accessToken && type === "signup") {
      confirmEmail(accessToken);
    } else {
      setConfirming(false);
    }
  }, []);

  const confirmEmail = async (token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: "signup",
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Potvrzení se nezdařilo");
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    confirmEmail();
  }, [confirmEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {confirming ? (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            ) : success ? (
              <CheckCircle className="h-16 w-16 text-accent" />
            ) : (
              <Mail className="h-16 w-16 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl font-heading">
            {confirming ? "Potvrzuji email..." : success ? "Email potvrzen!" : "Zkontrolujte email"}
          </CardTitle>
          <CardDescription>
            {confirming
              ? "Prosím počkejte..."
              : success
              ? "Váš účet byl úspěšně aktivován. Přesměrováváme vás..."
              : error
              ? error
              : "Poslali jsme vám potvrzovací email. Klikněte na odkaz v emailu pro aktivaci účtu."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!confirming && !success && (
            <>
              <div className="text-sm text-muted-foreground text-center space-y-2">
                <p>Email může dorazit do pár minut.</p>
                <p>Zkontrolujte také složku spam.</p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/auth/login")}
              >
                Zpět na přihlášení
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}