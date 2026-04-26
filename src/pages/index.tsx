import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, MessageSquare, Settings, LogOut, Key, CheckCircle2, XCircle, ImageIcon, Sparkles, Shield, Coins, Play } from "lucide-react";
import { apiKeysService, type AIProvider } from "@/services/apiKeysService";
import { adminService } from "@/services/adminService";
import { creditsService } from "@/services/creditsService";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";

const AI_PROVIDERS = [
  { id: "openai", name: "OpenAI", icon: "🤖", description: "GPT-4, GPT-3.5 Turbo" },
  { id: "anthropic", name: "Anthropic", icon: "🧠", description: "Claude 3 Opus, Sonnet, Haiku" },
  { id: "google", name: "Google AI", icon: "🔮", description: "Gemini Pro, Gemini Ultra" },
  { id: "mistral", name: "Mistral AI", icon: "⚡", description: "Mistral Large, Medium, Small" },
  { id: "cohere", name: "Cohere", icon: "🌟", description: "Command, Generate, Embed" },
];

export default function Home() {
  const router = useRouter();
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  const [credits, setCredits] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    loadConnectedProviders();
    loadCredits();
  }, []);

  const checkAdminStatus = async () => {
    const status = await adminService.isAdmin();
    setIsAdmin(status);
  };

  const loadCredits = async () => {
    try {
      const userCredits = await creditsService.getCredits();
      setCredits(userCredits);
    } catch (error) {
      console.error("Error loading credits:", error);
    }
  };

  const loadConnectedProviders = async () => {
    try {
      const adminSettings = await adminService.getAdminSettings();
      const connected = new Set(
        adminSettings
          .filter(s => s.is_active)
          .map(s => s.provider)
      );
      setConnectedProviders(connected);
    } catch (error) {
      console.error("Error loading admin settings:", error);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;

    setLoading(true);
    try {
      await apiKeysService.createOrUpdateApiKey({
        provider: selectedProvider,
        encrypted_key: apiKey,
      });
      await loadConnectedProviders();
      setDialogOpen(false);
      setApiKey("");
    } catch (error) {
      console.error("Error saving API key:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-lg font-heading font-bold">kAIkus</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-lg border border-accent/20">
                  <Coins className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">{credits}</span>
                  <span className="text-xs text-muted-foreground">kreditů</span>
                </div>
                <ThemeSwitch />
                {isAdmin && (
                  <Button variant="ghost" onClick={() => router.push("/admin")}>
                    <Shield className="h-5 w-5 mr-2" />
                    Admin
                  </Button>
                )}
                <Button variant="ghost" onClick={() => router.push("/chat")}>
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Chat
                </Button>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container py-8">
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-heading font-bold mb-2">Dashboard</h2>
              <p className="text-muted-foreground">
                Připojte své AI modely a začněte konverzovat
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {AI_PROVIDERS.map((provider) => {
                const isConnected = connectedProviders.has(provider.id);
                return (
                  <Card key={provider.id} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="text-4xl mb-2">{provider.icon}</div>
                        {isConnected ? (
                          <Badge variant="default" className="bg-accent">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Připojeno
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Nepřipojeno
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="font-heading">{provider.name}</CardTitle>
                      <CardDescription>{provider.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Dialog open={dialogOpen && selectedProvider === provider.id} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant={isConnected ? "outline" : "default"}
                            className="w-full"
                            onClick={() => setSelectedProvider(provider.id as AIProvider)}
                          >
                            <Key className="h-4 w-4 mr-2" />
                            {isConnected ? "Změnit klíč" : "Přidat API klíč"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="font-heading">
                              {provider.name} API klíč
                            </DialogTitle>
                            <DialogDescription>
                              Zadejte svůj API klíč pro {provider.name}. Klíč bude bezpečně uložen.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="apiKey">API klíč</Label>
                              <Input
                                id="apiKey"
                                type="password"
                                placeholder="sk-..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                              />
                            </div>
                            <Button 
                              onClick={handleSaveApiKey} 
                              className="w-full"
                              disabled={loading || !apiKey}
                            >
                              {loading ? "Ukládání..." : "Uložit klíč"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {isConnected && (
                        <Button 
                          variant="secondary" 
                          className="w-full"
                          onClick={() => router.push("/chat")}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Začít chat
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-primary/10 rounded-xl mb-2">
                      <ImageIcon className="h-8 w-8 text-primary" />
                    </div>
                    <Badge variant="default" className="bg-accent">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Nové
                    </Badge>
                  </div>
                  <CardTitle className="font-heading">Image Generation</CardTitle>
                  <CardDescription>DALL-E, Stable Diffusion, Midjourney</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full"
                    onClick={() => router.push("/generate")}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Vygenerovat obrázek
                  </Button>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow border-secondary/20 bg-gradient-to-br from-secondary/5 to-primary/5">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-secondary/10 rounded-xl mb-2">
                      <Play className="h-8 w-8 text-secondary" />
                    </div>
                    <Badge variant="default" className="bg-accent">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Nové
                    </Badge>
                  </div>
                  <CardTitle className="font-heading">Video Generation</CardTitle>
                  <CardDescription>RunwayML, Pika Labs, Stability AI</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full"
                    onClick={() => router.push("/video-generate")}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Vygenerovat video
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}