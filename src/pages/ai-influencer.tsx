import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Video, Sparkles, LogOut, Trash2, Play, Clock, Loader2, UserPlus, Coins } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { creditsService } from "@/services/creditsService";
import { aiInfluencerService, type AIInfluencer, type InfluencerVideo, type VoiceType, type Personality } from "@/services/aiInfluencerService";
import { supabase } from "@/integrations/supabase/client";

const VOICE_TYPES = [
  { value: "neutral", label: "Neutrální", description: "Vyvážený a příjemný hlas" },
  { value: "energetic", label: "Energický", description: "Dynamický a nadšený" },
  { value: "calm", label: "Klidný", description: "Relaxační a uklidňující" },
  { value: "professional", label: "Profesionální", description: "Důvěryhodný a seriózní" },
  { value: "friendly", label: "Přátelský", description: "Přívětivý a blízký" },
];

const PERSONALITIES = [
  { value: "professional", label: "Profesionální", description: "Seriózní business přístup" },
  { value: "casual", label: "Casual", description: "Uvolněný a neformální" },
  { value: "humorous", label: "Humorný", description: "Vtipný a zábavný" },
  { value: "inspirational", label: "Inspirativní", description: "Motivující a povzbuzující" },
  { value: "educational", label: "Vzdělávací", description: "Informativní a poučný" },
];

