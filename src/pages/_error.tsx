import { NextPageContext } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Home, ArrowLeft, RefreshCw } from "lucide-react";
import { ThemeSwitch } from "@/components/ThemeSwitch";

interface ErrorProps {
  statusCode?: number;
  title?: string;
}

function Error({ statusCode, title }: ErrorProps) {
  const getErrorMessage = () => {
    switch (statusCode) {
      case 404:
        return {
          title: "Stránka nenalezena",
          description: "Omlouváme se, ale stránka kterou hledáte neexistuje nebo byla přesunuta.",
          emoji: "🔍",
        };
      case 500:
        return {
          title: "Interní chyba serveru",
          description: "Něco se pokazilo na naší straně. Náš tým na tom už pracuje.",
          emoji: "⚙️",
        };
      case 403:
        return {
          title: "Přístup odepřen",
          description: "Nemáte oprávnění k zobrazení této stránky.",
          emoji: "🔒",
        };
      default:
        return {
          title: title || "Nastala chyba",
          description: "Omlouváme se, ale něco se pokazilo. Zkuste to prosím později.",
          emoji: "❌",
        };
    }
  };

  const errorInfo = getErrorMessage();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="text-2xl">🤖</div>
              <h1 className="text-lg font-heading font-bold">kAIkus</h1>
            </Link>
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto">
          <Card className="border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-6xl">{errorInfo.emoji}</div>
                <div>
                  <CardTitle className="font-heading text-3xl mb-2">
                    {errorInfo.title}
                  </CardTitle>
                  {statusCode && (
                    <CardDescription className="text-lg">
                      Error {statusCode}
                    </CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">{errorInfo.description}</p>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Co můžete zkusit:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Zkontrolujte, zda jste zadali správnou URL adresu</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Obnovte stránku (F5 nebo Ctrl+R)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Vyčistěte cache prohlížeče a cookies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Vraťte se na hlavní stránku a zkuste to znovu</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline" 
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Obnovit stránku
                </Button>
                <Button onClick={() => window.history.back()} variant="outline" className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zpět
                </Button>
                <Button asChild className="flex-1">
                  <Link href="/">
                    <Home className="h-4 w-4 mr-2" />
                    Hlavní stránka
                  </Link>
                </Button>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground text-center">
                  Problém přetrvává?{" "}
                  <a href="mailto:podpora@kaikus.cz" className="text-primary hover:underline font-medium">
                    Kontaktujte podporu
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {statusCode === 404 && (
            <div className="mt-8">
              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="font-heading text-lg">Populární stránky</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Link href="/dashboard" className="p-3 rounded-lg hover:bg-background transition-colors">
                      <p className="font-medium">Dashboard</p>
                      <p className="text-sm text-muted-foreground">Přehled všech modulů</p>
                    </Link>
                    <Link href="/chat" className="p-3 rounded-lg hover:bg-background transition-colors">
                      <p className="font-medium">AI Chat</p>
                      <p className="text-sm text-muted-foreground">8 AI modelů</p>
                    </Link>
                    <Link href="/generate" className="p-3 rounded-lg hover:bg-background transition-colors">
                      <p className="font-medium">Generování obrázků</p>
                      <p className="text-sm text-muted-foreground">DALL-E, Stable Diffusion</p>
                    </Link>
                    <Link href="/pricing" className="p-3 rounded-lg hover:bg-background transition-colors">
                      <p className="font-medium">Ceník</p>
                      <p className="text-sm text-muted-foreground">Plány a kredity</p>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;