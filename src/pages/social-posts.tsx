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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Share2, Sparkles, LogOut, Loader2, Coins, Calendar, Trash2, Eye, Settings, ImageIcon } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { SocialPreview } from "@/components/SocialPreview";
import { socialPostsService, type SocialPlatform, type SocialPost, type SocialAccount } from "@/services/socialPostsService";
import { creditsService } from "@/services/creditsService";
import { supabase } from "@/integrations/supabase/client";

const PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: "📘", description: "Standardní příspěvek" },
  { id: "instagram", name: "Instagram", icon: "📷", description: "Fotka s popiskem" },
  { id: "linkedin", name: "LinkedIn", icon: "💼", description: "Profesionální post" },
  { id: "twitter", name: "Twitter/X", icon: "𝕏", description: "Tweet (max 280 znaků)" },
  { id: "youtube", name: "YouTube", icon: "📹", description: "Video popis a komunita" },
  { id: "tiktok", name: "TikTok", icon: "🎵", description: "Krátké video s textem" },
];

export default function SocialPosts() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<SocialPlatform>("facebook");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [credits, setCredits] = useState(0);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewPost, setPreviewPost] = useState<SocialPost | null>(null);

  useEffect(() => {
    loadCredits();
    loadPosts();
  }, []);

  const loadCredits = async () => {
    try {
      const userCredits = await creditsService.getCredits();
      setCredits(userCredits);
    } catch (error) {
      console.error("Error loading credits:", error);
    }
  };

  const loadPosts = async () => {
    try {
      const data = await socialPostsService.getPosts();
      setPosts(data);
    } catch (error) {
      console.error("Error loading posts:", error);
    }
  };

  const handleGenerateContent = async () => {
    if (!topic.trim()) return;

    if (credits < 1) {
      alert("Nemáte dostatek kreditů. Kontaktujte administrátora.");
      return;
    }

    setGenerating(true);
    try {
      const generatedContent = await socialPostsService.generateContent(topic, platform);
      setContent(generatedContent);

      const newCredits = await creditsService.deductCredits(1);
      setCredits(newCredits);
    } catch (error) {
      console.error("Error generating content:", error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    try {
      await socialPostsService.createPost({
        platform,
        content: content.trim(),
        image_url: imageUrl || undefined,
        scheduled_time: scheduledTime || undefined,
      });

      await loadPosts();
      setContent("");
      setImageUrl("");
      setScheduledTime("");
      setTopic("");
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Opravdu chcete smazat tento příspěvek?")) return;

    try {
      await socialPostsService.deletePost(id);
      await loadPosts();
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
          <Tabs defaultValue="create" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="create">Vytvořit příspěvek</TabsTrigger>
              <TabsTrigger value="scheduled">Naplánované ({posts.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Nový příspěvek</CardTitle>
                    <CardDescription>
                      Vygenerujte obsah pomocí AI nebo napište vlastní text
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreatePost} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="platform">Sociální síť</Label>
                        <Select value={platform} onValueChange={(v) => setPlatform(v as SocialPlatform)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(PLATFORM_INFO).map(([key, info]) => (
                              <SelectItem key={key} value={key}>
                                <span className="flex items-center gap-2">
                                  <span>{info.icon}</span>
                                  {info.name}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="topic">Téma pro AI generování (volitelné)</Label>
                        <div className="flex gap-2">
                          <Input
                            id="topic"
                            placeholder="např. Nový produkt, Tip dne..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                          />
                          <Button
                            type="button"
                            onClick={handleGenerateContent}
                            disabled={generating || !topic.trim()}
                          >
                            {generating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generovat
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">1 kredit za generování</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="content">Obsah příspěvku</Label>
                        <Textarea
                          id="content"
                          placeholder="Text příspěvku..."
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          rows={6}
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          {content.length} znaků
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="imageUrl">URL obrázku (volitelné)</Label>
                        <Input
                          id="imageUrl"
                          type="url"
                          placeholder="https://..."
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="scheduledTime">Naplánovat na (volitelné)</Label>
                        <Input
                          id="scheduledTime"
                          type="datetime-local"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={loading || !content.trim()}>
                        {loading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Calendar className="h-4 w-4 mr-2" />
                        )}
                        {scheduledTime ? "Naplánovat příspěvek" : "Uložit jako koncept"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading">Náhled</CardTitle>
                    <CardDescription>
                      Jak bude příspěvek vypadat na {PLATFORM_INFO[platform].name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center">
                    <SocialPreview
                      platform={platform}
                      content={content || "Text příspěvku se zobrazí zde..."}
                      imageUrl={imageUrl}
                    />
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
                    imageUrl={previewPost.image_url || undefined}
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </AuthGuard>
  );
}