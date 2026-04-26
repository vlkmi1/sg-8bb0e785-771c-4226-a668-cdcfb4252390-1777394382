import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Key, CheckCircle2, XCircle, LogOut, Coins, Plus, Home } from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { adminService } from "@/services/adminService";
import { creditsService } from "@/services/creditsService";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type AdminSetting = Tables<"admin_settings">;

const AI_PROVIDERS = [
  { id: "openai", name: "OpenAI", icon: "🤖", description: "GPT-4, GPT-3.5 Turbo" },
  { id: "anthropic", name: "Anthropic", icon: "🧠", description: "Claude 3 Opus, Sonnet, Haiku" },
  { id: "google", name: "Google AI", icon: "🔮", description: "Gemini Pro, Gemini Ultra" },
  { id: "mistral", name: "Mistral AI", icon: "⚡", description: "Mistral Large, Medium, Small" },
  { id: "cohere", name: "Cohere", icon: "🌟", description: "Command, Generate, Embed" },
  { id: "nano-bannana", name: "Nano Bannana", icon: "🍌", description: "Fast AI Model for Quick Tasks" },
  { id: "nano-bannana-pro", name: "Nano Bannana PRO", icon: "🍌✨", description: "Advanced Nano Bannana Model" },
  { id: "stability", name: "Stability AI", icon: "🎨", description: "Stable Diffusion, Image Generation" },
  { id: "midjourney", name: "Midjourney", icon: "✨", description: "AI Art Generation" },
  { id: "runwayml", name: "RunwayML", icon: "🎬", description: "Gen-2 Video Generation" },
  { id: "pika", name: "Pika Labs", icon: "🎥", description: "Text-to-Video, 3D Animations" },
  { id: "stability-video", name: "Stability Video", icon: "📹", description: "Stable Video Diffusion" },
  { id: "heygen", name: "HeyGen", icon: "👤", description: "AI Video Avatars & Influencers" },
  { id: "d-id", name: "D-ID", icon: "🎭", description: "Digital People & Talking Heads" },
  { id: "synthesia", name: "Synthesia", icon: "🎬", description: "AI Video Platform with Avatars" },
  { id: "runway-gen2", name: "Runway Gen-2", icon: "🚀", description: "Advanced Video AI Models" },
  { id: "suno", name: "Suno AI", icon: "🎵", description: "AI Music with Vocals" },
  { id: "musicgen", name: "MusicGen", icon: "🎹", description: "Meta AI Music Model" },
  { id: "mubert", name: "Mubert", icon: "🎧", description: "Real-time AI Music" },
  { id: "aiva", name: "AIVA", icon: "🎼", description: "AI Orchestral Composer" },
  { id: "soundraw", name: "Soundraw", icon: "🎶", description: "Royalty-Free AI Music" },
];

