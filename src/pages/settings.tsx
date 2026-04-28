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
import { Settings as SettingsIcon, Key, LogOut, User, Bell, CheckCircle2, XCircle, Share2, Trash2, Plus, Crown, ArrowUpCircle } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { apiKeysService, type AIProvider } from "@/services/apiKeysService";
import { socialPostsService, type SocialAccount, type SocialPlatform } from "@/services/socialPostsService";
import { subscriptionService, type SubscriptionWithPlan, type SubscriptionPlan } from "@/services/subscriptionService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AI_PROVIDERS = [
  { id: "openai", name: "OpenAI", icon: "🤖", description: "GPT-4, GPT-3.5 Turbo" },
  { id: "anthropic", name: "Anthropic", icon: "🧠", description: "Claude 3 Opus, Sonnet, Haiku" },
  { id: "google", name: "Google AI", icon: "🔮", description: "Gemini Pro, Gemini Ultra" },
  { id: "mistral", name: "Mistral AI", icon: "⚡", description: "Mistral Large, Medium, Small" },
  { id: "cohere", name: "Cohere", icon: "🌟", description: "Command, Generate, Embed" },
  { id: "nano-bannana", name: "Nano Bannana", icon: "🍌", description: "Fast AI Model for Quick Tasks" },
  { id: "nano-bannana-pro", name: "Nano Bannana PRO", icon: "🍌✨", description: "Advanced Nano Bannana Model" },
];

const SOCIAL_PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: "📘", description: "Sdílení příspěvků na Facebook" },
  { id: "instagram", name: "Instagram", icon: "📷", description: "Fotky a Stories" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", description: "Profesionální síť" },
  { id: "twitter", name: "Twitter/X", icon: "𝕏", description: "Krátké zprávy a tweety" },
  { id: "youtube", name: "YouTube", icon: "📹", description: "Video obsah a komunita" },
  { id: "tiktok", name: "TikTok", icon: "🎵", description: "Krátká videa a trendy" },
];

