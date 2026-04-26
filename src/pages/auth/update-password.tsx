import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Lock, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updatePassword } from "@/services/authService";
import { SEO } from "@/components/SEO";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validSession, setValidSession] = useState(false);

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes("type=recovery")) {
        setValidSession(true);
      } else {
        setError("Neplatný nebo expirovaný odkaz. Zkuste si vyžádat nový odkaz pro obnovení hesla.");
      }
    };
    checkSession();
  }, []);

  const validatePassword = () => {
    if (password.length < 6) {
      setError("Heslo musí mít alespoň 6 znaků");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Hesla se neshodují");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(password);
      
      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      }
    } catch (err) {
      setError("Nastala neočekávaná chyba. Zkuste to prosím znovu.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <SEO 
          title="Heslo změněno - kAIkus"
          description="Vaše heslo bylo úspěšně změněno"
        />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-2xl">Heslo změněno</CardTitle>
              <CardDescription>
                Vaše heslo bylo úspěšně aktualizováno
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Nyní se můžete přihlásit s novým heslem.
                  <br />
                  Budete přesměrováni na přihlašovací stránku...
                </AlertDescription>
              </Alert>
              
              <Button
                className="w-full"
                onClick={() => router.push("/auth/login")}
              >
                Přejít na přihlášení
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  if (!validSession) {
    return (
      <>
        <SEO 
          title="Neplatný odkaz - kAIkus"
          description="Odkaz pro obnovení hesla je neplatný nebo expirovaný"
        />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Neplatný odkaz</CardTitle>
              <CardDescription>
                Tento odkaz je neplatný nebo již expiroval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => router.push("/auth/reset-password")}
                >
                  Vyžádat nový odkaz
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/auth/login")}
                >
                  Zpět na přihlášení
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO 
        title="Nastavení nového hesla - kAIkus"
        description="Nastavte si nové heslo pro váš účet"
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Nastavení nového hesla</CardTitle>
            <CardDescription>
              Zadejte nové heslo pro váš účet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Nové heslo</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Heslo musí mít alespoň 6 znaků
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Potvrdit heslo</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ukládám...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Nastavit nové heslo
                  </>
                )}
              </Button>

              <div className="text-center text-sm">
                <Link
                  href="/auth/login"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Zpět na přihlášení
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}