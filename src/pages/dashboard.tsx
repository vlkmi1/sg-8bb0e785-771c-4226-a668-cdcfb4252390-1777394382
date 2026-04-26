import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, ImageIcon, Video, Mic, TrendingUp, 
  Sparkles, LogOut, Shield, Coins, Home, Clock, Settings
} from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { creditsService } from "@/services/creditsService";
import { conversationsService } from "@/services/conversationsService";
import { imageGenerationService } from "@/services/imageGenerationService";
import { videoGenerationService } from "@/services/videoGenerationService";
import { voiceService } from "@/services/voiceService";
import { adminService } from "@/services/adminService";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const router = useRouter();
  const [credits, setCredits] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

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
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-lg font-heading font-bold">Dashboard</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-lg border border-accent/20">
                  <Coins className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">{credits}</span>
                  <span className="text-xs text-muted-foreground">kreditů</span>
                </div>
                <ThemeSwitch />
                <Button variant="ghost" onClick={() => router.push("/settings")}>
                  <Settings className="h-5 w-5 mr-2" />
                  Nastavení
                </Button>
                <Button variant="ghost" onClick={() => router.push("/")}>
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
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-heading font-bold mb-2">Vítejte zpět!</h2>
              <p className="text-muted-foreground">
                Prozkoumejte sílu AI napříč různými moduly platformy kAIkus
              </p>
            </div>

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
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}