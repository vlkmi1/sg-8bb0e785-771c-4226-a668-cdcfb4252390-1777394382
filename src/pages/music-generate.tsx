import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Music, Sparkles, Loader2, Clock, Trash2, Download, Play, Pause, Coins, Settings, AlertCircle } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ModuleHeader } from "@/components/ModuleHeader";
import { musicService, type MusicGeneration, type MusicProvider } from "@/services/musicService";
import { creditsService } from "@/services/creditsService";
import { adminService } from "@/services/adminService";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeSwitch } from "@/components/ThemeSwitch";

const MUSIC_PROVIDERS = [
  { id: "suno", name: "Suno AI", icon: "🎵", description: "Profesionální AI hudba s vokály" },
  { id: "musicgen", name: "MusicGen", icon: "🎼", description: "Meta's open-source hudební model" },
  { id: "mubert", name: "Mubert", icon: "🎧", description: "Royalty-free AI hudba" },
  { id: "aiva", name: "AIVA", icon: "🎹", description: "AI hudební kompozice" },
  { id: "soundraw", name: "Soundraw", icon: "🎶", description: "AI hudební creator" },
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
  const [genre, setGenre] = useState("pop");
  const [mood, setMood] = useState("happy");
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [generations, setGenerations] = useState<MusicGeneration[]>([]);
  const [credits, setCredits] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedGeneration, setSelectedGeneration] = useState<MusicGeneration | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeProviders, setActiveProviders] = useState<string[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingProviders(true);
    try {
      const [userCredits, musicList, providers] = await Promise.all([
        creditsService.getCredits(),
        musicService.getGenerations(),
        adminService.getActiveMusicProviders(),
      ]);

      setCredits(userCredits);
      setGenerations(musicList);
      setActiveProviders(providers);

      // Set first available provider as default
      if (providers.length > 0 && !providers.includes(provider)) {
        setProvider(providers[0] as MusicProvider);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoadingProviders(false);
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

  // Get only available providers
  const availableProviders = MUSIC_PROVIDERS.filter(p => 
    activeProviders.includes(p.id)
  );

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <ModuleHeader credits={credits} />

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Page Header */}
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Music Generator
              </h1>
              <p className="text-muted-foreground text-lg">
                Vytvářejte unikátní hudbu pomocí AI
              </p>
            </div>

            {/* No Providers Warning */}
            {!loadingProviders && availableProviders.length === 0 && (
              <Card className="border-destructive bg-destructive/10">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-destructive/20">
                      <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-heading font-semibold text-destructive">
                        Žádný music provider není aktivní
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Pro použití Music Generatoru je potřeba nastavit alespoň jeden API klíč pro music providera (Suno AI, MusicGen, Mubert, AIVA nebo Soundraw).
                      </p>
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => router.push("/admin")}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Přejít do Admin nastavení
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              {/* Generation Form */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Music className="h-5 w-5 text-primary" />
                    Vygenerovat novou hudbu
                  </CardTitle>
                  <CardDescription>
                    Zadejte popis hudby, kterou chcete vytvořit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGenerate} className="space-y-6">
                    {/* Provider Selection */}
                    {loadingProviders ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Načítání providerů...</span>
                      </div>
                    ) : availableProviders.length > 0 ? (
                      <>
                        <div className="space-y-3">
                          <Label>AI Provider</Label>
                          <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
                            {availableProviders.map((prov) => (
                              <button
                                key={prov.id}
                                type="button"
                                onClick={() => setProvider(prov.id as MusicProvider)}
                                className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                                  provider === prov.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50"
                                }`}
                              >
                                <div className="text-2xl mb-2">{prov.icon}</div>
                                <div className="font-semibold text-sm">{prov.name}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {prov.description}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Rest of the form */}
                        <div className="space-y-2">
                          <Label htmlFor="prompt">Popis hudby</Label>
                          <Textarea
                            id="prompt"
                            placeholder="Např: Optimistická popová skladba s elektrickými kytarami a synthesizery"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={4}
                            required
                            disabled={availableProviders.length === 0}
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="genre">Žánr</Label>
                            <select
                              id="genre"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={genre}
                              onChange={(e) => setGenre(e.target.value)}
                              disabled={availableProviders.length === 0}
                            >
                              {GENRES.map((g) => (
                                <option key={g.value} value={g.value}>
                                  {g.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="mood">Nálada</Label>
                            <select
                              id="mood"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={mood}
                              onChange={(e) => setMood(e.target.value)}
                              disabled={availableProviders.length === 0}
                            >
                              {MOODS.map((m) => (
                                <option key={m.value} value={m.value}>
                                  {m.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="duration">
                            Délka: {duration} sekund
                          </Label>
                          <Input
                            id="duration"
                            type="range"
                            min="10"
                            max="120"
                            step="10"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            disabled={availableProviders.length === 0}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>10s</span>
                            <span>120s</span>
                          </div>
                        </div>

                        <Card className="bg-muted/50">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Coins className="h-5 w-5 text-primary" />
                                <span className="text-sm font-medium">Cena generování</span>
                              </div>
                              <Badge variant="secondary" className="text-base">
                                5 kreditů
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={loading || credits < 5 || availableProviders.length === 0}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generuji hudbu...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Vygenerovat hudbu
                            </>
                          )}
                        </Button>
                      </>
                    ) : null}
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
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}