export default function Settings() {
  const router = useRouter();
  const { toast } = useToast();
  const [connectedProviders, setConnectedProviders] = useState<Set<string>>(new Set());
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [socialDialogOpen, setSocialDialogOpen] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>("openai");
  const [selectedSocialPlatform, setSelectedSocialPlatform] = useState<SocialPlatform>("facebook");
  const [apiKey, setApiKey] = useState("");
  const [accountName, setAccountName] = useState("");
  const [loading, setLoading] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState(false);

  useEffect(() => {
    loadConnectedProviders();
    loadSocialAccounts();
    loadSubscription();
  }, []);

  const loadConnectedProviders = async () => {
    try {
      const keys = await apiKeysService.getApiKeys();
      const connected = new Set(keys.map((k: any) => k.provider));
      setConnectedProviders(connected);
    } catch (error) {
      console.error("Error loading API keys:", error);
    }
  };

  const loadSocialAccounts = async () => {
    try {
      const accounts = await socialPostsService.getAccounts();
      setSocialAccounts(accounts);
    } catch (error) {
      console.error("Error loading social accounts:", error);
    }
  };

  const loadSubscription = async () => {
    try {
      const [currentSub, plans] = await Promise.all([
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getAllPlans(),
      ]);
      setSubscription(currentSub);
      setAvailablePlans(plans);
    } catch (error) {
      console.error("Error loading subscription:", error);
    }
  };

  const handleSaveApiKey = async (e: FormEvent) => {
    e.preventDefault();
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

  const handleConnectSocial = async (e: FormEvent) => {
    e.preventDefault();
    if (!accountName.trim()) return;

    setLoading(true);
    try {
      await socialPostsService.createAccount({
        platform: selectedSocialPlatform,
        account_name: accountName,
      });
      await loadSocialAccounts();
      setSocialDialogOpen(false);
      setAccountName("");
    } catch (error) {
      console.error("Error connecting social account:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnectSocial = async (id: string) => {
    if (!confirm("Opravdu chcete odpojit tento účet?")) return;

    try {
      await socialPostsService.deleteAccount(id);
      await loadSocialAccounts();
    } catch (error) {
      console.error("Error disconnecting account:", error);
    }
  };

  const handleUpgradePlan = async (planId: string) => {
    setUpgradingPlan(true);
    try {
      await subscriptionService.upgradeSubscription(planId);
      toast({
        title: "Plán změněn",
        description: "Váš plán byl úspěšně aktualizován",
      });
      await loadSubscription();
      setPlanDialogOpen(false);
    } catch (error) {
      console.error("Error upgrading plan:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se změnit plán",
        variant: "destructive",
      });
    } finally {
      setUpgradingPlan(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const currentPlan = subscription?.plan;
  const currentTier = (currentPlan?.tier || "free") as string;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <SettingsIcon className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-lg font-heading font-bold">Nastavení</h1>
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
          <Tabs defaultValue="subscription" className="space-y-6">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5">
              <TabsTrigger value="subscription">Předplatné</TabsTrigger>
              <TabsTrigger value="api">API klíče</TabsTrigger>
              <TabsTrigger value="social">Sociální sítě</TabsTrigger>
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="preferences">Předvolby</TabsTrigger>
            </TabsList>

            <TabsContent value="subscription" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    Váš plán
                  </CardTitle>
                  <CardDescription>
                    Spravujte své předplatné a vyberte plán podle potřeb
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Card className="bg-muted/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {subscriptionService.getPlanDisplayName(currentTier)}
                          </CardTitle>
                          <CardDescription>
                            {currentPlan?.credits_included || 0} kreditů/{currentPlan?.billing_period === "monthly" ? "měsíc" : "rok"}
                          </CardDescription>
                        </div>
                        <Badge className={subscriptionService.getPlanBadgeColor(currentTier)}>
                          {subscriptionService.getPlanDisplayName(currentTier)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {subscription?.expires_at && (
                        <p className="text-sm text-muted-foreground mb-4">
                          Vyprší: {new Date(subscription.expires_at).toLocaleDateString("cs-CZ")}
                        </p>
                      )}
                      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full">
                            <ArrowUpCircle className="h-4 w-4 mr-2" />
                            Změnit plán
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="font-heading text-2xl">Změnit předplatné</DialogTitle>
                            <DialogDescription>
                              Vyberte plán, který nejlépe vyhovuje vašim potřebám
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 py-4">
                            {availablePlans.map((plan) => {
                              const isCurrent = plan.id === subscription?.plan_id;
                              const features = Array.isArray(plan.features) ? plan.features : [];
                              
                              return (
                                <Card key={plan.id} className={isCurrent ? "border-primary" : ""}>
                                  <CardHeader>
                                    <div className="flex items-center justify-between mb-2">
                                      <Badge className={subscriptionService.getPlanBadgeColor(plan.tier)}>
                                        {subscriptionService.getPlanDisplayName(plan.tier)}
                                      </Badge>
                                      {isCurrent && (
                                        <Badge variant="outline" className="text-xs">
                                          Aktuální
                                        </Badge>
                                      )}
                                    </div>
                                    <CardTitle className="text-2xl font-heading">
                                      {plan.price > 0 ? `${plan.price} ${plan.currency}` : "Zdarma"}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                      {plan.billing_period === "monthly" ? "měsíčně" : "ročně"}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                      <p className="text-sm font-semibold">
                                        {plan.credits_included} kreditů/{plan.billing_period === "monthly" ? "měsíc" : "rok"}
                                      </p>
                                      <ul className="text-xs space-y-1 text-muted-foreground">
                                        {features.map((feature: any, idx: number) => (
                                          <li key={idx}>✓ {feature}</li>
                                        ))}
                                      </ul>
                                    </div>
                                    <Button
                                      className="w-full"
                                      variant={isCurrent ? "outline" : "default"}
                                      disabled={isCurrent || upgradingPlan}
                                      onClick={() => handleUpgradePlan(plan.id)}
                                    >
                                      {isCurrent ? "Aktuální plán" : upgradingPlan ? "Měním..." : "Vybrat plán"}
                                    </Button>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    Osobní API klíče
                  </CardTitle>
                  <CardDescription>
                    Spravujte své API klíče pro různé AI poskytovatele
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {AI_PROVIDERS.map((provider) => {
                      const isConnected = connectedProviders.has(provider.id);
                      return (
                        <Card key={provider.id}>
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
                            <CardTitle className="text-base">{provider.name}</CardTitle>
                            <CardDescription className="text-xs">{provider.description}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Dialog 
                              open={dialogOpen && selectedProvider === provider.id} 
                              onOpenChange={(open) => {
                                setDialogOpen(open);
                                if (open) setSelectedProvider(provider.id as AIProvider);
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant={isConnected ? "outline" : "default"} className="w-full">
                                  <Key className="h-4 w-4 mr-2" />
                                  {isConnected ? "Změnit klíč" : "Přidat klíč"}
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="font-heading">
                                    {provider.name} API klíč
                                  </DialogTitle>
                                  <DialogDescription>
                                    Zadejte svůj API klíč pro {provider.name}
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
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-sm">ℹ️ O bezpečnosti</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Vaše API klíče jsou bezpečně uloženy a šifrovány. Nikdy je nesdílíme s třetími stranami.
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-primary" />
                    Připojené sociální sítě
                  </CardTitle>
                  <CardDescription>
                    Spravujte své účty na sociálních sítích pro automatické publikování
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-end">
                    <Dialog open={socialDialogOpen} onOpenChange={setSocialDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Připojit účet
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="font-heading">
                            Připojit sociální účet
                          </DialogTitle>
                          <DialogDescription>
                            Vyberte platformu a zadejte název účtu
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleConnectSocial} className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="platform">Platforma</Label>
                            <select
                              id="platform"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={selectedSocialPlatform}
                              onChange={(e) => setSelectedSocialPlatform(e.target.value as SocialPlatform)}
                            >
                              {SOCIAL_PLATFORMS.map((platform) => (
                                <option key={platform.id} value={platform.id}>
                                  {platform.icon} {platform.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="accountName">Název účtu</Label>
                            <Input
                              id="accountName"
                              placeholder="@username nebo Název stránky"
                              value={accountName}
                              onChange={(e) => setAccountName(e.target.value)}
                              required
                            />
                          </div>
                          <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Připojování..." : "Připojit účet"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {socialAccounts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Zatím nemáte připojené žádné sociální sítě
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Platforma</TableHead>
                          <TableHead>Účet</TableHead>
                          <TableHead>Stav</TableHead>
                          <TableHead className="text-right">Akce</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {socialAccounts.map((account) => {
                          const platform = SOCIAL_PLATFORMS.find(p => p.id === account.platform);
                          return (
                            <TableRow key={account.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{platform?.icon}</span>
                                  <span>{platform?.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>{account.account_name}</TableCell>
                              <TableCell>
                                <Badge variant={account.is_active ? "default" : "secondary"}>
                                  {account.is_active ? "Aktivní" : "Neaktivní"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDisconnectSocial(account.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}

                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-sm">ℹ️ Poznámka</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Pro plné publikování na sociální sítě je potřeba OAuth autorizace. Aktuálně můžete připojit účty a vytvářet příspěvky, které následně publikujete manuálně.
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Profil
                  </CardTitle>
                  <CardDescription>
                    Spravujte své osobní údaje
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Správa profilu bude brzy k dispozici
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Předvolby
                  </CardTitle>
                  <CardDescription>
                    Přizpůsobte si aplikaci podle svých potřeb
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Nastavení předvoleb bude brzy k dispozici
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