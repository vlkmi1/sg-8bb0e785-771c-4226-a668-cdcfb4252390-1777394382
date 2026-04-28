import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WifiOff, RefreshCw, Home } from "lucide-react";
import { useRouter } from "next/router";

export default function OfflinePage() {
  const router = useRouter();

  const handleRetry = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <>
      <SEO 
        title="Offline - kAIkus"
        description="Aplikace je momentálně offline"
      />
      
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <WifiOff className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Jste offline</CardTitle>
            <CardDescription>
              Nemůžeme se připojit k internetu. Zkontrolujte své připojení a zkuste to znovu.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              onClick={handleRetry} 
              className="w-full"
              size="lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Zkusit znovu
            </Button>
            <Button 
              onClick={() => router.push("/")} 
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Home className="w-5 h-5 mr-2" />
              Zpět na homepage
            </Button>
            
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                💡 <strong>Tip:</strong> Některé stránky mohou být dostupné offline, pokud jste je nedávno navštívili.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}