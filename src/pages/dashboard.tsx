import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Brain, MessageSquare, ImageIcon, Play, Mic, TrendingUp, LogOut, Activity, Sparkles, Clock, Settings, Share2, User, Coins, Video, Music, Zap, Bot, DollarSign, FileText, Megaphone, Edit3, Star, Crown, ArrowUpCircle
} from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { creditsService } from "@/services/creditsService";
import { conversationsService } from "@/services/conversationsService";
import { imageGenerationService } from "@/services/imageGenerationService";
import { videoGenerationService } from "@/services/videoGenerationService";
import { voiceService } from "@/services/voiceService";
import { adminService } from "@/services/adminService";
import { subscriptionService, type SubscriptionWithPlan, type SubscriptionPlan } from "@/services/subscriptionService";
import { supabase } from "@/integrations/supabase/client";
import { apiKeysService, type AIProvider } from "@/services/apiKeysService";
import { CreditPurchaseDialog } from "@/components/CreditPurchaseDialog";
import { useToast } from "@/hooks/use-toast";
import { UserMenu } from "@/components/UserMenu";

export default function Dashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionWithPlan | null>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [upgradingPlan, setUpgradingPlan] = useState(false);
  const [stats, setStats] = useState({
    conversations: 0,
    images: 0,
    videos: 0,
    voiceChats: 0,
  });
  const [recentActivities, setRecentActivities] = useState<Array<{
    type: string;
    title: string;
    time: string;
  }>>([]);

  const loadCredits = async () => {
    try {
      const userCredits = await creditsService.getCredits();
      setCredits(userCredits);
    } catch (error) {
      console.error("Error loading credits:", error);
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

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [userCredits, adminStatus] = await Promise.all([
        creditsService.getCredits(),
        adminService.isAdmin(),
      ]);
      
      setCredits(userCredits);
      setIsAdmin(adminStatus);

      await loadSubscription();

      const [conversations, images, videos, voiceChats] = await Promise.all([
        conversationsService.getConversations(),
        imageGenerationService.getGeneratedImages(),
        videoGenerationService.getGeneratedVideos(),
        voiceService.getVoiceConversations(),
      ]);

      setStats({
        conversations: conversations.length,
        images: images.length,
        videos: videos.length,
        voiceChats: voiceChats.length,
      });

      const activities = [
        ...conversations.slice(0, 2).map(c => ({
          type: "chat",
          title: c.title,
          time: new Date(c.created_at).toLocaleDateString("cs-CZ"),
        })),
        ...images.slice(0, 2).map(i => ({
          type: "image",
          title: i.prompt.slice(0, 50) + "...",
          time: new Date(i.created_at).toLocaleDateString("cs-CZ"),
        })),
        ...videos.slice(0, 1).map(v => ({
          type: "video",
          title: v.prompt.slice(0, 50) + "...",
          time: new Date(v.created_at).toLocaleDateString("cs-CZ"),
        })),
      ].slice(0, 5);

      setRecentActivities(activities);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
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
      setShowPlanDialog(false);
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

  const modules = [
    {
      id: "chat",
      title: "AI Chat",
      description: "Konverzace s AI modely",
      icon: MessageSquare,
      color: "primary",
      path: "/chat",
      count: stats.conversations,
      cost: "1 kredit/zpráva",
    },
    {
      id: "images",
      title: "Generování obrázků",
      description: "AI kreativita v obraze",
      icon: ImageIcon,
      color: "accent",
      path: "/generate",
      count: stats.images,
      cost: "2 kredity/obrázek",
    },
    {
      id: "videos",
      title: "Generování videí",
      description: "AI video tvorba",
      icon: Video,
      color: "secondary",
      path: "/video-generate",
      count: stats.videos,
      cost: "5 kreditů/video",
    },
    {
      id: "voice",
      title: "Hlasový chat",
      description: "Mluvte s AI",
      icon: Mic,
      color: "primary",
      path: "/voice-chat",
      count: stats.voiceChats,
      cost: "3 kredity/zpráva",
    },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-lg font-heading font-bold">kAIkus Dashboard</h1>
              </div>
              <div className="flex items-center gap-2">
                <ThemeSwitch />
                <UserMenu credits={credits} />
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-heading font-bold mb-2">Vítejte zpět!</h2>
              <p className="text-muted-foreground">
                Prozkoumejte sílu AI napříč různými moduly platformy kAIkus
              </p>
            </div>

            {/* Subscription Plan Card */}
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5"
              onClick={() => setShowPlanDialog(true)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Crown className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-heading">
                        Váš plán: {subscriptionService.getPlanDisplayName(currentTier)}
                      </CardTitle>
                      <CardDescription>
                        {currentPlan?.credits_included || 0} kreditů/{currentPlan?.billing_period === "monthly" ? "měsíc" : "rok"}
                        {subscription?.expires_at && (
                          <> · Vyprší {new Date(subscription.expires_at).toLocaleDateString("cs-CZ")}</>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={subscriptionService.getPlanBadgeColor(currentTier)}>
                    {subscriptionService.getPlanDisplayName(currentTier)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline">
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  Změnit plán
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <Card 
                    key={module.id}
                    className="relative overflow-hidden group hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => router.push(module.path)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className={`p-3 bg-${module.color}/10 rounded-xl`}>
                          <Icon className={`h-6 w-6 text-${module.color}`} />
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {module.count}
                        </Badge>
                      </div>
                      <CardTitle className="font-heading text-lg">{module.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {module.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{module.cost}</span>
                        <Sparkles className="h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Statistiky využití
                  </CardTitle>
                  <CardDescription>
                    Přehled vaší aktivity na platformě
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        <span className="font-medium">Konverzace</span>
                      </div>
                      <Badge variant="outline">{stats.conversations}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <ImageIcon className="h-5 w-5 text-accent" />
                        <span className="font-medium">Obrázky</span>
                      </div>
                      <Badge variant="outline">{stats.images}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Video className="h-5 w-5 text-secondary" />
                        <span className="font-medium">Videa</span>
                      </div>
                      <Badge variant="outline">{stats.videos}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mic className="h-5 w-5 text-primary" />
                        <span className="font-medium">Hlasové zprávy</span>
                      </div>
                      <Badge variant="outline">{stats.voiceChats}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Clock className="h-5 w-5 text-accent" />
                    Poslední aktivity
                  </CardTitle>
                  <CardDescription>
                    Vaše nedávné činnosti
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Zatím žádné aktivity</p>
                      <p className="text-xs mt-1">Začněte používat některý z modulů</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentActivities.map((activity, index) => (
                        <div 
                          key={index}
                          className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="p-2 bg-background rounded">
                            {activity.type === "chat" && <MessageSquare className="h-4 w-4 text-primary" />}
                            {activity.type === "image" && <ImageIcon className="h-4 w-4 text-accent" />}
                            {activity.type === "video" && <Video className="h-4 w-4 text-secondary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {activity.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activity.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Rychlý start
                </CardTitle>
                <CardDescription>
                  Vyberte modul a začněte tvořit s AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-4">
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => router.push("/chat")}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Nový chat
                  </Button>
                  <Button 
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push("/generate")}
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Vytvořit obrázek
                  </Button>
                  <Button 
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push("/video-generate")}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Vytvořit video
                  </Button>
                  <Button 
                    variant="outline"
                    className="justify-start"
                    onClick={() => router.push("/voice-chat")}
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Hlasový chat
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5"
              onClick={() => router.push("/voice-chat")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Mic className="h-8 w-8 text-primary" />
                  </div>
                  <Badge variant="secondary">
                    {stats.voiceChats} zpráv
                  </Badge>
                </div>
                <CardTitle className="font-heading">Hlasový chat</CardTitle>
                <CardDescription>OpenAI, ElevenLabs, Google</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Mic className="h-4 w-4 mr-2" />
                  Mluvit s AI
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-secondary/20 bg-gradient-to-br from-secondary/5 to-accent/5"
              onClick={() => router.push("/social-posts")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-secondary/10 rounded-xl">
                    <Share2 className="h-8 w-8 text-secondary" />
                  </div>
                  <Badge variant="secondary">
                    Nové
                  </Badge>
                </div>
                <CardTitle className="font-heading">Social Media</CardTitle>
                <CardDescription>Generování a plánování příspěvků</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Vytvořit příspěvek
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5"
              onClick={() => router.push("/document-summary")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <Badge variant="secondary" className="bg-primary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Nové
                  </Badge>
                </div>
                <CardTitle className="font-heading">Shrnutí dokumentů</CardTitle>
                <CardDescription>AI shrnutí textů a dokumentů</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  Shrnout text
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5"
              onClick={() => router.push("/ad-generator")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-accent/10 rounded-xl">
                    <Megaphone className="h-8 w-8 text-accent" />
                  </div>
                  <Badge variant="secondary" className="bg-accent">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Nové
                  </Badge>
                </div>
                <CardTitle className="font-heading">Generátor reklam</CardTitle>
                <CardDescription>Kompletní reklamní kampaně</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Megaphone className="h-4 w-4 mr-2" />
                  Vytvořit reklamu
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-secondary/20 bg-gradient-to-br from-secondary/5 to-accent/5"
              onClick={() => router.push("/image-editor")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-secondary/10 rounded-xl">
                    <Edit3 className="h-8 w-8 text-secondary" />
                  </div>
                  <Badge variant="secondary" className="bg-secondary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Nové
                  </Badge>
                </div>
                <CardTitle className="font-heading">Editor obrázků</CardTitle>
                <CardDescription>AI editace a úpravy obrázků</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Otevřít editor
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5"
              onClick={() => router.push("/favorite-prompts")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Star className="h-8 w-8 text-primary fill-primary" />
                  </div>
                  <Badge variant="secondary" className="bg-primary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Nové
                  </Badge>
                </div>
                <CardTitle className="font-heading">Oblíbené prompty</CardTitle>
                <CardDescription>Ukládejte a opakujte úspěšné AI prompty</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Star className="h-4 w-4 mr-2" />
                  Správa promptů
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5"
              onClick={() => router.push("/ai-influencer")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <Badge variant="secondary" className="bg-accent">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Nové
                  </Badge>
                </div>
                <CardTitle className="font-heading">AI Influencer</CardTitle>
                <CardDescription>Videa s virtuální postavou</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <User className="h-4 w-4 mr-2" />
                  Vytvořit influencera
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5"
              onClick={() => router.push("/music-generate")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-accent/10 rounded-xl">
                    <Music className="h-8 w-8 text-accent" />
                  </div>
                  <Badge variant="secondary" className="bg-accent">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Nové
                  </Badge>
                </div>
                <CardTitle className="font-heading">Music Generator</CardTitle>
                <CardDescription>AI hudba a skladby</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Music className="h-4 w-4 mr-2" />
                  Vytvořit skladbu
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-destructive/20 bg-gradient-to-br from-destructive/5 to-primary/5"
              onClick={() => router.push("/viral-videos")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-destructive/10 rounded-xl">
                    <Zap className="h-8 w-8 text-destructive" />
                  </div>
                  <Badge variant="secondary" className="bg-destructive text-destructive-foreground">
                    <Sparkles className="h-3 w-3 mr-1" />
                    HOT
                  </Badge>
                </div>
                <CardTitle className="font-heading">Viral Videos</CardTitle>
                <CardDescription>Videa pro sociální sítě</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  Vytvořit viral
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5"
              onClick={() => router.push("/assistants")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <Badge variant="secondary" className="bg-primary">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Nové
                  </Badge>
                </div>
                <CardTitle className="font-heading">AI Asistenti</CardTitle>
                <CardDescription>Vlastní specializovaní AI</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Bot className="h-4 w-4 mr-2" />
                  Vytvořit asistenta
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5"
              onClick={() => router.push("/affiliate")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-accent/10 rounded-xl">
                    <DollarSign className="h-8 w-8 text-accent" />
                  </div>
                  <Badge variant="secondary" className="bg-accent">
                    20%
                  </Badge>
                </div>
                <CardTitle className="font-heading">Affiliate Program</CardTitle>
                <CardDescription>Vydělávejte provize</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Získat link
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <CreditPurchaseDialog
        open={showCreditDialog}
        onOpenChange={setShowCreditDialog}
        onSuccess={loadCredits}
      />
    </AuthGuard>
  );
}