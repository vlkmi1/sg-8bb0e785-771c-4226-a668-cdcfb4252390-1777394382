import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { TrendingUp, Sparkles, LogOut, Download, Trash2, Play, Pause, Loader2, Coins, Eye, Heart, Share2 } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { viralVideoService, type ViralVideo, type Platform, type VideoTrend, type VideoStyle, type VideoEffect } from "@/services/viralVideoService";
import { creditsService } from "@/services/creditsService";
import { ModuleHeader } from "@/components/ModuleHeader";

const PLATFORMS = [
  { id: "tiktok", name: "TikTok", icon: "🎵", aspect: "9:16", description: "Optimalizováno pro TikTok" },
  { id: "reels", name: "Instagram Reels", icon: "📷", aspect: "9:16", description: "Optimalizováno pro Instagram" },
  { id: "shorts", name: "YouTube Shorts", icon: "📹", aspect: "9:16", description: "Optimalizováno pro YouTube" },
];

const TRENDS = [
  { id: "transition", name: "Transition", icon: "✨", description: "Plynulé přechody a efekty" },
  { id: "dance", name: "Dance", icon: "💃", description: "Taneční choreografie" },
  { id: "comedy", name: "Comedy", icon: "😂", description: "Vtipný obsah" },
  { id: "tutorial", name: "Tutorial", icon: "📚", description: "Návody a tipy" },
  { id: "challenge", name: "Challenge", icon: "🎯", description: "Virální výzvy" },
  { id: "aesthetic", name: "Aesthetic", icon: "🌸", description: "Vizuálně poutavé" },
  { id: "trending-sound", name: "Trending Sound", icon: "🎶", description: "S populární hudbou" },
];

const STYLES = [
  { id: "cinematic", name: "Cinematic", description: "Filmový vzhled s profesionálními efekty" },
  { id: "minimal", name: "Minimal", description: "Čisté a jednoduché" },
  { id: "energetic", name: "Energetic", description: "Rychlé a dynamické" },
  { id: "dark", name: "Dark", description: "Tmavé a dramatické" },
  { id: "colorful", name: "Colorful", description: "Živé a barevné" },
  { id: "retro", name: "Retro", description: "Vintage styl" },
  { id: "modern", name: "Modern", description: "Současný a trendy" },
];

const EFFECTS = [
  { id: "glitch", name: "Glitch", icon: "⚡" },
  { id: "zoom", name: "Zoom", icon: "🔍" },
  { id: "slow-motion", name: "Slow Motion", icon: "⏱️" },
  { id: "fast-forward", name: "Fast Forward", icon: "⏩" },
  { id: "reverse", name: "Reverse", icon: "⏪" },
  { id: "split-screen", name: "Split Screen", icon: "📱" },
  { id: "green-screen", name: "Green Screen", icon: "🎬" },
];

