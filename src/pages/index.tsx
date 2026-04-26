import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, MessageSquare, Settings, LogOut, Key, CheckCircle2, XCircle } from "lucide-react";
import { apiKeysService, type AIProvider } from "@/services/apiKeysService";
import { AuthGuard } from "@/components/AuthGuard";

const AI_PROVIDERS = [
  { id: "openai", name: "OpenAI", icon: "🤖", description: "GPT-4, GPT-3.5 Turbo" },
  { id: "anthropic", name: "Anthropic", icon: "🧠", description: "Claude 3 Opus, Sonnet, Haiku" },
  { id: "google", name: "Google AI", icon: "🔍", description: "Gemini Pro, Gemini Ultra" },
  { id: "mistral", name: "Mistral AI", icon: "🌊", description: "Mistral Large, Medium" },
  { id: "cohere", name: "Cohere", icon: "💬", description: "Command R+, Command" },
];

export default function Dashboard() {
  const router = useRouter();
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set());
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const keys = await apiKeysService.getApiKeys();
      setConnectedProviders(new Set(keys.map(k => k.provider)));
    } catch (error) {
      console.error("Error loading API keys:", error);
    }
  };

  const handleSaveApiKey = async () => {
    if (!selectedProvider || !apiKey) return;
    
    setLoading(true);
    try {
      await apiKeysService.createOrUpdateApiKey({
        provider: selectedProvider,
        encrypted_key: apiKey,
      });
      await loadApiKeys();
      setApiKey("");
      setDialogOpen(false);
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
        <header className="border-b bg-card">
          <div className="container flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-xl font-heading font-bold">kAIkus</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleSignOut}>
                <LogOut className="h-5 w-5" />
              </Button>
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
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}