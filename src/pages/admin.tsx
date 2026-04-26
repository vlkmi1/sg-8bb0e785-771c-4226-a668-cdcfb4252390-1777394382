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
import { Shield, Key, Users, Coins, LogOut, Plus, Edit, Trash2, CreditCard, Crown, Settings, TrendingUp, Check, AlertCircle, ExternalLink, TestTube2, CheckCircle2, XCircle } from "lucide-react";
import { AdminGuard } from "@/components/AdminGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { useToast } from "@/hooks/use-toast";
import { adminService, type AdminSetting } from "@/services/adminService";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreditAnalytics } from "@/components/admin/CreditAnalytics";

const AI_PROVIDERS = [
  { id: "openai", name: "OpenAI", icon: "🤖", description: "GPT-4, GPT-3.5 Turbo", url: "https://platform.openai.com/api-keys" },
  { id: "anthropic", name: "Anthropic", icon: "🧠", description: "Claude 3 Opus, Sonnet, Haiku", url: "https://console.anthropic.com/settings/keys" },
  { id: "google", name: "Google AI", icon: "🔮", description: "Gemini Pro, Gemini Ultra", url: "https://makersuite.google.com/app/apikey" },
  { id: "mistral", name: "Mistral AI", icon: "⚡", description: "Mistral Large, Medium, Small", url: "https://console.mistral.ai/api-keys" },
  { id: "cohere", name: "Cohere", icon: "🌟", description: "Command, Generate, Embed", url: "https://dashboard.cohere.com/api-keys" },
  { id: "xai", name: "X AI", icon: "𝕏", description: "Grok, Grok-2", url: "https://console.x.ai" },
  { id: "nano-bannana", name: "Nano Bannana", icon: "🍌", description: "Fast AI Model for Quick Tasks", url: "https://nanobannana.ai" },
  { id: "nano-bannana-pro", name: "Nano Bannana PRO", icon: "🍌✨", description: "Advanced Nano Bannana Model", url: "https://nanobannana.ai/pro" },
  { id: "stability", name: "Stability AI", icon: "🎨", description: "Stable Diffusion, Image Generation", url: "https://platform.stability.ai/account/keys" },
  { id: "midjourney", name: "Midjourney", icon: "✨", description: "AI Art Generation", url: "https://www.midjourney.com/account" },
  { id: "fal", name: "Fal AI", icon: "🎯", description: "Fast Image & Video Generation", url: "https://fal.ai/dashboard/keys" },
  { id: "runwayml", name: "RunwayML", icon: "🎬", description: "Gen-2 Video Generation", url: "https://app.runwayml.com/settings" },
  { id: "pika", name: "Pika Labs", icon: "🎥", description: "Text-to-Video, 3D Animations", url: "https://pika.art/settings" },
  { id: "stability-video", name: "Stability Video", icon: "📹", description: "Stable Video Diffusion", url: "https://platform.stability.ai/account/keys" },
  { id: "heygen", name: "HeyGen", icon: "👤", description: "AI Video Avatars & Influencers", url: "https://app.heygen.com/settings/api" },
  { id: "d-id", name: "D-ID", icon: "🎭", description: "Digital People & Talking Heads", url: "https://studio.d-id.com/account-settings" },
  { id: "synthesia", name: "Synthesia", icon: "🎬", description: "AI Video Platform with Avatars", url: "https://app.synthesia.io/settings/integrations" },
  { id: "runway-gen2", name: "Runway Gen-2", icon: "🚀", description: "Advanced Video AI Models", url: "https://app.runwayml.com/settings" },
  { id: "suno", name: "Suno AI", icon: "🎵", description: "AI Music with Vocals", url: "https://suno.ai/settings" },
  { id: "musicgen", name: "MusicGen", icon: "🎹", description: "Meta AI Music Model", url: "https://huggingface.co/settings/tokens" },
  { id: "mubert", name: "Mubert", icon: "🎧", description: "Real-time AI Music", url: "https://mubert.com/render/api" },
  { id: "aiva", name: "AIVA", icon: "🎼", description: "AI Orchestral Composer", url: "https://www.aiva.ai/profile" },
  { id: "soundraw", name: "Soundraw", icon: "🎶", description: "Royalty-Free AI Music", url: "https://soundraw.io/account" },
  { id: "viral-runway", name: "Runway Viral", icon: "📲", description: "Viral Video Generation", url: "https://app.runwayml.com/settings" },
  { id: "viral-pika", name: "Pika Viral", icon: "🔥", description: "Social Media Optimized Videos", url: "https://pika.art/settings" },
  { id: "capcut", name: "CapCut AI", icon: "✂️", description: "TikTok Video Editor AI", url: "https://www.capcut.com/tools/api" },
];

