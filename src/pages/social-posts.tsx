import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Share2, Sparkles, LogOut, Trash2, Calendar, Loader2, ImageIcon, Coins, Settings, Eye, Upload, Video, Wand2 } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { SocialPreview } from "@/components/SocialPreview";
import { socialPostsService, type SocialPlatform, type SocialPost } from "@/services/socialPostsService";
import { creditsService } from "@/services/creditsService";
import { supabase } from "@/integrations/supabase/client";

const PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: "📘", description: "Standardní příspěvek", maxChars: 63206 },
  { id: "instagram", name: "Instagram", icon: "📷", description: "Fotka s popiskem", maxChars: 2200 },
  { id: "linkedin", name: "LinkedIn", icon: "💼", description: "Profesionální post", maxChars: 3000 },
  { id: "twitter", name: "Twitter/X", icon: "𝕏", description: "Tweet", maxChars: 280 },
  { id: "youtube", name: "YouTube", icon: "📹", description: "Video popis", maxChars: 5000 },
  { id: "tiktok", name: "TikTok", icon: "🎵", description: "Krátké video", maxChars: 2200 },
];

export default function SocialPosts() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("create");
  const [topic, setTopic] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(["facebook"]);
  const [contents, setContents] = useState<Partial<Record<SocialPlatform, string>>>({});
  const [previewContents, setPreviewContents] = useState<Partial<Record<SocialPlatform, string>>>({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date | undefined>(undefined);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [credits, setCredits] = useState(0);
  const [previewPost, setPreviewPost] = useState<SocialPost | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  
  // Media states
  const [imageUrls, setImageUrls] = useState<Partial<Record<SocialPlatform, string>>>({});
  const [videoUrls, setVideoUrls] = useState<Partial<Record<SocialPlatform, string>>>({});
  const [generatingMedia, setGeneratingMedia] = useState<{platform: SocialPlatform, type: 'image' | 'video'} | null>(null);

  // Image generation dialog
  const [imageGenDialogOpen, setImageGenDialogOpen] = useState(false);
  const [currentImagePlatform, setCurrentImagePlatform] = useState<SocialPlatform | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageModel, setImageModel] = useState("dall-e-3");
  const [imageSize, setImageSize] = useState("1024x1024");

  useEffect(() => {
    loadCredits();
    loadPosts();
    loadAccounts();
    
    // Check for pending video from AI Influencer
    const pendingVideo = localStorage.getItem("pendingSocialVideo");
    if (pendingVideo) {
      try {
        const videoData = JSON.parse(pendingVideo);
        setVideoUrl(videoData.videoUrl);
        setContent(videoData.script || "");
        
        // Clear the pending video
        localStorage.removeItem("pendingSocialVideo");
        
        // Show success toast
        alert(`✅ Video z AI Influencer (${videoData.influencerName}) bylo přidáno!`);
      } catch (error) {
        console.error("Error loading pending video:", error);
      }
    }
  }, []);

  const loadData = async () => {
    try {
      const userCredits = await creditsService.getCredits();
      setCredits(userCredits);
      const data = await socialPostsService.getPosts();
      setPosts(data);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || selectedPlatforms.length === 0) return;

    setGenerating(true);
    try {
      const newContents: Partial<Record<SocialPlatform, string>> = {};
      
      // Generate post for each selected platform separately
      await Promise.all(selectedPlatforms.map(async (plat) => {
        newContents[plat] = await socialPostsService.generateContent(topic, plat);
      }));

      setContents(newContents);
      setPreviewContents(newContents);
      
      const newCredits = await creditsService.deductCredits(selectedPlatforms.length);
      setCredits(newCredits);
    } catch (error) {
      console.error("Error generating post:", error);
      alert("Chyba při generování příspěvku. Zkontrolujte připojení a kredity.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSchedule = async (e: FormEvent) => {
    e.preventDefault();
    if (selectedPlatforms.length === 0) return;

    const platformsWithContent = selectedPlatforms.filter(p => contents[p]?.trim());
    if (platformsWithContent.length === 0) return;

    setLoading(true);
    try {
      await Promise.all(platformsWithContent.map(plat => 
        socialPostsService.createPost({
          platform: plat,
          content: contents[plat] || "",
          image_url: imageUrls[plat],
          video_url: videoUrls[plat],
          scheduled_time: scheduledTime ? scheduledTime.toISOString() : undefined,
        })
      ));

      await loadData();
      setActiveTab("scheduled");
      setTopic("");
      setContents({});
      setPreviewContents({});
      setImageUrls({});
      setVideoUrls({});
      setScheduledTime(undefined);
    } catch (error) {
      console.error("Error scheduling posts:", error);
      alert("Chyba při plánování příspěvků.");
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (platform: SocialPlatform, value: string) => {
    const platformInfo = PLATFORMS.find(p => p.id === platform);
    if (platformInfo && value.length > platformInfo.maxChars) {
      return; // Don't allow exceeding character limit
    }
    setContents(prev => ({ ...prev, [platform]: value }));
    setPreviewContents(prev => ({ ...prev, [platform]: value }));
  };

  const handleMediaChange = (platform: SocialPlatform, type: "image" | "video", url: string) => {
    if (type === "image") {
      setImageUrls(prev => ({ ...prev, [platform]: url }));
    } else {
      setVideoUrls(prev => ({ ...prev, [platform]: url }));
    }
  };

  const openImageGenerator = (platform: SocialPlatform) => {
    setCurrentImagePlatform(platform);
    // Auto-fill prompt based on post content
    const content = contents[platform] || topic;
    const firstLine = content.split('\n')[0].slice(0, 100);
    setImagePrompt(firstLine || "");
    setImageGenDialogOpen(true);
  };

  const handleGenerateImage = async () => {
    if (!currentImagePlatform || !imagePrompt.trim()) return;

    setGeneratingMedia({ platform: currentImagePlatform, type: 'image' });
    try {
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          model: imageModel,
          size: imageSize,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate image");
      }

      const data = await response.json();
      
      // Set the generated image URL
      handleMediaChange(currentImagePlatform, "image", data.url);
      
      // Deduct credits
      const newCredits = await creditsService.deductCredits(1);
      setCredits(newCredits);
      
      setImageGenDialogOpen(false);
      setImagePrompt("");
    } catch (error: any) {
      console.error("Error generating image:", error);
      alert(error.message || "Chyba při generování obrázku");
    } finally {
      setGeneratingMedia(null);
    }
  };

  const togglePlatform = (platformId: SocialPlatform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Opravdu chcete smazat tento příspěvek?")) return;

    try {
      await socialPostsService.deletePost(id);
      await loadData();
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const handlePreview = (post: SocialPost) => {
    setPreviewPost(post);
    setPreviewDialogOpen(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: "secondary",
      scheduled: "default",
      published: "default",
      failed: "destructive",
    };
    return variants[status as keyof typeof variants] || "secondary";
  };

  const getCharCount = (platform: SocialPlatform) => {
    const content = contents[platform] || "";
    const platformInfo = PLATFORMS.find(p => p.id === platform);
    return { current: content.length, max: platformInfo?.maxChars || 0 };
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Share2 className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-lg font-heading font-bold">Social Media Manager</h1>
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
              <TabsTrigger value="create">Vytvořit příspěvek</TabsTrigger>
              <TabsTrigger value="scheduled">Naplánované ({posts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-heading">Nový příspěvek</CardTitle>
                      <CardDescription>
                        AI vám pomůže napsat poutavý obsah na míru pro každou vybranou platformu. (1 kredit za platformu)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleGenerate} className="space-y-6">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Platformy (vyberte jednu nebo více)</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {PLATFORMS.map((info) => (
                                <div 
                                  key={info.id} 
                                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                    selectedPlatforms.includes(info.id as SocialPlatform) 
                                      ? "bg-primary/10 border-primary" 
                                      : "hover:bg-muted"
                                  }`}
                                  onClick={() => togglePlatform(info.id as SocialPlatform)}
                                >
                                  <Checkbox 
                                    checked={selectedPlatforms.includes(info.id as SocialPlatform)}
                                    onCheckedChange={() => togglePlatform(info.id as SocialPlatform)}
                                    id={`platform-${info.id}`}
                                  />
                                  <div className="grid gap-1.5 leading-none">
                                    <label
                                      htmlFor={`platform-${info.id}`}
                                      className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                                    >
                                      {info.icon} {info.name}
                                    </label>
                                    <p className="text-xs text-muted-foreground">
                                      {info.description}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="topic">Téma příspěvku</Label>
                            <Textarea
                              id="topic"
                              placeholder="Např. Oznámení nové funkce pro generování videí v naší aplikaci..."
                              value={topic}
                              onChange={(e) => setTopic(e.target.value)}
                              className="h-24"
                              required
                            />
                          </div>

                          <Button 
                            type="submit" 
                            className="w-full" 
                            disabled={generating || !topic.trim()}
                          >
                            {generating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generování...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Vygenerovat příspěvky AI
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  {selectedPlatforms.length > 0 && Object.keys(contents).length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="font-heading">Upravit a publikovat</CardTitle>
                        <CardDescription>
                          Upravte vygenerovaný obsah a přidejte média
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue={selectedPlatforms[0]} className="space-y-4">
                          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${selectedPlatforms.length}, 1fr)` }}>
                            {selectedPlatforms.map((plat) => (
                              <TabsTrigger key={plat} value={plat}>
                                {PLATFORMS.find(p => p.id === plat)?.icon} {PLATFORMS.find(p => p.id === plat)?.name}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          {selectedPlatforms.map((plat) => {
                            const charCount = getCharCount(plat);
                            const isNearLimit = charCount.current > charCount.max * 0.9;
                            const isGeneratingImageForThis = generatingMedia?.platform === plat && generatingMedia?.type === 'image';
                            const isGeneratingVideoForThis = generatingMedia?.platform === plat && generatingMedia?.type === 'video';

                            return (
                              <TabsContent key={plat} value={plat} className="space-y-4">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <Label>Text příspěvku</Label>
                                    <span className={`text-xs ${isNearLimit ? "text-destructive" : "text-muted-foreground"}`}>
                                      {charCount.current} / {charCount.max}
                                    </span>
                                  </div>
                                  <Textarea
                                    value={contents[plat] || ""}
                                    onChange={(e) => handleContentChange(plat, e.target.value)}
                                    rows={8}
                                    placeholder="Text příspěvku..."
                                  />
                                </div>

                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label>
                                      <ImageIcon className="h-4 w-4 inline mr-2" />
                                      Obrázek
                                    </Label>
                                    <div className="flex gap-2">
                                      <Input
                                        type="url"
                                        placeholder="URL obrázku nebo vygenerujte AI..."
                                        value={imageUrls[plat] || ""}
                                        onChange={(e) => handleMediaChange(plat, "image", e.target.value)}
                                        className="flex-1"
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => openImageGenerator(plat)}
                                        disabled={isGeneratingImageForThis}
                                      >
                                        {isGeneratingImageForThis ? (
                                          <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Generování...
                                          </>
                                        ) : (
                                          <>
                                            <Wand2 className="h-4 w-4 mr-2" />
                                            AI Generovat
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                    {imageUrls[plat] && (
                                      <div className="relative rounded-lg overflow-hidden border">
                                        <img 
                                          src={imageUrls[plat]} 
                                          alt="Preview" 
                                          className="w-full h-48 object-cover"
                                          onError={(e) => {
                                            e.currentTarget.src = "";
                                            e.currentTarget.alt = "Chyba načítání obrázku";
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-2">
                                    <Label>
                                      <Video className="h-4 w-4 inline mr-2" />
                                      Video URL
                                    </Label>
                                    <Input
                                      type="url"
                                      placeholder="https://..."
                                      value={videoUrls[plat] || ""}
                                      onChange={(e) => handleMediaChange(plat, "video", e.target.value)}
                                    />
                                    {videoUrls[plat] && (
                                      <div className="relative rounded-lg overflow-hidden border bg-black">
                                        <video 
                                          src={videoUrls[plat]} 
                                          controls 
                                          className="w-full h-48"
                                          onError={(e) => {
                                            console.error("Error loading video");
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TabsContent>
                            );
                          })}
                        </Tabs>

                        <form onSubmit={handleSchedule} className="space-y-4 mt-6">
                          <div className="space-y-2">
                            <Label htmlFor="schedule">Naplánovat (volitelné)</Label>
                            <Input
                              id="schedule"
                              type="datetime-local"
                              onChange={(e) => setScheduledTime(e.target.value ? new Date(e.target.value) : undefined)}
                            />
                          </div>

                          <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Ukládání...
                              </>
                            ) : (
                              <>
                                <Calendar className="h-4 w-4 mr-2" />
                                {scheduledTime ? "Naplánovat příspěvky" : "Uložit jako koncept"}
                              </>
                            )}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Náhledy</CardTitle>
                    <CardDescription>
                      Jak budou příspěvky vypadat na vybraných sítích
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-12 bg-muted/30 py-8">
                    {selectedPlatforms.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        Zatím nemáte vybrané žádné platformy pro náhled.
                      </div>
                    ) : (
                      selectedPlatforms.map(platform => (
                        <div key={platform} className="space-y-4">
                          <div className="flex items-center justify-center gap-2 font-semibold">
                            <span className="text-2xl">{PLATFORMS.find(p => p.id === platform)?.icon}</span>
                            {PLATFORMS.find(p => p.id === platform)?.name}
                          </div>
                          <div className="flex justify-center">
                            <SocialPreview 
                              platform={platform} 
                              content={previewContents[platform] || "Text příspěvku se zobrazí zde..."} 
                              imageUrl={imageUrls[platform]}
                              videoUrl={videoUrls[platform]}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Všechny příspěvky</CardTitle>
                  <CardDescription>
                    Koncepty, naplánované a publikované příspěvky
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {posts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Zatím nemáte žádné příspěvky
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Platforma</TableHead>
                          <TableHead>Obsah</TableHead>
                          <TableHead>Média</TableHead>
                          <TableHead>Stav</TableHead>
                          <TableHead>Plánováno</TableHead>
                          <TableHead className="text-right">Akce</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {posts.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{PLATFORMS.find(p => p.id === post.platform)?.icon}</span>
                                <span className="text-sm">{PLATFORMS.find(p => p.id === post.platform)?.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {post.content}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {post.image_url && <Badge variant="secondary"><ImageIcon className="h-3 w-3" /></Badge>}
                                {post.video_url && <Badge variant="secondary"><Video className="h-3 w-3" /></Badge>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadge(post.status) as any}>
                                {post.status === "draft" && "Koncept"}
                                {post.status === "scheduled" && "Naplánováno"}
                                {post.status === "published" && "Publikováno"}
                                {post.status === "failed" && "Chyba"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {post.scheduled_time
                                ? new Date(post.scheduled_time).toLocaleString("cs-CZ")
                                : "—"
                              }
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePreview(post)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeletePost(post.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Preview Dialog */}
          <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Náhled příspěvku</DialogTitle>
                <DialogDescription>
                  Jak bude příspěvek vypadat na {previewPost && PLATFORMS.find(p => p.id === previewPost.platform)?.name}
                </DialogDescription>
              </DialogHeader>
              {previewPost && (
                <div className="flex justify-center py-4">
                  <SocialPreview
                    platform={previewPost.platform as SocialPlatform}
                    content={previewPost.content}
                    imageUrl={previewPost.image_url}
                    videoUrl={previewPost.video_url}
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Image Generation Dialog */}
          <Dialog open={imageGenDialogOpen} onOpenChange={setImageGenDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Vygenerovat AI obrázek</DialogTitle>
                <DialogDescription>
                  Vytvořte jedinečný obrázek pro váš příspěvek pomocí AI (1 kredit)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="image-prompt">Popis obrázku</Label>
                  <Textarea
                    id="image-prompt"
                    placeholder="Popište, jaký obrázek chcete vygenerovat..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="image-model">AI Model</Label>
                    <Select value={imageModel} onValueChange={setImageModel}>
                      <SelectTrigger id="image-model">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dall-e-3">DALL-E 3 (nejlepší kvalita)</SelectItem>
                        <SelectItem value="dall-e-2">DALL-E 2 (rychlejší)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image-size">Velikost</Label>
                    <Select value={imageSize} onValueChange={setImageSize}>
                      <SelectTrigger id="image-size">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1024x1024">Čtverec (1024x1024)</SelectItem>
                        <SelectItem value="1024x1792">Výška (1024x1792)</SelectItem>
                        <SelectItem value="1792x1024">Šířka (1792x1024)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button 
                  onClick={handleGenerateImage} 
                  className="w-full"
                  disabled={!imagePrompt.trim() || !!generatingMedia}
                >
                  {generatingMedia ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generování...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Vygenerovat obrázek
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </AuthGuard>
  );
}