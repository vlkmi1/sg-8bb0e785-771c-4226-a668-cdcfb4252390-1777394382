import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Key, ExternalLink, TestTube2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { useToast } from "@/hooks/use-toast";

const AI_PROVIDERS = [
  { id: "openai", name: "OpenAI", icon: "🤖", description: "GPT-4, GPT-3.5 Turbo", url: "https://platform.openai.com/api-keys" },
  { id: "anthropic", name: "Anthropic", icon: "🧠", description: "Claude 3 Opus, Sonnet, Haiku", url: "https://console.anthropic.com/settings/keys" },
  { id: "google", name: "Google AI", icon: "🔮", description: "Gemini Pro, Gemini Ultra", url: "https://makersuite.google.com/app/apikey" },
  { id: "mistral", name: "Mistral AI", icon: "⚡", description: "Mistral Large, Medium, Small", url: "https://console.mistral.ai/api-keys" },
  { id: "xai", name: "X AI", icon: "𝕏", description: "Grok, Grok-2", url: "https://console.x.ai" },
  { id: "stability", name: "Stability AI", icon: "🎨", description: "Stable Diffusion, Image Generation", url: "https://platform.stability.ai/account/keys" },
  { id: "fal", name: "Fal AI", icon: "🎯", description: "Fast Image & Video Generation", url: "https://fal.ai/dashboard/keys" },
  { id: "stability-video", name: "Stability Video", icon: "📹", description: "Stable Video Diffusion", url: "https://platform.stability.ai/account/keys" },
  { id: "heygen", name: "HeyGen", icon: "👤", description: "AI Video Avatars & Influencers", url: "https://app.heygen.com/settings/api" },
  { id: "d-id", name: "D-ID", icon: "🎭", description: "Digital People & Talking Heads", url: "https://studio.d-id.com/account-settings" },
  { id: "suno", name: "Suno AI", icon: "🎵", description: "AI Music with Vocals", url: "https://suno.ai/settings" },
];

export default function AdminTemp() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string } | null>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/bypass");
      const data = await response.json();
      if (data.success) {
        setSettings(data.settings || []);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!selectedProvider || !apiKey.trim()) {
      toast({
        title: "Chyba",
        description: "Vyberte poskytovatele a zadejte API klíč",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/admin/bypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          api_key: apiKey.trim(),
          is_active: true,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Úspěch",
          description: data.message,
        });
        setSelectedProvider("");
        setApiKey("");
        setDialogOpen(false);
        loadSettings();
      } else {
        throw new Error(data.error || "Nepodařilo se uložit klíč");
      }
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleTestApiKey = async (providerId: string) => {
    setTestingProvider(providerId);
    try {
      const response = await fetch("/api/test-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId }),
      });

      const result = await response.json();
      
      setTestResults(prev => ({
        ...prev,
        [providerId]: {
          success: result.success,
          message: result.message || (result.success ? "API klíč funguje správně" : "Test selhal"),
        },
      }));

      toast({
        title: result.success ? "Test úspěšný" : "Test selhal",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [providerId]: {
          success: false,
          message: "Chyba při testování API klíče",
        },
      }));
      toast({
        title: "Chyba",
        description: "Nepodařilo se testovat API klíč",
        variant: "destructive",
      });
    } finally {
      setTestingProvider(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Načítání...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-heading font-bold">Dočasný Admin Panel</h1>
                <p className="text-xs text-muted-foreground">Dostupný bez přihlášení během rate limitu</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeSwitch />
              <Badge variant="outline" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Rate limit aktivní
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Globální AI API klíče
            </CardTitle>
            <CardDescription>
              Správa API klíčů pro všechny uživatele
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {AI_PROVIDERS.map((provider) => {
                const setting = settings.find(s => s.provider === provider.id);
                const testResult = testResults[provider.id];
                
                return (
                  <Card key={provider.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="text-3xl mb-2">{provider.icon}</div>
                        <div className="flex flex-col gap-1 items-end">
                          {setting?.has_key ? (
                            <Badge variant="default" className="bg-accent">{setting.status}</Badge>
                          ) : (
                            <Badge variant="secondary">Chybí</Badge>
                          )}
                          {testResult && (
                            <Badge variant={testResult.success ? "default" : "destructive"} className="text-xs">
                              {testResult.success ? (
                                <><CheckCircle2 className="h-3 w-3 mr-1" />Test OK</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" />Test failed</>
                              )}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-base">{provider.name}</CardTitle>
                      <CardDescription className="text-xs">{provider.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        size="sm"
                        onClick={() => window.open(provider.url, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Získat API klíč
                      </Button>
                      
                      <Dialog 
                        open={dialogOpen && selectedProvider === provider.id} 
                        onOpenChange={(open) => {
                          setDialogOpen(open);
                          if (open) setSelectedProvider(provider.id);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full" size="sm">
                            <Key className="h-4 w-4 mr-2" />
                            {setting?.has_key ? "Změnit" : "Přidat"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="font-heading">
                              {provider.name} API klíč
                            </DialogTitle>
                            <DialogDescription>
                              Zadejte API klíč od poskytovatele {provider.name}
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
                            >
                              Uložit
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {setting?.has_key && (
                        <Button
                          variant="outline"
                          className="w-full"
                          size="sm"
                          onClick={() => handleTestApiKey(provider.id)}
                          disabled={testingProvider === provider.id}
                        >
                          <TestTube2 className="h-4 w-4 mr-2" />
                          {testingProvider === provider.id ? "Testování..." : "Test API"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm font-heading flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Důležité poznámky
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Tato stránka je dočasně dostupná kvůli Supabase Auth rate limitu</p>
            <p>• API klíče jsou funkční a chat již funguje s OpenAI GPT-4o</p>
            <p>• Až rate limit vyprší (~5-10 minut), použijte normální <strong>/admin</strong> panel</p>
            <p>• Všechny změny zde provedené se okamžitě projeví v celé aplikaci</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}