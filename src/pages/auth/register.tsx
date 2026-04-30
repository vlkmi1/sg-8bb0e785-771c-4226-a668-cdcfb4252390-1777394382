import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SEO } from "@/components/SEO";
import { authService } from "@/services/authService";
import { Loader2, Mail, Lock, User, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.signUp(email, password, fullName);
      
      // Show success notification
      toast({
        title: "Registrace úspěšná! ✅",
        description: "Zkontrolujte svůj email a klikněte na odkaz pro ověření účtu. Poté se můžete přihlásit.",
        duration: 8000,
      });

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (error: any) {
      console.error("Registration error:", error);
      
      let errorMessage = "Nepodařilo se vytvořit účet";
      
      if (error.message.includes("already registered")) {
        errorMessage = "Tento email je již zaregistrován. Zkuste se přihlásit.";
      } else if (error.message.includes("password")) {
        errorMessage = "Heslo musí mít alespoň 6 znaků";
      } else if (error.message.includes("email")) {
        errorMessage = "Neplatný formát emailu";
      }
      
      toast({
        title: "Chyba registrace",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO 
        title="Registrace - kAIkus"
        description="Vytvořte si účet a začněte používat AI nástroje"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4 py-12">
        <Card className="w-full max-w-md border-2 shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-2">
              <User className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-heading font-bold">
              Vytvořit účet
            </CardTitle>
            <CardDescription className="text-base">
              Připojte se k platformě kAIkus
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Celé jméno
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Jan Novák"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>

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
                <Label htmlFor="password" className="text-sm font-medium">
                  Heslo
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Minimálně 6 znaků
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vytváření účtu...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Registrovat se
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Již máte účet?{" "}
                <Link 
                  href="/auth/login" 
                  className="font-semibold text-primary hover:underline"
                >
                  Přihlásit se
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}