export default function ViralVideos() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("create");
  const [videos, setVideos] = useState<ViralVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState(0);

  // Form states
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState<Platform>("tiktok");
  const [trend, setTrend] = useState<VideoTrend>("transition");
  const [style, setStyle] = useState<VideoStyle>("cinematic");
  const [duration, setDuration] = useState<15 | 30 | 60>(15);
  const [selectedEffects, setSelectedEffects] = useState<VideoEffect[]>([]);
  const [provider, setProvider] = useState("runwayml");

  // Preview dialog
  const [previewVideo, setPreviewVideo] = useState<ViralVideo | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [videosData, userCredits] = await Promise.all([
        viralVideoService.getVideos(),
        creditsService.getCredits(),
      ]);
      setVideos(videosData);
      setCredits(userCredits);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const toggleEffect = (effectId: VideoEffect) => {
    setSelectedEffects(prev =>
      prev.includes(effectId)
        ? prev.filter(e => e !== effectId)
        : [...prev, effectId]
    );
  };

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const requiredCredits = viralVideoService.getCreditsRequired(duration);
    if (credits < requiredCredits) {
      alert(`Nemáte dostatek kreditů. Potřebujete ${requiredCredits} kreditů.`);
      return;
    }

    setLoading(true);
    try {
      await viralVideoService.createVideo({
        prompt,
        trend,
        style,
        platform,
        duration,
        effects: selectedEffects,
        provider,
      });

      const newCredits = await creditsService.deductCredits(requiredCredits);
      setCredits(newCredits);

      await loadData();
      setActiveTab("gallery");
      setPrompt("");
      setSelectedEffects([]);
    } catch (error) {
      console.error("Error generating viral video:", error);
      alert("Chyba při generování videa.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Opravdu chcete smazat toto video?")) return;

    try {
      await viralVideoService.deleteVideo(id);
      await loadData();
    } catch (error) {
      console.error("Error deleting video:", error);
    }
  };

  const handlePreview = (video: ViralVideo) => {
    setPreviewVideo(video);
    setPreviewDialogOpen(true);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) router.push("/auth/login");
  };

  const creditsRequired = viralVideoService.getCreditsRequired(duration);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <ModuleHeader credits={credits} />

        <main className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="create">
                <Sparkles className="h-4 w-4 mr-2" />
                Vytvořit
              </TabsTrigger>
              <TabsTrigger value="gallery">
                <Play className="h-4 w-4 mr-2" />
                Galerie
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Generovat virální video</CardTitle>
                  <CardDescription>
                    AI vytvoří krátké video optimalizované pro maximální engagement na sociálních sítích
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGenerate} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="prompt">Popis obsahu videa</Label>
                          <Textarea
                            id="prompt"
                            placeholder="Např. Rychlý tutorial jak uvařit kávu s krásnými přechody..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="h-24"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Platforma</Label>
                          <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PLATFORMS.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.icon} {p.name} ({p.aspect})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Trend</Label>
                          <Select value={trend} onValueChange={(v) => setTrend(v as VideoTrend)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TRENDS.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.icon} {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            {TRENDS.find(t => t.id === trend)?.description}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Vizuální styl</Label>
                          <Select value={style} onValueChange={(v) => setStyle(v as VideoStyle)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STYLES.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            {STYLES.find(s => s.id === style)?.description}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Délka videa</Label>
                          <Select value={duration.toString()} onValueChange={(v) => setDuration(Number(v) as 15 | 30 | 60)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15">15 sekund (8 kreditů)</SelectItem>
                              <SelectItem value="30">30 sekund (12 kreditů)</SelectItem>
                              <SelectItem value="60">60 sekund (20 kreditů)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Efekty (volitelné)</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {EFFECTS.map((effect) => (
                              <div
                                key={effect.id}
                                className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                                  selectedEffects.includes(effect.id as VideoEffect)
                                    ? "bg-primary/10 border-primary"
                                    : "hover:bg-muted"
                                }`}
                                onClick={() => toggleEffect(effect.id as VideoEffect)}
                              >
                                <Checkbox
                                  checked={selectedEffects.includes(effect.id as VideoEffect)}
                                  onCheckedChange={() => toggleEffect(effect.id as VideoEffect)}
                                />
                                <label className="text-sm cursor-pointer flex items-center gap-1">
                                  <span>{effect.icon}</span>
                                  {effect.name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>AI Provider</Label>
                          <Select value={provider} onValueChange={setProvider}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="runwayml">🎬 RunwayML Gen-2</SelectItem>
                              <SelectItem value="pika">🎥 Pika Labs</SelectItem>
                              <SelectItem value="runway-gen2">🚀 Runway Gen-2 Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <p className="text-sm font-medium">Potřebné kredity: {creditsRequired}</p>
                        <p className="text-xs text-muted-foreground">Váš zůstatek: {credits} kreditů</p>
                      </div>
                      <Button type="submit" disabled={loading || credits < creditsRequired} size="lg">
                        {loading ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Generování...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5 mr-2" />
                            Vygenerovat video
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-muted/50">
                <CardHeader>
                  <CardTitle className="text-sm">💡 Tipy pro virální videa</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>• První 3 sekundy jsou klíčové - zahákněte diváka hned</p>
                  <p>• Používejte trendy efekty a přechody pro vyšší engagement</p>
                  <p>• Optimalizujte pro platformu - TikTok preferuje rychlý content, Reels estetiku</p>
                  <p>• Kombinujte více efektů pro jedinečný vizuální styl</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="gallery" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Vaše virální videa</CardTitle>
                  <CardDescription>
                    Všechna vygenerovaná virální videa na jednom místě
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {videos.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Zatím nemáte žádná virální videa</p>
                      <Button onClick={() => setActiveTab("create")} className="mt-4">
                        Vytvořit první video
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {videos.map((video) => (
                        <Card key={video.id} className="overflow-hidden">
                          <div className="aspect-[9/16] bg-gradient-to-br from-primary/20 to-secondary/20 relative flex items-center justify-center">
                            {video.thumbnail_url ? (
                              <img src={video.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                            ) : (
                              <Play className="h-16 w-16 text-muted-foreground" />
                            )}
                            <div className="absolute top-2 right-2">
                              <Badge variant={video.status === "completed" ? "default" : video.status === "processing" ? "secondary" : "destructive"}>
                                {video.status === "processing" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                                {video.status === "completed" ? "Hotovo" : video.status === "processing" ? "Generování" : "Chyba"}
                              </Badge>
                            </div>
                            <div className="absolute bottom-2 left-2">
                              <Badge variant="secondary" className="text-xs">
                                {video.duration}s
                              </Badge>
                            </div>
                          </div>
                          <CardContent className="pt-4 space-y-3">
                            <div>
                              <p className="text-sm font-medium line-clamp-2">{video.prompt}</p>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {PLATFORMS.find(p => p.id === video.platform)?.icon} {PLATFORMS.find(p => p.id === video.platform)?.name}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {TRENDS.find(t => t.id === video.trend)?.icon} {video.trend}
                                </Badge>
                              </div>
                            </div>

                            {video.status === "completed" && (
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {video.views || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  {video.likes || 0}
                                </span>
                              </div>
                            )}

                            <div className="flex gap-2">
                              {video.status === "completed" && (
                                <>
                                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handlePreview(video)}>
                                    <Play className="h-4 w-4 mr-1" />
                                    Přehrát
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => window.open(video.video_url || "", "_blank")}>
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button variant="outline" size="sm" onClick={() => handleDelete(video.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Náhled videa</DialogTitle>
              </DialogHeader>
              {previewVideo && (
                <div className="space-y-4">
                  <div className="aspect-[9/16] bg-black rounded-lg overflow-hidden">
                    <video
                      src={previewVideo.video_url || ""}
                      controls
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{previewVideo.prompt}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{previewVideo.platform}</Badge>
                      <Badge variant="secondary">{previewVideo.trend}</Badge>
                      <Badge variant="secondary">{previewVideo.style}</Badge>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </AuthGuard>
  );
}