import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Music, Sparkles, LogOut, Trash2, Download, Loader2, Play, Pause, Settings, Coins } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { musicService, type MusicGeneration, type MusicProvider } from "@/services/musicService";
import { creditsService } from "@/services/creditsService";
import { supabase } from "@/integrations/supabase/client";
import { ModuleHeader } from "@/components/ModuleHeader";

const MUSIC_PROVIDERS = [
  { id: "suno", name: "Suno AI", icon: "🎵", description: "Pokročilá AI hudba s vokály" },
  { id: "musicgen", name: "MusicGen", icon: "🎹", description: "Meta AI hudební model" },
  { id: "mubert", name: "Mubert", icon: "🎧", description: "AI hudba v reálném čase" },
  { id: "aiva", name: "AIVA", icon: "🎼", description: "AI skladatel orchestrální hudby" },
  { id: "soundraw", name: "Soundraw", icon: "🎶", description: "AI hudba bez autorských práv" },
];

const GENRES = [
  "Pop", "Rock", "Electronic", "Hip Hop", "Jazz", "Classical", 
  "Ambient", "Folk", "R&B", "Country", "Metal", "Indie"
];

const MOODS = [
  "Energetic", "Calm", "Happy", "Sad", "Epic", "Romantic",
  "Dark", "Uplifting", "Mysterious", "Playful"
];

const DURATIONS = [
  { value: 30, label: "30 sekund", credits: 5 },
  { value: 60, label: "1 minuta", credits: 8 },
  { value: 120, label: "2 minuty", credits: 12 },
  { value: 180, label: "3 minuty", credits: 15 },
];

export default function MusicGenerate() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("generate");
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState<MusicProvider>("suno");
  const [genre, setGenre] = useState("Pop");
  const [mood, setMood] = useState("Energetic");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [generations, setGenerations] = useState<MusicGeneration[]>([]);
  const [credits, setCredits] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userCredits = await creditsService.getCredits();
      setCredits(userCredits);
      const data = await musicService.getGenerations();
      setGenerations(data);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const selectedDuration = DURATIONS.find(d => d.value === duration);
    if (!selectedDuration) return;

    if (credits < selectedDuration.credits) {
      alert(`Nemáte dostatek kreditů. Potřebujete ${selectedDuration.credits} kreditů.`);
      return;
    }

    setLoading(true);
    try {
      await musicService.createMusic({
        prompt,
        genre,
        mood,
        duration,
        provider,
      });

      const newCredits = await creditsService.deductCredits(selectedDuration.credits);
      setCredits(newCredits);

      await loadData();
      setActiveTab("gallery");
      setPrompt("");
    } catch (error) {
      console.error("Error generating music:", error);
      alert("Chyba při generování hudby. Zkontrolujte připojení a kredity.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Opravdu chcete smazat tuto skladbu?")) return;

    try {
      await musicService.deleteGeneration(id);
      await loadData();
    } catch (error) {
      console.error("Error deleting music:", error);
    }
  };

  const handlePlayPause = (id: string) => {
    setPlayingId(playingId === id ? null : id);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      processing: "secondary",
      completed: "default",
      failed: "destructive",
    };
    return variants[status as keyof typeof variants] || "secondary";
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <ModuleHeader credits={credits} />

        <main className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="generate">Generovat hudbu</TabsTrigger>
              <TabsTrigger value="gallery">Moje skladby ({generations.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Nová skladba</CardTitle>
                    <CardDescription>
                      Popište hudbu kterou chcete vytvořit a AI ji pro vás vygeneruje
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleGenerate} className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="prompt">Popis skladby *</Label>
                          <Textarea
                            id="prompt"
                            placeholder="Např. Energická elektronická hudba s tropickými beaty, pro letní party..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="h-24"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="genre">Žánr</Label>
                            <Select value={genre} onValueChange={setGenre}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {GENRES.map((g) => (
                                  <SelectItem key={g} value={g}>
                                    {g}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="mood">Nálada</Label>
                            <Select value={mood} onValueChange={setMood}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {MOODS.map((m) => (
                                  <SelectItem key={m} value={m}>
                                    {m}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="duration">Délka skladby</Label>
                          <Select value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DURATIONS.map((d) => (
                                <SelectItem key={d.value} value={d.value.toString()}>
                                  {d.label} ({d.credits} kreditů)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="provider">AI Model</Label>
                          <Select value={provider} onValueChange={(v) => setProvider(v as MusicProvider)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MUSIC_PROVIDERS.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  <div className="flex items-center gap-2">
                                    <span>{p.icon}</span>
                                    <span>{p.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loading || !prompt.trim()}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generování...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Vygenerovat hudbu
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30">
                  <CardHeader>
                    <CardTitle className="font-heading">AI Hudební modely</CardTitle>
                    <CardDescription>
                      Vyberte AI model podle vašich potřeb
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {MUSIC_PROVIDERS.map((p) => (
                      <Card key={p.id} className={provider === p.id ? "border-primary" : ""}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{p.icon}</span>
                            <div className="flex-1">
                              <CardTitle className="text-base">{p.name}</CardTitle>
                              <CardDescription className="text-xs">{p.description}</CardDescription>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Moje skladby</CardTitle>
                  <CardDescription>
                    Všechny vaše vygenerované hudební skladby
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {generations.length === 0 ? (
                    <div className="text-center py-12">
                      <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Zatím nemáte žádné vygenerované skladby</p>
                      <Button 
                        onClick={() => setActiveTab("generate")} 
                        className="mt-4"
                      >
                        Vytvořit první skladbu
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {generations.map((gen) => (
                        <Card key={gen.id} className="overflow-hidden">
                          <div className="aspect-square bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center relative">
                            <Music className="h-16 w-16 text-primary/50" />
                            <Badge 
                              variant={getStatusBadge(gen.status) as any}
                              className="absolute top-2 right-2"
                            >
                              {gen.status === "processing" && "Generování..."}
                              {gen.status === "completed" && "Hotovo"}
                              {gen.status === "failed" && "Chyba"}
                            </Badge>
                          </div>
                          <CardContent className="p-4 space-y-3">
                            <div>
                              <p className="font-semibold text-sm line-clamp-2">{gen.prompt}</p>
                              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                <span>{gen.genre}</span>
                                <span>•</span>
                                <span>{gen.mood}</span>
                                <span>•</span>
                                <span>{gen.duration}s</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 text-xs">
                                <span>{MUSIC_PROVIDERS.find(p => p.id === gen.provider)?.icon}</span>
                                <span className="text-muted-foreground">
                                  {MUSIC_PROVIDERS.find(p => p.id === gen.provider)?.name}
                                </span>
                              </div>
                            </div>

                            {gen.status === "completed" && gen.audio_url && (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => handlePlayPause(gen.id)}
                                >
                                  {playingId === gen.id ? (
                                    <>
                                      <Pause className="h-3 w-3 mr-1" />
                                      Pauza
                                    </>
                                  ) : (
                                    <>
                                      <Play className="h-3 w-3 mr-1" />
                                      Přehrát
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <a href={gen.audio_url} download>
                                    <Download className="h-3 w-3" />
                                  </a>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(gen.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  );
}