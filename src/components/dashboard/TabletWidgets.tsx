import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, Image, Video, Music, Mic, Share2, 
  TrendingUp, Zap, Heart, FileText, CheckCircle2,
  AlertCircle, Clock, Loader2
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

export function TabletCreditsWidget() {
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
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const sparklineData = credits?.history || [];
  const maxAmount = Math.max(...sparklineData.map(h => Math.abs(h.amount)), 1);

  return (
    <Card className="h-full bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="text-xl">Kredity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Aktuální zůstatek</p>
            <p className="text-4xl font-bold text-primary mb-6">{credits?.balance || 0}</p>
            <Link href="/credits">
              <Button className="w-full" size="lg">
                <Zap className="w-5 h-5 mr-2" />
                Nabít kredity
              </Button>
            </Link>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Posledních 7 dní</p>
            <div className="flex items-end justify-between h-32 gap-2">
              {sparklineData.map((item, idx) => {
                const height = (Math.abs(item.amount) / maxAmount) * 100;
                const isPositive = item.amount > 0;
                return (
                  <div
                    key={idx}
                    className={`flex-1 rounded-t transition-all ${
                      isPositive ? "bg-accent" : "bg-destructive/40"
                    }`}
                    style={{ height: `${height}%`, minHeight: "8px" }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TabletQuickActionsWidget() {
  const router = useRouter();
  
  const actions = [
    { icon: MessageSquare, label: "AI Chat", href: "/chat", color: "text-primary" },
    { icon: Image, label: "Generování obrázků", href: "/generate", color: "text-accent" },
    { icon: Video, label: "Video generátor", href: "/video-generate", color: "text-purple-500" },
    { icon: Music, label: "Hudební AI", href: "/music-generate", color: "text-pink-500" },
    { icon: Mic, label: "Hlasový chat", href: "/voice-chat", color: "text-orange-500" },
    { icon: Share2, label: "Social posty", href: "/social-posts", color: "text-blue-500" }
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl">Rychlé akce</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => router.push(action.href)}
              className="flex flex-col items-center justify-center p-6 rounded-lg bg-muted hover:bg-muted/80 transition-all min-h-[120px] active:scale-95 hover:shadow-md"
            >
              <action.icon className={`w-10 h-10 mb-3 ${action.color}`} />
              <span className="text-sm font-medium text-center">{action.label}</span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TabletRecentActivityWidget() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const convos = await conversationsService.getConversations();
      const mapped = convos.slice(0, 8).map(c => ({
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": 
        return <span className="flex items-center text-xs text-accent"><CheckCircle2 className="w-3 h-3 mr-1" />Dokončeno</span>;
      case "failed": 
        return <span className="flex items-center text-xs text-destructive"><AlertCircle className="w-3 h-3 mr-1" />Chyba</span>;
      default: 
        return <span className="flex items-center text-xs text-muted-foreground"><Clock className="w-3 h-3 mr-1" />Probíhá</span>;
    }
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl">Poslední aktivita</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Zatím žádná aktivita
            </p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 text-sm font-medium">Typ</th>
                    <th className="text-left p-3 text-sm font-medium">Model</th>
                    <th className="text-left p-3 text-sm font-medium">Čas</th>
                    <th className="text-left p-3 text-sm font-medium">Stav</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity, idx) => {
                    const Icon = getIcon(activity.type);
                    return (
                      <tr key={activity.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-primary" />
                            <span className="text-sm capitalize">{activity.type}</span>
                          </div>
                        </td>
                        <td className="p-3 text-sm">{activity.model}</td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString("cs-CZ", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="p-3">{getStatusBadge(activity.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function TabletStatsCardsWidget() {
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
    { label: "Modely použité dnes", value: stats.modelsToday, icon: TrendingUp, color: "text-primary" },
    { label: "Celkem konverzací", value: stats.totalConversations, icon: MessageSquare, color: "text-accent" },
    { label: "Oblíbené prompty", value: stats.favoritePrompts, icon: Heart, color: "text-pink-500" },
    { label: "Vygenerované soubory", value: stats.filesGenerated, icon: FileText, color: "text-purple-500" }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="h-full">
            <CardContent className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {statCards.map((stat, idx) => (
        <Card key={idx} className="bg-gradient-to-br from-background to-muted/20 hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            <p className="text-3xl font-bold mb-2">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}