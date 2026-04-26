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
import { Checkbox } from "@/components/ui/checkbox";
import { Share2, Sparkles, LogOut, Trash2, Edit, Calendar, Clock, Loader2, ImageIcon, Coins, Settings, Eye } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("create");
  const [topic, setTopic] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(["facebook"]);
  const [contents, setContents] = useState<Partial<Record<SocialPlatform, string>>>({});
  const [previewContents, setPreviewContents] = useState<Partial<Record<SocialPlatform, string>>>({});
  const [loading, setLoading] = useState(false);
  const [scheduledTime, setScheduledTime] = useState<Date | undefined>(undefined);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [credits, setCredits] = useState(0);
  const [previewPost, setPreviewPost] = useState<SocialPost | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
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

    setLoading(true);
    try {
      const newContents: Partial<Record<SocialPlatform, string>> = {};
      
      // Vygenerujeme příspěvek pro každou vybranou platformu zvlášť
      await Promise.all(selectedPlatforms.map(async (plat) => {
        newContents[plat] = await socialPostsService.generateContent(plat, topic);
      }));

      setContents(newContents);
      setPreviewContents(newContents);
      
      const newCredits = await creditsService.deductCredits(selectedPlatforms.length);
      setCredits(newCredits);
      setActiveTab("preview");
    } catch (error) {
      console.error("Error generating post:", error);
      alert("Chyba při generování příspěvku. Zkontrolujte připojení a kredity.");
    } finally {
      setLoading(false);
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
          scheduled_time: scheduledTime ? scheduledTime.toISOString() : undefined,
        })
      ));

      await loadData();
      setActiveTab("scheduled");
      setTopic("");
      setContents({});
      setPreviewContents({});
      setScheduledTime(undefined);
    } catch (error) {
      console.error("Error scheduling posts:", error);
      alert("Chyba při plánování příspěvků.");
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (platform: SocialPlatform, value: string) => {
    setContents(prev => ({ ...prev, [platform]: value }));
    setPreviewContents(prev => ({ ...prev, [platform]: value }));
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
                      </div>
                    </form>
                  </CardContent>
                </Card>

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