import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/router";
import { authService } from "@/services/authService";
import { affiliateService } from "@/services/affiliateService";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";
import Link from "next/link";
import { SEO } from "@/components/SEO";

export default function Register() {
  const router = useRouter();
  const { ref } = router.query;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    if (ref && typeof ref === "string") {
      setReferralCode(ref);
      // Track click on referral link
      affiliateService.trackClick(ref);
    }
  }, [ref]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Hesla se neshodují");
      return;
    }

    if (password.length < 6) {
      setError("Heslo musí mít alespoň 6 znaků");
      return;
    }

    setLoading(true);

    try {
      await authService.signUp(email, password);
      
      // Process referral if code exists
      if (referralCode) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.rpc("process_referral", {
            new_user_id: user.id,
            ref_code: referralCode,
          });
        }
      }
      
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Chyba při registraci");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: "google" | "apple") => {
    setError("");
    setLoading(true);

    try {
      await authService.signInWithOAuth(provider);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Chyba při registraci přes ${provider}`);
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Registrace - kAIkus"
        description="Vytvořte si účet na kAIkus platformě"
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Brain className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-heading">Registrace</CardTitle>
            <CardDescription>Vytvořte si účet a objevte AI modely</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vas@email.cz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Heslo</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Potvrďte heslo</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Vytváření účtu..." : "Vytvořit účet"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Nebo pokračujte s
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuthSignIn("google")}
                  disabled={loading}
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Registrovat přes Google
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleOAuthSignIn("apple")}
                  disabled={loading}
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Registrovat přes Apple
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Už máte účet?{" "}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Přihlaste se
                </Link>
              </p>

              {referralCode && (
                <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-lg text-center">
                  <p className="text-sm text-accent font-medium">
                    🎁 Registrujete se přes referral link
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Získáte 50 kreditů zdarma při registraci
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}