export default function AIInfluencer() {
  const router = useRouter();
  const [credits, setCredits] = useState(0);
  const [influencers, setInfluencers] = useState<AIInfluencer[]>([]);
  const [videos, setVideos] = useState<InfluencerVideo[]>([]);
  const [selectedInfluencer, setSelectedInfluencer] = useState<AIInfluencer | null>(null);
  const [activeTab, setActiveTab] = useState("influencers");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [voiceType, setVoiceType] = useState<VoiceType>("neutral");
  const [personality, setPersonality] = useState<Personality>("professional");
  const [script, setScript] = useState("");

  useEffect(() => {
    loadCredits();
    loadInfluencers();
    loadVideos();
  }, []);

  const loadCredits = async () => {
    try {
      const userCredits = await creditsService.getCredits();
      setCredits(userCredits);
    } catch (error) {
      console.error("Error loading credits:", error);
    }
  };

  const loadInfluencers = async () => {
    try {
      const data = await aiInfluencerService.getInfluencers();
      setInfluencers(data);
    } catch (error) {
      console.error("Error loading influencers:", error);
    }
  };

  const loadVideos = async () => {
    try {
      const data = await aiInfluencerService.getVideos();
      setVideos(data);
    } catch (error) {
      console.error("Error loading videos:", error);
    }
  };

  const handleCreateInfluencer = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await aiInfluencerService.createInfluencer({
        name: name.trim(),
        description: description.trim(),
        voice_type: voiceType,
        personality,
      });

      await loadInfluencers();
      setDialogOpen(false);
      setName("");
      setDescription("");
      setVoiceType("neutral");
      setPersonality("professional");
    } catch (error) {
      console.error("Error creating influencer:", error);
      alert("Chyba při vytváření influencera");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async (e: FormEvent) => {
    e.preventDefault();
    if (!script.trim() || !selectedInfluencer) return;

    if (credits < 10) {
      alert("Nemáte dostatek kreditů. Generování videa s influencerem stojí 10 kreditů.");
      return;
    }

    setLoading(true);
    try {
      await aiInfluencerService.createVideo({
        influencer_id: selectedInfluencer.id,
        script: script.trim(),
      });

      const newCredits = await creditsService.deductCredits(10);
      setCredits(newCredits);

      await loadVideos();
      setVideoDialogOpen(false);
      setScript("");
      setActiveTab("videos");
      
      // Success notification
      alert("✅ Video bylo úspěšně vygenerováno! Najdete ho v záložce Videa.");
    } catch (error) {
      console.error("Error generating video:", error);
      if (error instanceof Error) {
        if (error.message.includes("Insufficient credits")) {
          alert("❌ Nemáte dostatek kreditů. Potřebujete minimálně 10 kreditů.");
        } else if (error.message.includes("API key")) {
          alert("❌ Chyba konfigurace API. Kontaktujte administrátora.");
        } else {
          alert(`❌ Chyba při generování videa: ${error.message}`);
        }
      } else {
        alert("❌ Neočekávaná chyba při generování videa.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInfluencer = async (id: string) => {
    if (!confirm("Opravdu chcete smazat tohoto influencera? Všechna jeho videa budou také smazána.")) return;

    try {
      await aiInfluencerService.deleteInfluencer(id);
      await loadInfluencers();
      await loadVideos();
    } catch (error) {
      console.error("Error deleting influencer:", error);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm("Opravdu chcete smazat toto video?")) return;

    try {
      await aiInfluencerService.deleteVideo(id);
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
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-lg font-heading font-bold">AI Influencer</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-lg border border-accent/20">
                  <Coins className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">{credits}</span>
                  <span className="text-xs text-muted-foreground">kreditů</span>
                </div>
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="influencers">Moji Influenceři</TabsTrigger>
              <TabsTrigger value="videos">Videa</TabsTrigger>
            </TabsList>

            <TabsContent value="influencers" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-heading flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        AI Influenceři
                      </CardTitle>
                      <CardDescription>
                        Vytvořte si vlastního virtuálního influencera pro generování video obsahu
                      </CardDescription>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Vytvořit influencera
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="font-heading">
                            Vytvořit AI influencera
                          </DialogTitle>
                          <DialogDescription>
                            Definujte osobnost a charakteristiky vašeho virtuálního influencera
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateInfluencer} className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Jméno influencera *</Label>
                            <Input
                              id="name"
                              placeholder="např. TechGuru AI, FitCoach Sarah..."
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="description">Popis</Label>
                            <Textarea
                              id="description"
                              placeholder="Stručný popis influencera a jeho zaměření..."
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              rows={3}
                            />
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="voice">Typ hlasu</Label>
                              <Select value={voiceType} onValueChange={(v) => setVoiceType(v as VoiceType)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {VOICE_TYPES.map((voice) => (
                                    <SelectItem key={voice.value} value={voice.value}>
                                      <div>
                                        <div className="font-medium">{voice.label}</div>
                                        <div className="text-xs text-muted-foreground">{voice.description}</div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="personality">Osobnost</Label>
                              <Select value={personality} onValueChange={(v) => setPersonality(v as Personality)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PERSONALITIES.map((p) => (
                                    <SelectItem key={p.value} value={p.value}>
                                      <div>
                                        <div className="font-medium">{p.label}</div>
                                        <div className="text-xs text-muted-foreground">{p.description}</div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Vytváření...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Vytvořit influencera
                              </>
                            )}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {influencers.length === 0 ? (
                    <div className="text-center py-12">
                      <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Zatím nemáte žádné AI influencery. Vytvořte si prvního!
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {influencers.map((influencer) => (
                        <Card key={influencer.id} className="overflow-hidden">
                          <CardHeader className="pb-3">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-12 w-12 bg-gradient-to-br from-primary to-accent">
                                <AvatarFallback className="text-white font-semibold">
                                  {influencer.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base truncate">{influencer.name}</CardTitle>
                                <div className="flex gap-1 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {VOICE_TYPES.find(v => v.value === influencer.voice_type)?.label}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {PERSONALITIES.find(p => p.value === influencer.personality)?.label}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            {influencer.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {influencer.description}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                className="flex-1"
                                onClick={() => {
                                  setSelectedInfluencer(influencer);
                                  setVideoDialogOpen(true);
                                }}
                              >
                                <Video className="h-3 w-3 mr-1" />
                                Vytvořit video
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteInfluencer(influencer.id)}
                              >
                                <Trash2 className="h-3 w-3" />
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

            <TabsContent value="videos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    Vygenerovaná videa
                  </CardTitle>
                  <CardDescription>
                    Historie videí vytvořených vašimi AI influencery
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {videos.length === 0 ? (
                    <div className="text-center py-12">
                      <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Zatím jste nevytvořili žádná videa s AI influencery
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {videos.map((video) => (
                        <Card key={video.id} className="overflow-hidden">
                          <div className="aspect-video bg-muted relative flex items-center justify-center">
                            <Play className="h-12 w-12 text-muted-foreground" />
                            {video.duration && (
                              <Badge className="absolute bottom-2 right-2">
                                {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, "0")}
                              </Badge>
                            )}
                          </div>
                          <CardContent className="pt-4 space-y-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6 bg-gradient-to-br from-primary to-accent">
                                <AvatarFallback className="text-white text-xs">
                                  AI
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium truncate">
                                {video.ai_influencers?.name || "Neznámý influencer"}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {video.script}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(video.created_at).toLocaleDateString("cs-CZ")}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteVideo(video.id)}
                              >
                                <Trash2 className="h-3 w-3" />
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

          <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-heading">
                  Vytvořit video s {selectedInfluencer?.name}
                </DialogTitle>
                <DialogDescription>
                  Napište scénář a váš AI influencer vytvoří video (10 kreditů)
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleGenerateVideo} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="script">Scénář videa *</Label>
                  <Textarea
                    id="script"
                    placeholder="Napište o čem má influencer mluvit... např. 'Dnes vám ukážu 5 tipů jak být produktivnější...'"
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    rows={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Ideální délka: 100-300 slov pro 30-90 sekundové video
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium text-sm">Detaily influencera:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Hlas:</span>{" "}
                      <span className="font-medium">
                        {VOICE_TYPES.find(v => v.value === selectedInfluencer?.voice_type)?.label}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Osobnost:</span>{" "}
                      <span className="font-medium">
                        {PERSONALITIES.find(p => p.value === selectedInfluencer?.personality)?.label}
                      </span>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading || credits < 10}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generování videa...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Vygenerovat video (10 kreditů)
                    </>
                  )}
                </Button>
                {credits < 10 && (
                  <p className="text-sm text-destructive text-center">
                    Nemáte dostatek kreditů. Kontaktujte administrátora.
                  </p>
                )}
              </form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </AuthGuard>
  );
}