// Provider to modules mapping
const PROVIDER_MODULES = {
  openai: [
    { name: "Chat", path: "/chat", icon: "💬", description: "Přidat GPT modely do chatu" },
    { name: "Asistenti", path: "/assistants", icon: "🤖", description: "Vytvářet AI asistenty s GPT" },
  ],
  anthropic: [
    { name: "Chat", path: "/chat", icon: "💬", description: "Přidat Claude modely do chatu" },
    { name: "Asistenti", path: "/assistants", icon: "🤖", description: "Vytvářet asistenty s Claude" },
  ],
  google: [
    { name: "Chat", path: "/chat", icon: "💬", description: "Přidat Gemini do chatu" },
    { name: "Asistenti", path: "/assistants", icon: "🤖", description: "Vytvářet asistenty s Gemini" },
  ],
  mistral: [
    { name: "Chat", path: "/chat", icon: "💬", description: "Přidat Mistral modely do chatu" },
    { name: "Asistenti", path: "/assistants", icon: "🤖", description: "Vytvářet asistenty s Mistral" },
  ],
  xai: [
    { name: "Chat", path: "/chat", icon: "💬", description: "Přidat Grok do chatu" },
    { name: "Asistenti", path: "/assistants", icon: "🤖", description: "Vytvářet asistenty s Grok" },
  ],
  stability: [
    { name: "Generování obrázků", path: "/generate", icon: "🎨", description: "Vytvářet obrázky s Stable Diffusion" },
    { name: "AI Influencer", path: "/ai-influencer", icon: "👤", description: "Generovat avatary influencerů" },
  ],
  midjourney: [
    { name: "Generování obrázků", path: "/generate", icon: "🎨", description: "Vytvářet art s Midjourney" },
  ],
  fal: [
    { name: "Generování obrázků", path: "/generate", icon: "🎨", description: "Rychlé generování obrázků" },
    { name: "Generování videí", path: "/video-generate", icon: "🎥", description: "Rychlé generování videí" },
  ],
  runwayml: [
    { name: "Generování videí", path: "/video-generate", icon: "🎥", description: "Vytvářet videa s Gen-2" },
    { name: "Virální videa", path: "/viral-videos", icon: "📲", description: "Trendy pro sociální sítě" },
  ],
  pika: [
    { name: "Generování videí", path: "/video-generate", icon: "🎥", description: "Text-to-Video, animace" },
    { name: "Virální videa", path: "/viral-videos", icon: "📲", description: "Virální obsah" },
  ],
  "stability-video": [
    { name: "Generování videí", path: "/video-generate", icon: "🎥", description: "Stable Video Diffusion" },
  ],
  heygen: [
    { name: "AI Influencer", path: "/ai-influencer", icon: "👤", description: "Digitální avatary" },
  ],
  "d-id": [
    { name: "AI Influencer", path: "/ai-influencer", icon: "👤", description: "Talking heads, avatary" },
  ],
  synthesia: [
    { name: "AI Influencer", path: "/ai-influencer", icon: "👤", description: "Video avatary" },
  ],
  "runway-gen2": [
    { name: "Generování videí", path: "/video-generate", icon: "🎥", description: "Pokročilé video AI" },
    { name: "Virální videa", path: "/viral-videos", icon: "📲", description: "Virální obsah Gen-2" },
  ],
  suno: [
    { name: "Hudba", path: "/music-generate", icon: "🎵", description: "AI hudba s vokály" },
  ],
  musicgen: [
    { name: "Hudba", path: "/music-generate", icon: "🎵", description: "Instrumentální AI hudba" },
  ],
  mubert: [
    { name: "Hudba", path: "/music-generate", icon: "🎵", description: "Real-time AI hudba" },
  ],
  aiva: [
    { name: "Hudba", path: "/music-generate", icon: "🎵", description: "Orchestrální skladby" },
  ],
  soundraw: [
    { name: "Hudba", path: "/music-generate", icon: "🎵", description: "Royalty-free hudba" },
  ],
  "viral-runway": [
    { name: "Virální videa", path: "/viral-videos", icon: "📲", description: "Virální video generace" },
  ],
  "viral-pika": [
    { name: "Virální videa", path: "/viral-videos", icon: "📲", description: "Social media optimalizace" },
  ],
  capcut: [
    { name: "Virální videa", path: "/viral-videos", icon: "📲", description: "TikTok AI editor" },
  ],
};

