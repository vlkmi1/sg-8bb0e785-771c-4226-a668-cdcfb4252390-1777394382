import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Settings, Key, User, Bell, Shield, LogOut, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { apiKeysService, type AIProvider } from "@/services/apiKeysService";

const AI_PROVIDERS = [
  { id: "openai", name: "OpenAI", icon: "🤖", description: "GPT-4, GPT-3.5 Turbo" },
  { id: "anthropic", name: "Anthropic", icon: "🧠", description: "Claude 3 Opus, Sonnet, Haiku" },
  { id: "google", name: "Google AI", icon: "🔮", description: "Gemini Pro, Gemini Ultra" },
  { id: "mistral", name: "Mistral AI", icon: "⚡", description: "Mistral Large, Medium, Small" },
  { id: "cohere", name: "Cohere", icon: "🌟", description: "Command, Generate, Embed" },
];

export default function SettingsPage() {
  const router = useRouter();
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadConnectedProviders();
  }, []);

  const loadConnectedProviders = async () => {
    try {
      const keys = await apiKeysService.getApiKeys();
      const connected = new Set(keys.map(k => k.provider));
      setConnectedProviders(connected);
    } catch (error) {
      console.error("Error loading API keys:", error);
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
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-lg font-heading font-bold">Nastavení</h1>
              </div>
              <div className="flex items-center gap-2">
                <ThemeSwitch />
                <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Dashboard
                </Button>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          <Tabs defaultValue="api" className="space-y-6">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3">
              <TabsTrigger value="api">
                <Key className="h-4 w-4 mr-2" />
                API klíče
              </TabsTrigger>
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profil
              </TabsTrigger>
              <TabsTrigger value="preferences">
                <Bell className="h-4 w-4 mr-2" />
                Předvolby
              </TabsTrigger>
            </TabsList>

            <TabsContent value="api" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    Správa API klíčů
                  </CardTitle>
                  <CardDescription>
                    Spravujte své osobní API klíče pro jednotlivé AI poskytovatele. Tyto klíče budou použity místo centrálních klíčů.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {AI_PROVIDERS.map((provider) => {
                      const isConnected = connectedProviders.has(provider.id);
                      return (
                        <Card key={provider.id} className="relative overflow-hidden">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="text-3xl mb-2">{provider.icon}</div>
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
                            <CardTitle className="text-base font-heading">{provider.name}</CardTitle>
                            <CardDescription className="text-xs">{provider.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Dialog 
                              open={dialogOpen && selectedProvider === provider.id} 
                              onOpenChange={setDialogOpen}
                            >
                              <DialogTrigger asChild>
                                <Button 
                                  variant={isConnected ? "outline" : "default"}
                                  className="w-full"
                                  size="sm"
                                  onClick={() => setSelectedProvider(provider.id as AIProvider)}
                                >
                                  <Key className="h-3 w-3 mr-2" />
                                  {isConnected ? "Změnit klíč" : "Přidat API klíč"}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="font-heading">
                                    {provider.name} API klíč
                                  </DialogTitle>
                                  <DialogDescription>
                                    Zadejte svůj API klíč pro {provider.name}. Klíč bude bezpečně uložen a šifrován.
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
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-muted">
                <CardHeader>
                  <CardTitle className="text-sm font-heading flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    Informace o API klíčích
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>• Pokud nepřidáte vlastní klíč, budou použity centrální API klíče spravované administrátorem</p>
                  <p>• Vaše klíče jsou šifrovány a bezpečně uloženy v databázi</p>
                  <p>• Můžete je kdykoli změnit nebo odstranit</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Informace o profilu
                  </CardTitle>
                  <CardDescription>
                    Spravujte své osobní údaje a nastavení účtu.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">
                    Tato sekce bude brzy dostupná
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Předvolby a notifikace
                  </CardTitle>
                  <CardDescription>
                    Přizpůsobte si chování aplikace podle svých potřeb.
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">
                    Tato sekce bude brzy dostupná
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  );
}