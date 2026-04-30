import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/SEO";
import { authService } from "@/services/authService";
import { Loader2, Mail, Lock, LogIn, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.signIn(email, password);
      
      toast({
        title: "Přihlášení úspěšné! ✅",
        description: "Vítejte zpět v kAIkus",
        duration: 3000,
      });
      
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      
      let errorTitle = "Chyba přihlášení";
      let errorMessage = "Nepodařilo se přihlásit";
      
      // Parse specific error messages
      if (error.message.includes("Invalid login credentials")) {
        errorTitle = "Nesprávné přihlašovací údaje";
        errorMessage = "Email nebo heslo je nesprávné. Zkontrolujte je a zkuste to znovu.";
      } else if (error.message.includes("Email not confirmed")) {
        errorTitle = "Email nebyl ověřen";
        errorMessage = "Před přihlášením musíte ověřit svůj email. Zkontrolujte svou schránku.";
      } else if (error.message.includes("User not found")) {
        errorTitle = "Účet nenalezen";
        errorMessage = "Účet s tímto emailem neexistuje. Zkuste se nejprve zaregistrovat.";
      } else if (error.message.includes("Too many requests")) {
        errorTitle = "Příliš mnoho pokusů";
        errorMessage = "Zkuste to znovu za chvíli.";
      } else if (error.message.includes("rate limit")) {
        errorTitle = "Dočasné omezení";
        errorMessage = "Prosím počkejte chvíli a zkuste to znovu.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Přihlášení - kAIkus"
        description="Přihlaste se do své kAIkus platformy"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4 py-12">
        <Card className="w-full max-w-md border-2 shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-2">
              <LogIn className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-heading font-bold">
              Přihlášení
            </CardTitle>
            <CardDescription className="text-base">
              Pokračujte s vaším účtem kAIkus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="vas@email.cz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Heslo
                  </Label>
                  <Link 
                    href="/auth/reset-password" 
                    className="text-xs text-primary hover:underline"
                  >
                    Zapomenuté heslo?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Přihlašování...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Přihlásit se
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Nemáte účet?{" "}
                <Link 
                  href="/auth/register" 
                  className="font-semibold text-primary hover:underline"
                >
                  Zaregistrovat se
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}