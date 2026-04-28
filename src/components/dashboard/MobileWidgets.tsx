import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, Image, Video, Music, Mic, Share2, 
  TrendingUp, Zap, Heart, FileText, Clock, CheckCircle2,
  AlertCircle, Loader2
} from "lucide-react";
import { creditsService } from "@/services/creditsService";
import { conversationsService } from "@/services/conversationsService";
import { useRouter } from "next/router";
import Link from "next/link";

interface CreditsData {
  balance: number;
  history: Array<{ amount: number; created_at: string }>;
}

interface Activity {
  id: string;
  type: string;
  model: string;
  created_at: string;
  status: string;
}

export function CreditsWidget() {
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const balance = await creditsService.getCredits();
      const history = await creditsService.getCreditTransactions();
      setCredits({
        balance,
        history: history.slice(0, 7)
      });
    } catch (error) {
      console.error("Failed to load credits:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const sparklineData = credits?.history || [];
  const maxAmount = Math.max(...sparklineData.map(h => Math.abs(h.amount)), 1);

  return (
    <Card className="w-full bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Kredity</span>
          <span className="text-2xl font-bold text-primary">{credits?.balance || 0}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between h-16 gap-1">
          {sparklineData.map((item, idx) => {
            const height = (Math.abs(item.amount) / maxAmount) * 100;
            const isPositive = item.amount > 0;
            return (
              <div
                key={idx}
                className={`flex-1 rounded-t transition-all ${
                  isPositive ? "bg-accent" : "bg-destructive/40"
                }`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
        <Link href="/credits">
          <Button className="w-full mt-4" size="sm">
            <Zap className="w-4 h-4 mr-2" />
            Nabít kredity
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export function QuickActionsWidget() {
  const router = useRouter();
  
  const actions = [
    { icon: MessageSquare, label: "Chat", href: "/chat", color: "text-primary" },
    { icon: Image, label: "Obrázky", href: "/generate", color: "text-accent" },
    { icon: Video, label: "Video", href: "/video-generate", color: "text-purple-500" },
    { icon: Music, label: "Hudba", href: "/music-generate", color: "text-pink-500" },
    { icon: Mic, label: "Hlas", href: "/voice-chat", color: "text-orange-500" },
    { icon: Share2, label: "Social", href: "/social-posts", color: "text-blue-500" }
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Rychlé akce</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => router.push(action.href)}
              className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors min-h-[88px] active:scale-95"
            >
              <action.icon className={`w-8 h-8 mb-2 ${action.color}`} />
              <span className="text-sm font-medium text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function RecentActivityWidget() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const convos = await conversationsService.getConversations();
      const mapped = convos.slice(0, 5).map(c => ({
        id: c.id,
        type: c.model_provider || "chat",
        model: c.model_name || "gpt-4",
        created_at: c.created_at,
        status: "completed"
      }));
      setActivities(mapped);
    } catch (error) {
      console.error("Failed to load activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "image": return Image;
      case "video": return Video;
      case "music": return Music;
      default: return MessageSquare;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-accent" />;
      case "failed": return <AlertCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Poslední aktivita</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Zatím žádná aktivita
            </p>
          ) : (
            activities.map((activity) => {
              const Icon = getIcon(activity.type);
              return (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{activity.model}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleTimeString("cs-CZ", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </p>
                    </div>
                  </div>
                  {getStatusIcon(activity.status)}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCardsWidget() {
  const [stats, setStats] = useState({
    modelsToday: 0,
    totalConversations: 0,
    favoritePrompts: 0,
    filesGenerated: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const convos = await conversationsService.getConversations();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const modelsToday = convos.filter(c => 
        new Date(c.created_at) >= today
      ).length;

      setStats({
        modelsToday,
        totalConversations: convos.length,
        favoritePrompts: 0,
        filesGenerated: 0
      });
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: "Modely dnes", value: stats.modelsToday, icon: TrendingUp, color: "text-primary" },
    { label: "Celkem konverzací", value: stats.totalConversations, icon: MessageSquare, color: "text-accent" },
    { label: "Oblíbené prompty", value: stats.favoritePrompts, icon: Heart, color: "text-pink-500" },
    { label: "Vygenerováno", value: stats.filesGenerated, icon: FileText, color: "text-purple-500" }
  ];

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {statCards.map((stat, idx) => (
        <Card key={idx} className="bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold mb-1">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}