export default function Admin() {
  const router = useRouter();
  const [adminSettings, setAdminSettings] = useState<AdminSetting[]>([]);
  const [users, setUsers] = useState<Array<{ id: string; email: string; full_name: string | null; credits: number }>>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creditsDialogOpen, setCreditsDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [creditsToAdd, setCreditsToAdd] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAdminSettings();
    loadUsers();
  }, []);

  const loadAdminSettings = async () => {
    try {
      const data = await adminService.getAdminSettings();
      setAdminSettings(data);
    } catch (error) {
      console.error("Error loading admin settings:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await creditsService.getAllUsersCredits();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleOpenDialog = (providerId: string) => {
    setSelectedProvider(providerId);
    const existing = adminSettings.find(s => s.provider === providerId);
    if (existing) {
      setApiKey(existing.api_key);
    } else {
      setApiKey("");
    }
    setDialogOpen(true);
  };

  const handleSaveApiKey = async (e: FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;

    setLoading(true);
    try {
      const existing = adminSettings.find(s => s.provider === selectedProvider);
      
      if (existing) {
        await adminService.updateAdminSetting(selectedProvider, {
          api_key: apiKey,
        });
      } else {
        await adminService.createAdminSetting({
          provider: selectedProvider,
          api_key: apiKey,
        });
      }

      await loadAdminSettings();
      setDialogOpen(false);
      setApiKey("");
    } catch (error) {
      console.error("Error saving setting:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !creditsToAdd) return;

    const amount = parseInt(creditsToAdd);
    if (isNaN(amount) || amount <= 0) {
      alert("Zadejte platné číslo kreditů");
      return;
    }

    setLoading(true);
    try {
      await creditsService.addCredits(selectedUserId, amount);
      await loadUsers();
      setCreditsDialogOpen(false);
      setSelectedUserId("");
      setCreditsToAdd("");
    } catch (error) {
      console.error("Error adding credits:", error);
      alert("Chyba při přidávání kreditů");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProvider = async (providerId: string) => {
    setLoading(true);
    try {
      const setting = adminSettings.find(s => s.provider === providerId);
      const isActive = setting ? setting.is_active : false;
      await adminService.toggleAdminSetting(providerId, !isActive);
      await loadAdminSettings();
    } catch (error) {
      console.error("Error toggling provider:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
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
                <h1 className="text-lg font-heading font-bold">Admin Dashboard</h1>
              </div>
              <div className="flex items-center gap-2">
                <ThemeSwitch />
                <Button variant="ghost" onClick={() => router.push("/")}>
                  <Home className="h-5 w-5 mr-2" />
                  Zpět
                </Button>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          <Tabs defaultValue="api-keys" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="api-keys">API klíče</TabsTrigger>
              <TabsTrigger value="credits">Kredity uživatelů</TabsTrigger>
            </TabsList>

            <TabsContent value="api-keys" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    Centrální API klíče
                  </CardTitle>
                  <CardDescription>
                    Spravujte API klíče pro všechny AI poskytovatele. Tyto klíče používají všichni uživatelé platformy.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Poskytovatel</TableHead>
                        <TableHead>Stav</TableHead>
                        <TableHead>Poslední aktualizace</TableHead>
                        <TableHead className="text-right">Akce</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {AI_PROVIDERS.map((provider) => {
                        const setting = adminSettings.find(s => s.provider === provider.id);
                        return (
                          <TableRow key={provider.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl">{provider.icon}</span>
                                <div>
                                  <div className="font-semibold">{provider.name}</div>
                                  <div className="text-xs text-muted-foreground">{provider.description}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {setting?.is_active ? (
                                <Badge variant="default" className="bg-accent">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Aktivní
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Neaktivní
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {setting?.updated_at 
                                ? new Date(setting.updated_at).toLocaleDateString("cs-CZ")
                                : "—"
                              }
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Dialog 
                                  open={dialogOpen && selectedProvider === provider.id} 
                                  onOpenChange={(open) => {
                                    setDialogOpen(open);
                                    if (open) setSelectedProvider(provider.id);
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      {setting ? "Upravit" : "Přidat"} klíč
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle className="font-heading">
                                        {provider.name} API klíč
                                      </DialogTitle>
                                      <DialogDescription>
                                        Nastavte centrální API klíč pro {provider.name}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleSaveApiKey} className="space-y-4 py-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="apiKey">API klíč</Label>
                                        <Input
                                          id="apiKey"
                                          type="password"
                                          placeholder="sk-..."
                                          value={apiKey}
                                          onChange={(e) => setApiKey(e.target.value)}
                                          required
                                        />
                                      </div>
                                      <Button type="submit" className="w-full" disabled={loading}>
                                        {loading ? "Ukládání..." : "Uložit klíč"}
                                      </Button>
                                    </form>
                                  </DialogContent>
                                </Dialog>
                                {setting?.is_active && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleToggleProvider(provider.id)}
                                    disabled={loading}
                                  >
                                    Deaktivovat
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="credits" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Coins className="h-5 w-5 text-accent" />
                    Správa kreditů uživatelů
                  </CardTitle>
                  <CardDescription>
                    Přidávejte kredity uživatelům pro generování AI obsahu
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Uživatel</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Kredity</TableHead>
                        <TableHead className="text-right">Akce</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.full_name || "—"}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={user.credits < 10 ? "destructive" : "default"}>
                              {user.credits} kreditů
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Dialog 
                              open={creditsDialogOpen && selectedUserId === user.id} 
                              onOpenChange={(open) => {
                                setCreditsDialogOpen(open);
                                if (open) setSelectedUserId(user.id);
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Plus className="h-3 w-3 mr-1" />
                                  Přidat kredity
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="font-heading">
                                    Přidat kredity
                                  </DialogTitle>
                                  <DialogDescription>
                                    Přidejte kredity uživateli {user.email}
                                  </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleAddCredits} className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="credits">Počet kreditů</Label>
                                    <Input
                                      id="credits"
                                      type="number"
                                      min="1"
                                      placeholder="např. 50"
                                      value={creditsToAdd}
                                      onChange={(e) => setCreditsToAdd(e.target.value)}
                                      required
                                    />
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    Aktuální zůstatek: <strong>{user.credits} kreditů</strong>
                                  </div>
                                  <Button type="submit" className="w-full" disabled={loading}>
                                    {loading ? "Přidávání..." : "Přidat kredity"}
                                  </Button>
                                </form>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AdminGuard>
  );
}