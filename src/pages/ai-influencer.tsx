import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Video, Sparkles, LogOut, Trash2, Play, Clock, Loader2, UserPlus, Coins } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { creditsService } from "@/services/creditsService";
import { aiInfluencerService, type AIInfluencer, type InfluencerVideo, type VoiceType, type Personality } from "@/services/aiInfluencerService";
import { supabase } from "@/integrations/supabase/client";
import { InfluencerAvatarLibrary } from "@/components/InfluencerAvatarLibrary";
import { VideoDetailDialog } from "@/components/VideoDetailDialog";
import { ModuleHeader } from "@/components/ModuleHeader";

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
  const [avatarLibraryOpen, setAvatarLibraryOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<InfluencerVideo | null>(null);
  const [videoDetailOpen, setVideoDetailOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [voiceType, setVoiceType] = useState<VoiceType>("neutral");
  const [personality, setPersonality] = useState<Personality>("professional");
  const [script, setScript] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [language, setLanguage] = useState("cs");

  // Video cloning states
  const [cloneVideoUrl, setCloneVideoUrl] = useState("");
  const [cloneVideoFile, setCloneVideoFile] = useState<File | null>(null);
  const [extractedScript, setExtractedScript] = useState("");
  const [extracting, setExtracting] = useState(false);

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
        avatar_url: avatarUrl,
        language,
      });

      await loadInfluencers();
      setDialogOpen(false);
      setName("");
      setDescription("");
      setVoiceType("neutral");
      setPersonality("professional");
      setAvatarUrl("");
      setLanguage("cs");
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

  const handleAvatarSelect = (template: any) => {
    setName(template.name);
    setDescription(template.description);
    setAvatarUrl(template.imageUrl);
    setVoiceType(template.voiceType);
    setPersonality(template.personality);
    setLanguage("cs");
  };

  const handleVideoClick = (video: InfluencerVideo) => {
    setSelectedVideo(video);
    setVideoDetailOpen(true);
  };

  const handleUseInSocialMedia = (video: InfluencerVideo) => {
    // Store video data in localStorage for cross-page transfer
    localStorage.setItem("pendingSocialVideo", JSON.stringify({
      videoUrl: video.video_url,
      script: video.script,
      influencerName: video.ai_influencers?.name,
    }));
    
    // Navigate to social posts
    router.push("/social-posts");
  };

  const handleExtractScript = async () => {
    if (!cloneVideoUrl && !cloneVideoFile) {
      toast({
        title: "Chyba",
        description: "Vložte URL videa nebo nahrajte soubor",
        variant: "destructive",
      });
      return;
    }

    setExtracting(true);
    try {
      const formData = new FormData();
      if (cloneVideoFile) {
        formData.append("video", cloneVideoFile);
      } else {
        formData.append("videoUrl", cloneVideoUrl);
      }

      const response = await fetch("/api/extract-video-script", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Nepodařilo se extrahovat text z videa");
      }

      const data = await response.json();
      setExtractedScript(data.script);
      setScript(data.script);
      
      toast({
        title: "Úspěch",
        description: "Text byl úspěšně extrahován z videa",
      });
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se zpracovat video",
        variant: "destructive",
      });
    } finally {
      setExtracting(false);
    }
  };

  const handleCloneVideo = async () => {
    if (!extractedScript || !selectedInfluencer) {
      toast({
        title: "Chyba",
        description: "Nejprve extrahujte text z videa a vyberte influencera",
        variant: "destructive",
      });
      return;
    }

    if (credits < 15) {
      toast({
        title: "Nedostatek kreditů",
        description: "Klonování videa stojí 15 kreditů (5 za extrakci + 10 za video)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await aiInfluencerService.createVideo({
        influencer_id: selectedInfluencer.id,
        script: extractedScript,
      });

      const newCredits = await creditsService.deductCredits(15);
      setCredits(newCredits);

      await loadVideos();
      setActiveTab("videos");
      setCloneVideoUrl("");
      setCloneVideoFile(null);
      setExtractedScript("");
      
      toast({
        title: "Úspěch",
        description: "Video bylo úspěšně naklonováno s vaším AI influencerem!",
      });
    } catch (error: any) {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se naklonovat video",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header with navigation and credits */}
        <ModuleHeader credits={credits} />

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Page Title */}
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                AI Influencer Studio
              </h1>
              <p className="text-muted-foreground text-lg">
                Vytvořte a spravujte AI avatary pro generování video obsahu
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
                <TabsTrigger value="influencers">Moji Influenceři</TabsTrigger>
                <TabsTrigger value="videos">Videa</TabsTrigger>
                <TabsTrigger value="clone">Klonovat Video</TabsTrigger>
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
                          <form onSubmit={handleCreateInfluencer} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="name">Jméno influencera</Label>
                              <div className="flex gap-2">
                                {avatarUrl && (
                                  <Avatar className="h-10 w-10 shrink-0">
                                    <AvatarImage src={avatarUrl} />
                                    <AvatarFallback>AI</AvatarFallback>
                                  </Avatar>
                                )}
                                <Input
                                  id="name"
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  placeholder="Např. Sarah Tech Guru"
                                  required
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setAvatarLibraryOpen(true)}
                                  className="shrink-0"
                                >
                                  <User className="h-4 w-4 mr-2" />
                                  Vybrat z knihovny
                                </Button>
                              </div>
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

              <TabsContent value="clone" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                      <Video className="h-5 w-5 text-primary" />
                      Klonovat Video s AI Influencerem
                    </CardTitle>
                    <CardDescription>
                      Nahrajte video nebo vložte URL, extrahujte text a vytvořte novou verzi s vaším AI influencerem
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Step 1: Upload/URL */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                          1
                        </div>
                        <h3 className="font-semibold">Nahrát nebo vložit video</h3>
                      </div>
                      
                      <div className="space-y-3 pl-10">
                        <div className="space-y-2">
                          <Label htmlFor="videoUrl">URL videa (YouTube, TikTok, atd.)</Label>
                          <Input
                            id="videoUrl"
                            type="url"
                            placeholder="https://youtube.com/watch?v=..."
                            value={cloneVideoUrl}
                            onChange={(e) => {
                              setCloneVideoUrl(e.target.value);
                              setCloneVideoFile(null);
                            }}
                            disabled={!!cloneVideoFile}
                          />
                        </div>

                        <div className="text-center text-sm text-muted-foreground">nebo</div>

                        <div className="space-y-2">
                          <Label htmlFor="videoFile">Nahrát video soubor</Label>
                          <Input
                            id="videoFile"
                            type="file"
                            accept="video/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setCloneVideoFile(file);
                                setCloneVideoUrl("");
                              }
                            }}
                            disabled={!!cloneVideoUrl}
                          />
                        </div>

                        <Button 
                          onClick={handleExtractScript}
                          disabled={extracting || (!cloneVideoUrl && !cloneVideoFile)}
                          className="w-full"
                        >
                          {extracting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Extrahuji text...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Extrahovat text z videa (5 kreditů)
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Step 2: Review Script */}
                    {extractedScript && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                            2
                          </div>
                          <h3 className="font-semibold">Zkontrolovat a upravit text</h3>
                        </div>
                        
                        <div className="pl-10 space-y-3">
                          <Textarea
                            value={extractedScript}
                            onChange={(e) => setExtractedScript(e.target.value)}
                            rows={8}
                            className="font-mono text-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            Můžete upravit extrahovaný text před klonováním
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Select Influencer */}
                    {extractedScript && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                            3
                          </div>
                          <h3 className="font-semibold">Vybrat AI influencera</h3>
                        </div>
                        
                        <div className="pl-10 space-y-3">
                          {influencers.length === 0 ? (
                            <div className="text-center py-6 text-muted-foreground">
                              <p>Zatím nemáte žádné AI influencery.</p>
                              <Button
                                variant="outline"
                                className="mt-3"
                                onClick={() => {
                                  setActiveTab("influencers");
                                  setDialogOpen(true);
                                }}
                              >
                                Vytvořit prvního influencera
                              </Button>
                            </div>
                          ) : (
                            <div className="grid gap-3 sm:grid-cols-2">
                              {influencers.map((influencer) => (
                                <Card
                                  key={influencer.id}
                                  className={`cursor-pointer transition-all ${
                                    selectedInfluencer?.id === influencer.id
                                      ? "ring-2 ring-primary"
                                      : "hover:border-primary/50"
                                  }`}
                                  onClick={() => setSelectedInfluencer(influencer)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-10 w-10 bg-gradient-to-br from-primary to-accent">
                                        <AvatarFallback className="text-white font-semibold">
                                          {influencer.name.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{influencer.name}</p>
                                        <div className="flex gap-1 mt-1">
                                          <Badge variant="secondary" className="text-xs">
                                            {VOICE_TYPES.find(v => v.value === influencer.voice_type)?.label}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}

                          {selectedInfluencer && (
                            <Button 
                              onClick={handleCloneVideo}
                              disabled={loading || credits < 15}
                              className="w-full mt-4"
                              size="lg"
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Klonuji video...
                                </>
                              ) : (
                                <>
                                  <Video className="h-4 w-4 mr-2" />
                                  Vytvořit klonované video (10 kreditů)
                                </>
                              )}
                            </Button>
                          )}

                          {credits < 15 && (
                            <p className="text-sm text-destructive text-center mt-2">
                              Potřebujete 15 kreditů (5 za extrakci + 10 za video)
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Info Box */}
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <Coins className="h-4 w-4 text-primary" />
                        Cena klonování videa
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Extrakce textu z videa: 5 kreditů</li>
                        <li>• Generování nového videa: 10 kreditů</li>
                        <li>• <strong>Celkem: 15 kreditů</strong></li>
                      </ul>
                    </div>
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

            {/* Video Detail Dialog */}
            <VideoDetailDialog
              video={selectedVideo}
              open={videoDetailOpen}
              onOpenChange={setVideoDetailOpen}
              onUseInSocialMedia={handleUseInSocialMedia}
            />

            {/* Avatar Library Dialog */}
            <InfluencerAvatarLibrary
              open={avatarLibraryOpen}
              onOpenChange={setAvatarLibraryOpen}
              onSelect={handleAvatarSelect}
            />
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}