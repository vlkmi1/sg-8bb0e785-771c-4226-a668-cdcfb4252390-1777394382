import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Key,
  MessageSquare,
  Image as ImageIcon,
  DollarSign,
  Settings,
  Activity,
  Database,
  Shield,
  RefreshCw,
  Plus,
  X,
  LogOut,
  CheckCircle2,
  XCircle,
  Calendar,
  TestTube2,
  Edit,
  ExternalLink,
  Crown,
  Coins,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { toast, useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { adminService } from "@/services/adminService";
import { UsersManagement } from "@/components/admin/UsersManagement";
import { CreditAnalytics } from "@/components/admin/CreditAnalytics";
import { SystemLogs } from "@/components/admin/SystemLogs";
import { PaymentApprovals } from "@/components/admin/PaymentApprovals";
import { AdminGuard } from "@/components/AdminGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";

interface AdminSetting {
  provider?: string;
  api_key?: string;
  balance?: number;
  balance_updated_at?: string;
  last_used_at?: string;
}

interface APIUsageStats {
  provider: string;
  total_requests: number;
  requests_today: number;
  total_cost: number;
}

const AI_PROVIDERS = [
  { id: "openai", name: "OpenAI", icon: "🤖", description: "GPT-4, GPT-3.5 Turbo", url: "https://platform.openai.com/api-keys", supportsBalance: true },
  { id: "anthropic", name: "Anthropic", icon: "🧠", description: "Claude 3 Opus, Sonnet, Haiku", url: "https://console.anthropic.com/settings/keys", supportsBalance: false },
  { id: "google", name: "Google AI", icon: "🔮", description: "Gemini Pro, Gemini Ultra", url: "https://makersuite.google.com/app/apikey", supportsBalance: false },
  { id: "mistral", name: "Mistral AI", icon: "⚡", description: "Mistral Large, Medium, Small", url: "https://console.mistral.ai/api-keys", supportsBalance: false },
  { id: "cohere", name: "Cohere", icon: "🌟", description: "Command, Generate, Embed", url: "https://dashboard.cohere.com/api-keys", supportsBalance: false },
  { id: "xai", name: "X AI", icon: "𝕏", description: "Grok, Grok-2", url: "https://console.x.ai", supportsBalance: false },
  { id: "stability", name: "Stability AI", icon: "🎨", description: "Stable Diffusion, Image Generation", url: "https://platform.stability.ai/account/keys", supportsBalance: true },
  { id: "midjourney", name: "Midjourney", icon: "✨", description: "AI Art Generation", url: "https://www.midjourney.com/account", supportsBalance: false },
  { id: "fal", name: "Fal AI", icon: "🎯", description: "Fast Image & Video Generation", url: "https://fal.ai/dashboard/keys", supportsBalance: false },
  { id: "runwayml", name: "RunwayML", icon: "🎬", description: "Gen-2 Video Generation", url: "https://app.runwayml.com/settings", supportsBalance: false },
  { id: "suno", name: "Suno AI", icon: "🎵", description: "AI Music Generation", url: "https://suno.ai/account", supportsBalance: false },
  { id: "musicgen", name: "MusicGen", icon: "🎼", description: "Meta's Music Generation", url: "https://replicate.com/meta/musicgen", supportsBalance: false },
  { id: "mubert", name: "Mubert", icon: "🎧", description: "Royalty-Free Music Generation", url: "https://mubert.com/render/api", supportsBalance: false },
  { id: "aiva", name: "AIVA", icon: "🎹", description: "AI Music Composition", url: "https://www.aiva.ai/", supportsBalance: false },
  { id: "soundraw", name: "Soundraw", icon: "🎶", description: "AI Music Creator", url: "https://soundraw.io/", supportsBalance: false },
];

export default function Admin() {
  const router = useRouter();
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [usageStats, setUsageStats] = useState<APIUsageStats[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [packageDialogOpen, setPackageDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [checkingBalance, setCheckingBalance] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string } | null>>({});
  const [apiKeysTab, setApiKeysTab] = useState<"active" | "inactive">("active");
  const [paymentSettings, setPaymentSettings] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      console.log("Loading admin data...");
      const [settingsData, statsData, plansData, packagesData, paymentSettingsData] = await Promise.all([
        adminService.getAdminSettings(),
        adminService.getAPIUsageStats(),
        loadPlans(),
        loadPackages(),
        adminService.getPaymentSettings(),
      ]);
      console.log("Admin data loaded:", {
        settingsCount: settingsData.length,
        statsCount: statsData.length,
        plansCount: plansData.length,
        packagesCount: packagesData.length,
        paymentSettings: Object.keys(paymentSettingsData).length
      });
      setSettings(settingsData);
      setUsageStats(statsData);
      setPlans(plansData);
      setPackages(packagesData);
      setPaymentSettings(paymentSettingsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Chyba při načítání dat",
        description: error instanceof Error ? error.message : "Nepodařilo se načíst data",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadPlans = async () => {
    console.log("Loading subscription plans...");
    const { data, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .order("price", { ascending: true });
    if (error) {
      console.error("Error loading plans:", error);
      throw error;
    }
    console.log("Plans loaded:", data?.length || 0, data);
    return data || [];
  };

  const loadPackages = async () => {
    console.log("Loading credit packages...");
    const { data, error } = await supabase
      .from("credit_packages")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) {
      console.error("Error loading packages:", error);
      throw error;
    }
    console.log("Packages loaded:", data?.length || 0, data);
    return data || [];
  };

  const handleSaveApiKey = async (providerId?: string) => {
    const provider = providerId || selectedProvider;
    
    if (!provider || !apiKey.trim()) {
      toast({
        title: "Chyba",
        description: "Vyberte poskytovatele a zadejte API klíč",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await adminService.saveAdminSetting(provider, apiKey.trim());
      toast({
        title: "Úspěch",
        description: "API klíč byl uložen",
      });
      
      setSelectedProvider("");
      setApiKey("");
      setDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error("Error saving API key:", error);
      toast({
        title: "Chyba při ukládání API klíče",
        description: error?.message || "Nepodařilo se uložit API klíč",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckBalance = async (providerId: string) => {
    const setting = settings.find(s => s.provider === providerId);
    if (!setting?.api_key) return;

    setCheckingBalance(providerId);
    try {
      const result = await adminService.checkAPIBalance(providerId, setting.api_key);
      
      if (result.success) {
        toast({
          title: "Balance načten",
          description: result.balance !== null 
            ? `Zůstatek: ${result.balance} ${result.currency || ""}`
            : result.message,
        });
        loadData();
      } else {
        toast({
          title: "Chyba",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst zůstatek",
        variant: "destructive",
      });
    } finally {
      setCheckingBalance(null);
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

  const handleSavePaymentSettings = async () => {
    setLoading(true);
    try {
      await adminService.updatePaymentSettings(paymentSettings);
      toast({
        title: "Úspěch",
        description: "Nastavení plateb bylo uloženo",
      });
    } catch (error) {
      console.error("Error saving payment settings:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit nastavení plateb",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getProviderStats = (providerId: string) => {
    return usageStats.find(s => s.provider === providerId);
  };

  const activeProviders = AI_PROVIDERS.filter(p => settings.some(s => s.provider === p.id));
  const inactiveProviders = AI_PROVIDERS.filter(p => !settings.some(s => s.provider === p.id));

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
            <TabsList className="grid w-full max-w-5xl mx-auto grid-cols-8">
              <TabsTrigger value="analytics">Analytika</TabsTrigger>
              <TabsTrigger value="api-keys">API klíče</TabsTrigger>
              <TabsTrigger value="subscriptions">Předplatná</TabsTrigger>
              <TabsTrigger value="packages">Balíčky</TabsTrigger>
              <TabsTrigger value="payments">Platby</TabsTrigger>
              <TabsTrigger value="affiliate">Affiliate</TabsTrigger>
              <TabsTrigger value="users">Uživatelé</TabsTrigger>
              <TabsTrigger value="logs">Logy</TabsTrigger>
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
                  <Tabs value={apiKeysTab} onValueChange={(v) => setApiKeysTab(v as "active" | "inactive")}>
                    <TabsList className="grid w-full max-w-md grid-cols-2">
                      <TabsTrigger value="active">
                        Aktivní ({activeProviders.length})
                      </TabsTrigger>
                      <TabsTrigger value="inactive">
                        Neaktivní ({inactiveProviders.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="mt-6">
                      {activeProviders.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Key className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Zatím nemáte nastavené žádné API klíče</p>
                        </div>
                      ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {activeProviders.map((provider) => {
                            const setting = settings.find(s => s.provider === provider.id);
                            const stats = getProviderStats(provider.id);
                            const testResult = testResults[provider.id];
                            
                            return (
                              <Card key={provider.id} className="relative">
                                <CardHeader>
                                  <div className="flex items-start justify-between">
                                    <div className="text-3xl mb-2">{provider.icon}</div>
                                    <div className="flex flex-col gap-1 items-end">
                                      <Badge variant="default" className="bg-accent">Aktivní</Badge>
                                      {testResult && (
                                        <Badge variant={testResult.success ? "default" : "destructive"} className="text-xs">
                                          {testResult.success ? (
                                            <><CheckCircle2 className="h-3 w-3 mr-1" />OK</>
                                          ) : (
                                            <><XCircle className="h-3 w-3 mr-1" />Chyba</>
                                          )}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <CardTitle className="text-base">{provider.name}</CardTitle>
                                  <CardDescription className="text-xs">{provider.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  {setting?.balance !== null && setting?.balance !== undefined && (
                                    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                                      <DollarSign className="h-4 w-4 text-accent" />
                                      <div className="flex-1">
                                        <p className="text-xs text-muted-foreground">Zůstatek</p>
                                        <p className="font-semibold">{setting.balance} USD</p>
                                      </div>
                                      {setting.balance_updated_at && (
                                        <span className="text-xs text-muted-foreground">
                                          {new Date(setting.balance_updated_at).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {stats && (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Požadavky celkem</span>
                                        <span className="font-semibold">{stats.total_requests}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Dnes</span>
                                        <span className="font-semibold">{stats.requests_today}</span>
                                      </div>
                                      {stats.total_cost > 0 && (
                                        <div className="flex items-center justify-between text-sm">
                                          <span className="text-muted-foreground">Náklady (odhad)</span>
                                          <span className="font-semibold">${stats.total_cost.toFixed(2)}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {setting?.last_used_at && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      Naposledy použito: {new Date(setting.last_used_at).toLocaleString("cs-CZ")}
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleTestApiKey(provider.id)}
                                      disabled={testingProvider === provider.id}
                                    >
                                      <TestTube2 className="h-4 w-4 mr-1" />
                                      {testingProvider === provider.id ? "Test..." : "Test"}
                                    </Button>

                                    {provider.supportsBalance && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCheckBalance(provider.id)}
                                        disabled={checkingBalance === provider.id}
                                      >
                                        <Activity className="h-4 w-4 mr-1" />
                                        {checkingBalance === provider.id ? "..." : "Balance"}
                                      </Button>
                                    )}
                                  </div>

                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" className="w-full" size="sm">
                                        <Edit className="h-4 w-4 mr-2" />
                                        Změnit klíč
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>{provider.name} API klíč</DialogTitle>
                                        <DialogDescription>
                                          Aktualizovat API klíč pro {provider.name}
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="apiKey">Nový API klíč</Label>
                                          <Input
                                            id="apiKey"
                                            type="password"
                                            placeholder="sk-..."
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                          />
                                        </div>
                                        <Button 
                                          onClick={() => {
                                            setSelectedProvider(provider.id);
                                            handleSaveApiKey();
                                          }} 
                                          className="w-full" 
                                          disabled={loading}
                                        >
                                          {loading ? "Ukládání..." : "Uložit"}
                                        </Button>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="inactive" className="mt-6">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {inactiveProviders.map((provider) => (
                          <Card key={provider.id} className="opacity-60">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="text-3xl mb-2">{provider.icon}</div>
                                <Badge variant="secondary">Nenastaveno</Badge>
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
                              
                              <Button 
                                variant="default" 
                                className="w-full" 
                                size="sm"
                                onClick={() => {
                                  setSelectedProvider(provider.id);
                                  setDialogOpen(true);
                                }}
                              >
                                <Key className="h-4 w-4 mr-2" />
                                Přidat klíč
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
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
                            Formulář pro vytváření nových plánů - připraveno k implementaci
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {plans.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Crown className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Žádné subscription plány nenalezeny</p>
                      <p className="text-sm mt-2">Načítání dat z databáze...</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Plán</TableHead>
                          <TableHead>Cena</TableHead>
                          <TableHead>Kredity</TableHead>
                          <TableHead>Období</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Akce</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plans.map((plan) => (
                          <TableRow key={plan.id}>
                            <TableCell className="font-medium">{plan.name}</TableCell>
                            <TableCell>{plan.price.toLocaleString('cs-CZ')} {plan.currency}</TableCell>
                            <TableCell>{plan.credits_included === 999999 ? "∞" : plan.credits_included.toLocaleString('cs-CZ')}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {plan.billing_period === "monthly" ? "Měsíční" : "Roční"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={plan.is_active ? "default" : "secondary"}>
                                {plan.is_active ? "Aktivní" : "Neaktivní"}
                              </Badge>
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
                  )}
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
                            Formulář pro vytváření nových balíčků - připraveno k implementaci
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {packages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Coins className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Žádné balíčky kreditů nenalezeny</p>
                      <p className="text-sm mt-2">Načítání dat z databáze...</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Název</TableHead>
                          <TableHead>Kredity</TableHead>
                          <TableHead>Bonus</TableHead>
                          <TableHead>Cena</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Akce</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {packages.map((pkg) => (
                          <TableRow key={pkg.id}>
                            <TableCell className="font-medium">{pkg.name}</TableCell>
                            <TableCell>{pkg.credits.toLocaleString('cs-CZ')}</TableCell>
                            <TableCell>
                              {pkg.bonus_credits > 0 ? (
                                <Badge variant="secondary" className="bg-accent/10">
                                  +{pkg.bonus_credits.toLocaleString('cs-CZ')}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>{pkg.price.toLocaleString('cs-CZ')} {pkg.currency}</TableCell>
                            <TableCell>
                              <Badge variant={pkg.is_active ? "default" : "secondary"}>
                                {pkg.is_active ? "Aktivní" : "Neaktivní"}
                              </Badge>
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
                  )}
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
                        value={paymentSettings["paypal_client_id"] || ""}
                        onChange={(e) => setPaymentSettings(prev => ({
                          ...prev,
                          paypal_client_id: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="paypal-secret">PayPal Secret</Label>
                      <Input
                        id="paypal-secret"
                        type="password"
                        placeholder="EXX..."
                        value={paymentSettings["paypal_secret"] || ""}
                        onChange={(e) => setPaymentSettings(prev => ({
                          ...prev,
                          paypal_secret: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bank-account">Číslo účtu pro QR kódy</Label>
                      <Input
                        id="bank-account"
                        placeholder="123456789/0100"
                        value={paymentSettings["bank_account_number"] || ""}
                        onChange={(e) => setPaymentSettings(prev => ({
                          ...prev,
                          bank_account_number: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stripe-key">Stripe Publishable Key</Label>
                      <Input
                        id="stripe-key"
                        placeholder="pk_live_..."
                        value={paymentSettings["stripe_publishable_key"] || ""}
                        onChange={(e) => setPaymentSettings(prev => ({
                          ...prev,
                          stripe_publishable_key: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stripe-secret">Stripe Secret Key</Label>
                      <Input
                        id="stripe-secret"
                        type="password"
                        placeholder="sk_live_..."
                        value={paymentSettings["stripe_secret_key"] || ""}
                        onChange={(e) => setPaymentSettings(prev => ({
                          ...prev,
                          stripe_secret_key: e.target.value
                        }))}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleSavePaymentSettings}
                      disabled={loading}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {loading ? "Ukládání..." : "Uložit nastavení plateb"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <PaymentApprovals />
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
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-heading flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Správa uživatelů
                      </CardTitle>
                      <CardDescription>
                        Přehled všech uživatelů a jejich aktivit
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <UsersManagement />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs" className="space-y-6">
              <SystemLogs />
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">
              {AI_PROVIDERS.find(p => p.id === selectedProvider)?.name} API klíč
            </DialogTitle>
            <DialogDescription>
              Zadejte API klíč od poskytovatele {AI_PROVIDERS.find(p => p.id === selectedProvider)?.name}
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
              onClick={() => handleSaveApiKey(selectedProvider)} 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Ukládání..." : "Uložit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminGuard>
  );
}