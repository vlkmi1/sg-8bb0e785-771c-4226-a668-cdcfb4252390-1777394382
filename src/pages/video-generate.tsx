import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Sparkles, LogOut, Loader2, Coins } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { VideoGallery } from "@/components/VideoGallery";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { videoGenerationService, type VideoProvider, type GeneratedVideo } from "@/services/videoGenerationService";
import { creditsService } from "@/services/creditsService";
import { supabase } from "@/integrations/supabase/client";
import { ModuleHeader } from "@/components/ModuleHeader";

const VIDEO_PROVIDERS: Array<{ id: VideoProvider; name: string; description: string }> = [
  { id: "runwayml", name: "RunwayML", description: "Gen-2, cinematic quality" },
  { id: "pika", name: "Pika Labs", description: "3D animations, text-to-video" },
  { id: "stability-video", name: "Stability AI", description: "Stable Video Diffusion" },
];

const DURATION_OPTIONS = [
  { value: "3", label: "3 sekundy" },
  { value: "5", label: "5 sekund" },
  { value: "10", label: "10 sekund" },
];

export default function VideoGenerate() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState<VideoProvider>("runwayml");
  const [duration, setDuration] = useState("5");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [activeTab, setActiveTab] = useState("generate");
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    loadVideos();
    loadCredits();
  }, []);

  const loadCredits = async () => {
    try {
      const userCredits = await creditsService.getCredits();
      setCredits(userCredits);
    } catch (error) {
      console.error("Error loading credits:", error);
    }
  };

  const loadVideos = async () => {
    try {
      const data = await videoGenerationService.getGeneratedVideos();
      setVideos(data);
    } catch (error) {
      console.error("Error loading videos:", error);
    }
  };

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    if (credits < 5) {
      alert("Nemáte dostatek kreditů. Generování videa stojí 5 kreditů. Kontaktujte administrátora.");
      return;
    }

    setLoading(true);
    try {
      await videoGenerationService.generateVideo({
        prompt: prompt.trim(),
        provider,
        duration: parseInt(duration),
      });

      const newCredits = await creditsService.deductCredits(5);
      setCredits(newCredits);
      
      await loadVideos();
      setPrompt("");
      setActiveTab("gallery");
    } catch (error) {
      console.error("Error generating video:", error);
      if (error instanceof Error && error.message.includes("Insufficient credits")) {
        alert("Nemáte dostatek kreditů. Kontaktujte administrátora.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      await videoGenerationService.deleteVideo(id);
      await loadVideos();
    } catch (error) {
      console.error("Error deleting video:", error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <ModuleHeader credits={credits} />

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="generate">Generovat video</TabsTrigger>
              <TabsTrigger value="gallery">Galerie ({videos.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-6">
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Play className="h-5 w-5 text-primary" />
                    AI Video Generation
                  </CardTitle>
                  <CardDescription>
                    Vytvořte videa pomocí AI modelů. Stojí 5 kreditů za video.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGenerate} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="provider">AI Model</Label>
                      <Select value={provider} onValueChange={(v) => setProvider(v as VideoProvider)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {VIDEO_PROVIDERS.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              <div className="flex flex-col items-start">
                                <span className="font-medium">{p.name}</span>
                                <span className="text-xs text-muted-foreground">{p.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Délka videa</Label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="prompt">Popis videa (prompt)</Label>
                      <Textarea
                        id="prompt"
                        placeholder="Napište detailní popis videa, které chcete vygenerovat..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={4}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Buďte specifičtí a popisní pro nejlepší výsledky
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading || !prompt.trim() || credits < 5}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generuji video...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Vygenerovat video (5 kreditů)
                        </>
                      )}
                    </Button>

                    {credits < 5 && (
                      <p className="text-sm text-destructive text-center">
                        Nemáte dostatek kreditů. Kontaktujte administrátora.
                      </p>
                    )}
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gallery">
              <VideoGallery videos={videos.map(v => ({ url: v.video_url }))} onDelete={handleDeleteVideo} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  );
}