export default function Admin() {
  const router = useRouter();
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string } | null>>({});
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [showModelsDialog, setShowModelsDialog] = useState(false);
  const [currentProvider, setCurrentProvider] = useState("");
  const { toast } = useToast();
  const [showModuleSuggestions, setShowModuleSuggestions] = useState(false);

  // Plan form states
  const [planForm, setPlanForm] = useState({
    tier: "basic",
    name: "",
    price: 0,
    credits_included: 0,
    features: [] as string[],
    modules: [] as string[],
  });

  // Package form states
  const [packageForm, setPackageForm] = useState({
    name: "",
    credits: 0,
    price: 0,
    bonus_credits: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsData, plansData, packagesData] = await Promise.all([
        adminService.getAdminSettings(),
        loadPlans(),
        loadPackages(),
      ]);
      setSettings(settingsData);
      setPlans(plansData);
      setPackages(packagesData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const loadPlans = async () => {
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("price", { ascending: true });
    if (error) throw error;
    return data || [];
  };

  const loadPackages = async () => {
    const { data, error } = await supabase
      .from("credit_packages")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) throw error;
    return data || [];
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

    setLoading(true);
    try {
      await adminService.saveAdminSetting(selectedProvider, apiKey.trim());
      toast({
        title: "Úspěch",
        description: "API klíč byl uložen",
      });
      
      // Show module suggestions if provider has modules
      if (PROVIDER_MODULES[selectedProvider as keyof typeof PROVIDER_MODULES]) {
        setCurrentProvider(selectedProvider);
        setShowModuleSuggestions(true);
      }
      
      setSelectedProvider("");
      setApiKey("");
      setDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit API klíč",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestApiKey = async (providerId: string) => {
    const setting = settings.find(s => s.provider === providerId);
    if (!setting?.api_key) {
      toast({
        title: "Chyba",
        description: "API klíč není nastaven",
        variant: "destructive",
      });
      return;
    }

    setTestingProvider(providerId);
    try {
      const response = await fetch("/api/test-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: providerId, apiKey: setting.api_key }),
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const handleAddApiKey = async (provider: string) => {
    if (!newApiKey.trim()) {
      toast({
        title: "Chyba",
        description: "Zadejte API klíč",
        variant: "destructive",
      });
      return;
    }

    setIsAddingKey(true);
    try {
      const result = await apiKeysService.addApiKey(provider, newApiKey.trim());
      
      if (result) {
        toast({
          title: "Úspěch",
          description: `${provider} API klíč byl přidán`,
        });
        
        setNewApiKey("");
        setActiveProvider(null);
        loadApiKeys();

        // Načíst dostupné modely
        try {
          const modelsResponse = await fetch("/api/fetch-models", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ provider, apiKey: newApiKey.trim() }),
          });

          if (modelsResponse.ok) {
            const { models } = await modelsResponse.json();
            setAvailableModels(models);
            setCurrentProvider(provider);
            setShowModelsDialog(true);
          }
        } catch (error) {
          console.error("Failed to fetch models:", error);
        }
      }
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se přidat API klíč",
        variant: "destructive",
      });
    } finally {
      setIsAddingKey(false);
    }
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
                <h1 className="text-lg font-heading font-bold">Admin Panel</h1>
              </div>
              <div className="flex items-center gap-2">
                <ThemeSwitch />
                <Button variant="ghost" onClick={() => router.push("/dashboard")}>
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
          <Tabs defaultValue="api-keys" className="space-y-6">
            <TabsList className="grid w-full max-w-5xl mx-auto grid-cols-7">
              <TabsTrigger value="analytics">Analytika</TabsTrigger>
              <TabsTrigger value="api-keys">API klíče</TabsTrigger>
              <TabsTrigger value="subscriptions">Předplatná</TabsTrigger>
              <TabsTrigger value="packages">Balíčky</TabsTrigger>
              <TabsTrigger value="payments">Platby</TabsTrigger>
              <TabsTrigger value="affiliate">Affiliate</TabsTrigger>
              <TabsTrigger value="users">Uživatelé</TabsTrigger>
            </TabsList>

            <TabsContent value="analytics">
              <CreditAnalytics />
            </TabsContent>

            <TabsContent value="api-keys" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    Globální AI API klíče
                  </CardTitle>
                  <CardDescription>
                    Správa API klíčů pro všechny uživatele (fallback když nemají vlastní)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {AI_PROVIDERS.map((provider) => {
                      const hasSetting = settings.some(s => s.provider === provider.id);
                      const testResult = testResults[provider.id];
                      
                      return (
                        <Card key={provider.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="text-3xl mb-2">{provider.icon}</div>
                              <div className="flex flex-col gap-1 items-end">
                                {hasSetting ? (
                                  <Badge variant="default" className="bg-accent">Nastaveno</Badge>
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
                                  {hasSetting ? "Změnit" : "Přidat"}
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
                                    disabled={loading}
                                  >
                                    {loading ? "Ukládání..." : "Uložit"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>

                            {hasSetting && (
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
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-heading flex items-center gap-2">
                        <Crown className="h-5 w-5 text-primary" />
                        Správa předplatných
                      </CardTitle>
                      <CardDescription>
                        Nastavení plánů, cen a dostupných modulů
                      </CardDescription>
                    </div>
                    <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Nový plán
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Vytvořit předplatný plán</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <p className="text-sm text-muted-foreground">
                            Funkce připravena - implementace formuláře pro vytváření plánů
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plán</TableHead>
                        <TableHead>Cena</TableHead>
                        <TableHead>Kredity</TableHead>
                        <TableHead>Moduly</TableHead>
                        <TableHead className="text-right">Akce</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">{plan.name}</TableCell>
                          <TableCell>{plan.price} Kč/{plan.billing_period === "monthly" ? "měs" : "rok"}</TableCell>
                          <TableCell>{plan.credits_included === 999999 ? "∞" : plan.credits_included}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {(plan.modules as string[])?.slice(0, 3).map((m: string) => (
                                <Badge key={m} variant="secondary" className="text-xs">
                                  {m}
                                </Badge>
                              ))}
                              {(plan.modules as string[])?.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{(plan.modules as string[]).length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="packages" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-heading flex items-center gap-2">
                        <Coins className="h-5 w-5 text-accent" />
                        Balíčky kreditů
                      </CardTitle>
                      <CardDescription>
                        Správa nabídky balíčků pro dobíjení
                      </CardDescription>
                    </div>
                    <Dialog open={packageDialogOpen} onOpenChange={setPackageDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Nový balíček
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Vytvořit balíček kreditů</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <p className="text-sm text-muted-foreground">
                            Funkce připravena - implementace formuláře pro vytváření balíčků
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Název</TableHead>
                        <TableHead>Kredity</TableHead>
                        <TableHead>Bonus</TableHead>
                        <TableHead>Cena</TableHead>
                        <TableHead className="text-right">Akce</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packages.map((pkg) => (
                        <TableRow key={pkg.id}>
                          <TableCell className="font-medium">{pkg.name}</TableCell>
                          <TableCell>{pkg.credits}</TableCell>
                          <TableCell>
                            {pkg.bonus_credits > 0 && (
                              <Badge variant="secondary" className="bg-accent/10">
                                +{pkg.bonus_credits}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>{pkg.price} Kč</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Nastavení plateb
                  </CardTitle>
                  <CardDescription>
                    Konfigurace platebních metod a bran
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="paypal-client">PayPal Client ID</Label>
                      <Input
                        id="paypal-client"
                        placeholder="AXX..."
                        defaultValue=""
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paypal-secret">PayPal Secret</Label>
                      <Input
                        id="paypal-secret"
                        type="password"
                        placeholder="EXX..."
                        defaultValue=""
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bank-account">Číslo účtu pro QR kódy</Label>
                      <Input
                        id="bank-account"
                        placeholder="123456789/0100"
                        defaultValue="123456789/0100"
                      />
                    </div>
                    <Button className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Uložit nastavení plateb
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="affiliate" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Nastavení provizního systému
                  </CardTitle>
                  <CardDescription>
                    Sazby provizí a minimální částka pro výplatu
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-base">Provize z předplatného</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="subscription-rate">Provizní sazba (%)</Label>
                          <Input
                            id="subscription-rate"
                            type="number"
                            step="0.01"
                            defaultValue="20.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subscription-min">Min. částka výběru (Kč)</Label>
                          <Input
                            id="subscription-min"
                            type="number"
                            step="0.01"
                            defaultValue="500.00"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-base">Provize z kreditů</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="credits-rate">Provizní sazba (%)</Label>
                          <Input
                            id="credits-rate"
                            type="number"
                            step="0.01"
                            defaultValue="15.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="credits-min">Min. částka výběru (Kč)</Label>
                          <Input
                            id="credits-min"
                            type="number"
                            step="0.01"
                            defaultValue="500.00"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Button className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Uložit nastavení provizí
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Žádosti o výplatu</CardTitle>
                  <CardDescription>
                    Správa výplat provizí affiliate partnerům
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    Funkce připravena - zobrazení žádostí o výplatu se schvalováním
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Správa uživatelů
                  </CardTitle>
                  <CardDescription>
                    Přehled uživatelů a jejich předplatných
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    Funkce připravena - zobrazení seznamu uživatelů s filtry
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <AlertDialog open={showModuleSuggestions} onOpenChange={setShowModuleSuggestions}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-accent" />
              API klíč úspěšně přidán!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              Skvělé! Nyní můžete využít{" "}
              <span className="font-semibold">
                {AI_PROVIDERS.find(p => p.id === currentProvider)?.name}
              </span>{" "}
              v následujících modulech:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid gap-3 my-4">
            {currentProvider && PROVIDER_MODULES[currentProvider as keyof typeof PROVIDER_MODULES]?.map((module, idx) => (
              <Card 
                key={idx}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  router.push(module.path);
                  setShowModuleSuggestions(false);
                }}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="text-3xl">{module.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{module.name}</h4>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </div>
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Zavřít</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (currentProvider && PROVIDER_MODULES[currentProvider as keyof typeof PROVIDER_MODULES]) {
                  const firstModule = PROVIDER_MODULES[currentProvider as keyof typeof PROVIDER_MODULES][0];
                  router.push(firstModule.path);
                }
                setShowModuleSuggestions(false);
              }}
            >
              Vyzkoušet hned
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog pro zobrazení dostupných modelů */}
      <Dialog open={showModelsDialog} onOpenChange={setShowModelsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dostupné modely pro {currentProvider}</DialogTitle>
            <DialogDescription>
              Tyto modely jsou dostupné s vašim API klíčem. Použijte je při vytváření konverzací.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            {availableModels.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {availableModels.map((model, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50"
                  >
                    <Badge variant="outline" className="font-mono text-xs">
                      {model}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Žádné modely nenalezeny
              </p>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowModelsDialog(false)}>
              Zavřít
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Deleting User */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      </AlertDialog>
    </AdminGuard>
  );
}