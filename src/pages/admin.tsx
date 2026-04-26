import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Key, CheckCircle2, XCircle, Home, LogOut, Save, Trash2 } from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { adminService, type AdminSetting } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";

const AI_PROVIDERS = [
  { id: "openai", name: "OpenAI", icon: "🤖", description: "GPT-4, GPT-3.5, DALL-E" },
  { id: "anthropic", name: "Anthropic", icon: "🧠", description: "Claude 3 Opus, Sonnet, Haiku" },
  { id: "google", name: "Google AI", icon: "🔮", description: "Gemini Pro, Gemini Ultra" },
  { id: "mistral", name: "Mistral AI", icon: "⚡", description: "Mistral Large, Medium, Small" },
  { id: "cohere", name: "Cohere", icon: "🌟", description: "Command, Generate, Embed" },
  { id: "stability", name: "Stability AI", icon: "🎨", description: "Stable Diffusion XL" },
  { id: "midjourney", name: "Midjourney", icon: "✨", description: "Midjourney v6" },
];

export default function Admin() {
  const router = useRouter();
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [modelName, setModelName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await adminService.getAdminSettings();
      setSettings(data);
    } catch (error) {
      console.error("Error loading settings:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst nastavení",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (providerId: string) => {
    setSelectedProvider(providerId);
    const existing = settings.find(s => s.provider === providerId);
    if (existing) {
      setApiKey(existing.api_key);
      setModelName(existing.model_name || "");
    } else {
      setApiKey("");
      setModelName("");
    }
    setDialogOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setSaving(true);
    try {
      const existing = settings.find(s => s.provider === selectedProvider);
      
      if (existing) {
        await adminService.updateAdminSetting(selectedProvider, {
          api_key: apiKey,
          model_name: modelName || undefined,
        });
        toast({
          title: "Uloženo",
          description: `API klíč pro ${AI_PROVIDERS.find(p => p.id === selectedProvider)?.name} byl aktualizován`,
        });
      } else {
        await adminService.createAdminSetting({
          provider: selectedProvider,
          api_key: apiKey,
          model_name: modelName || undefined,
        });
        toast({
          title: "Přidáno",
          description: `API klíč pro ${AI_PROVIDERS.find(p => p.id === selectedProvider)?.name} byl přidán`,
        });
      }

      await loadSettings();
      setDialogOpen(false);
      setApiKey("");
      setModelName("");
    } catch (error) {
      console.error("Error saving setting:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit API klíč",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (provider: string, isActive: boolean) => {
    try {
      await adminService.toggleAdminSetting(provider, !isActive);
      await loadSettings();
      toast({
        title: isActive ? "Deaktivováno" : "Aktivováno",
        description: `API klíč pro ${AI_PROVIDERS.find(p => p.id === provider)?.name} byl ${isActive ? 'deaktivován' : 'aktivován'}`,
      });
    } catch (error) {
      console.error("Error toggling setting:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se změnit stav",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (provider: string) => {
    if (!confirm(`Opravdu chcete smazat API klíč pro ${AI_PROVIDERS.find(p => p.id === provider)?.name}?`)) {
      return;
    }

    try {
      await adminService.deleteAdminSetting(provider);
      await loadSettings();
      toast({
        title: "Smazáno",
        description: `API klíč pro ${AI_PROVIDERS.find(p => p.id === provider)?.name} byl smazán`,
      });
    } catch (error) {
      console.error("Error deleting setting:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se smazat API klíč",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const getProviderSetting = (providerId: string) => {
    return settings.find(s => s.provider === providerId);
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-heading font-bold">Admin Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Správa centrálních API klíčů</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => router.push("/")}>
                  <Home className="h-5 w-5 mr-2" />
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
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-heading font-bold mb-2">Centrální API klíče</h2>
              <p className="text-muted-foreground">
                Nastavte API klíče pro jednotlivé poskytovatele. Všichni uživatelé budou využívat tyto centrální klíče.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {AI_PROVIDERS.map((provider) => {
                  const setting = getProviderSetting(provider.id);
                  const isConfigured = !!setting;
                  const isActive = setting?.is_active ?? false;

                  return (
                    <Card key={provider.id} className="relative overflow-hidden">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{provider.icon}</div>
                            <div>
                              <CardTitle className="font-heading text-lg">{provider.name}</CardTitle>
                              <CardDescription className="text-sm">{provider.description}</CardDescription>
                            </div>
                          </div>
                          {isConfigured && (
                            <div className="flex flex-col items-end gap-2">
                              <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-accent" : ""}>
                                {isActive ? (
                                  <>
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Aktivní
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Neaktivní
                                  </>
                                )}
                              </Badge>
                              <Switch
                                checked={isActive}
                                onCheckedChange={() => handleToggle(provider.id, isActive)}
                              />
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {setting?.model_name && (
                          <div className="text-sm text-muted-foreground mb-3">
                            Model: <span className="font-medium text-foreground">{setting.model_name}</span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant={isConfigured ? "outline" : "default"}
                            className="flex-1"
                            onClick={() => handleOpenDialog(provider.id)}
                          >
                            <Key className="h-4 w-4 mr-2" />
                            {isConfigured ? "Upravit klíč" : "Přidat API klíč"}
                          </Button>
                          {isConfigured && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(provider.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </main>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">
                {AI_PROVIDERS.find(p => p.id === selectedProvider)?.name} - API Klíč
              </DialogTitle>
              <DialogDescription>
                Zadejte centrální API klíč pro všechny uživatele
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Klíč</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modelName">Model (volitelné)</Label>
                <Input
                  id="modelName"
                  placeholder="gpt-4, claude-3-opus..."
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving || !apiKey.trim()}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Ukládání..." : "Uložit API klíč"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminGuard>
  );
}