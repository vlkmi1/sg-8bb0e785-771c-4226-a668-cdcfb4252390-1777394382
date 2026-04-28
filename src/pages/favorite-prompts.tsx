import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Star, Plus, Search, Trash2, Edit2, Copy, LogOut, Sparkles, Tag, TrendingUp, Clock, MessageSquare, ImageIcon, Video, Mic, Megaphone, FileText, Coins
} from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { favoritePromptsService, type FavoritePrompt, type PromptCategory } from "@/services/favoritePromptsService";
import { creditsService } from "@/services/creditsService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ModuleHeader } from "@/components/ModuleHeader";

const CATEGORIES = [
  { id: "chat", name: "Chat", icon: MessageSquare },
  { id: "image", name: "Obrázky", icon: ImageIcon },
  { id: "video", name: "Videa", icon: Video },
  { id: "voice", name: "Hlas", icon: Mic },
  { id: "ad", name: "Reklamy", icon: Megaphone },
  { id: "summary", name: "Shrnutí", icon: FileText },
  { id: "general", name: "Obecné", icon: Sparkles },
];

export default function FavoritePrompts() {
  const router = useRouter();
  const { toast } = useToast();
  const [prompts, setPrompts] = useState<FavoritePrompt[]>([]);
  const [filteredPrompts, setFilteredPrompts] = useState<FavoritePrompt[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<FavoritePrompt | null>(null);
  const [credits, setCredits] = useState(0);
  
  // Form state
  const [title, setTitle] = useState("");
  const [promptText, setPromptText] = useState("");
  const [category, setCategory] = useState<PromptCategory>("general");
  const [tags, setTags] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadPrompts();
    loadCredits();
  }, []);

  useEffect(() => {
    filterPrompts();
  }, [prompts, searchQuery, selectedCategory]);

  const loadCredits = async () => {
    try {
      const userCredits = await creditsService.getCredits();
      setCredits(userCredits);
    } catch (error) {
      console.error("Error loading credits:", error);
    }
  };

  const loadPrompts = async () => {
    try {
      const data = await favoritePromptsService.getAllPrompts();
      setPrompts(data);
    } catch (error) {
      console.error("Error loading prompts:", error);
    }
  };

  const filterPrompts = () => {
    let filtered = prompts;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.prompt_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.tags || []).some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    setFilteredPrompts(filtered);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const tagsArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t);

      if (editingPrompt) {
        await favoritePromptsService.updatePrompt(editingPrompt.id, {
          title,
          prompt_text: promptText,
          category,
          tags: tagsArray,
          is_favorite: isFavorite,
        });
        toast({
          title: "Prompt aktualizován",
          description: "Změny byly uloženy",
        });
      } else {
        await favoritePromptsService.createPrompt({
          title,
          prompt_text: promptText,
          category,
          tags: tagsArray,
          is_favorite: isFavorite,
        });
        toast({
          title: "Prompt uložen",
          description: "Prompt byl přidán do oblíbených",
        });
      }

      resetForm();
      setDialogOpen(false);
      loadPrompts();
    } catch (error) {
      console.error("Error saving prompt:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit prompt",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (prompt: FavoritePrompt) => {
    setEditingPrompt(prompt);
    setTitle(prompt.title);
    setPromptText(prompt.prompt_text);
    setCategory(prompt.category as PromptCategory);
    setTags((prompt.tags || []).join(", "));
    setIsFavorite(prompt.is_favorite || false);
    setDialogOpen(true);
  };

  const handleDelete = async (promptId: string) => {
    if (!confirm("Opravdu chcete smazat tento prompt?")) return;

    try {
      await favoritePromptsService.deletePrompt(promptId);
      toast({
        title: "Prompt smazán",
        description: "Prompt byl odstraněn z oblíbených",
      });
      loadPrompts();
    } catch (error) {
      console.error("Error deleting prompt:", error);
    }
  };

  const handleToggleFavorite = async (prompt: FavoritePrompt) => {
    try {
      await favoritePromptsService.toggleFavorite(prompt.id);
      loadPrompts();
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleCopy = (promptText: string) => {
    navigator.clipboard.writeText(promptText);
    toast({
      title: "Zkopírováno",
      description: "Prompt byl zkopírován do schránky",
    });
  };

  const resetForm = () => {
    setEditingPrompt(null);
    setTitle("");
    setPromptText("");
    setCategory("general");
    setTags("");
    setIsFavorite(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const stats = {
    total: prompts.length,
    favorites: prompts.filter((p) => p.is_favorite).length,
    mostUsed: prompts.sort((a, b) => (b.use_count || 0) - (a.use_count || 0))[0],
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <ModuleHeader credits={credits} />

        <main className="container mx-auto px-4 py-8">
          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Celkem promptů</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Oblíbené</p>
                    <p className="text-2xl font-bold">{stats.favorites}</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Nejpoužívanější</p>
                    <p className="text-sm font-semibold truncate">
                      {stats.mostUsed?.title || "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats.mostUsed?.use_count || 0}× použito
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-accent" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Hledat prompty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as any)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všechny kategorie</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nový prompt
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingPrompt ? "Upravit prompt" : "Nový oblíbený prompt"}
                  </DialogTitle>
                  <DialogDescription>
                    Uložte si úspěšný prompt pro budoucí použití
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Název promptu</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Např. Profesionální produktový popis"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Kategorie</Label>
                    <Select value={category} onValueChange={(v) => setCategory(v as PromptCategory)}>
                      <SelectTrigger id="category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prompt">Text promptu</Label>
                    <Textarea
                      id="prompt"
                      value={promptText}
                      onChange={(e) => setPromptText(e.target.value)}
                      placeholder="Zadejte text promptu..."
                      rows={6}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tagy (oddělené čárkou)</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="marketing, e-commerce, profesionální"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="favorite"
                      checked={isFavorite}
                      onChange={(e) => setIsFavorite(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="favorite" className="cursor-pointer">
                      Označit jako oblíbený
                    </Label>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                      Zrušit
                    </Button>
                    <Button type="submit" className="flex-1">
                      {editingPrompt ? "Uložit změny" : "Vytvořit prompt"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Prompts Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrompts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Star className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">
                  {searchQuery || selectedCategory !== "all"
                    ? "Žádné prompty nenalezeny"
                    : "Zatím nemáte žádné uložené prompty"}
                </p>
                <p className="text-sm">
                  {searchQuery || selectedCategory !== "all"
                    ? "Zkuste změnit filtr nebo hledaný výraz"
                    : "Uložte si prompty pro rychlé použití"}
                </p>
              </div>
            ) : (
              filteredPrompts.map((prompt) => {
                const CategoryIcon = CATEGORIES.find((c) => c.id === prompt.category)?.icon || Sparkles;
                return (
                  <Card key={prompt.id} className="group">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-base">{prompt.title}</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleFavorite(prompt)}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              prompt.is_favorite
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </Button>
                      </div>
                      <CardDescription className="line-clamp-3">
                        {prompt.prompt_text}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {prompt.tags && prompt.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {prompt.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {prompt.use_count || 0}× použito
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(prompt.created_at).toLocaleDateString("cs-CZ")}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleCopy(prompt.prompt_text)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Kopírovat
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(prompt)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(prompt.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}