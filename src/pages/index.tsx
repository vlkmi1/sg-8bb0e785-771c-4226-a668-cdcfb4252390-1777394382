import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, MessageSquare, LogOut, ImageIcon, Sparkles, Shield, Coins, Play, Mic, TrendingUp, Settings } from "lucide-react";
import { adminService } from "@/services/adminService";
import { creditsService } from "@/services/creditsService";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";

export default function Home() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    checkAdminStatus();
    loadCredits();
  }, []);

  const checkAdminStatus = async () => {
    const status = await adminService.isAdmin();
    setIsAdmin(status);
  };

  const loadCredits = async () => {
    try {
      const userCredits = await creditsService.getCredits();
      setCredits(userCredits);
    } catch (error) {
      console.error("Error loading credits:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-lg font-heading font-bold">kAIkus</h1>
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
                {isAdmin && (
                  <Button variant="ghost" onClick={() => router.push("/admin")}>
                    <Shield className="h-5 w-5 mr-2" />
                    Admin
                  </Button>
                )}
                <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                  <TrendingUp className="h-5 w-5 mr-2" />
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
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-heading font-bold">
                Vítejte v <span className="text-primary">kAIkus</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Platforma spojující nejpoužívanější AI modely na jednom místě
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-primary/10 rounded-xl mb-2">
                      <MessageSquare className="h-8 w-8 text-primary" />
                    </div>
                    <Badge variant="default" className="bg-accent">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Konverzace
                    </Badge>
                  </div>
                  <CardTitle className="font-heading">AI Chat</CardTitle>
                  <CardDescription>GPT-4, Claude, Gemini a další</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full"
                    onClick={() => router.push("/chat")}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Začít chatovat
                  </Button>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-primary/10 rounded-xl mb-2">
                      <ImageIcon className="h-8 w-8 text-primary" />
                    </div>
                    <Badge variant="default" className="bg-accent">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Kreativita
                    </Badge>
                  </div>
                  <CardTitle className="font-heading">Generování obrázků</CardTitle>
                  <CardDescription>DALL-E, Stable Diffusion, Midjourney</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full"
                    onClick={() => router.push("/generate")}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Vygenerovat obrázek
                  </Button>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow border-secondary/20 bg-gradient-to-br from-secondary/5 to-primary/5">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-secondary/10 rounded-xl mb-2">
                      <Play className="h-8 w-8 text-secondary" />
                    </div>
                    <Badge variant="default" className="bg-accent">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Video
                    </Badge>
                  </div>
                  <CardTitle className="font-heading">Generování videí</CardTitle>
                  <CardDescription>RunwayML, Pika Labs, Stability AI</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full"
                    onClick={() => router.push("/video-generate")}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Vygenerovat video
                  </Button>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow border-primary/20 bg-gradient-to-br from-accent/5 to-primary/5">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-primary/10 rounded-xl mb-2">
                      <Mic className="h-8 w-8 text-primary" />
                    </div>
                    <Badge variant="default" className="bg-accent">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Hlas
                    </Badge>
                  </div>
                  <CardTitle className="font-heading">Hlasový chat</CardTitle>
                  <CardDescription>OpenAI Whisper, ElevenLabs, Google</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    className="w-full"
                    onClick={() => router.push("/voice-chat")}
                  >
                    <Mic className="h-4 w-4 mr-2" />
                    Mluvit s AI
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}