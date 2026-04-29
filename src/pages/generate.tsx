import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ImageIcon, Sparkles, Loader2, Wand2, Download, Trash2, Edit3, Star, Menu, Home, Grid3x3 } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { imageGenerationService, type ImageProvider, type GeneratedImage } from "@/services/imageGenerationService";
import { creditsService } from "@/services/creditsService";
import { favoritePromptsService } from "@/services/favoritePromptsService";
import { PromptSelector } from "@/components/PromptSelector";
import { UserMenu } from "@/components/UserMenu";
import { useToast } from "@/hooks/use-toast";

const IMAGE_PROVIDERS = [
  { id: "openai", name: "DALL-E", icon: "🎨" },
  { id: "stability", name: "Stable Diffusion", icon: "🖼️" },
  { id: "midjourney", name: "Midjourney", icon: "✨" },
];

const IMAGE_SIZES = [
  { value: "1024x1024", label: "Čtverec" },
  { value: "1024x1792", label: "Vertikální" },
  { value: "1792x1024", label: "Horizontální" },
];

export default function Generate() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState<ImageProvider>("openai");
  const [size, setSize] = useState("1024x1024");
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [activeTab, setActiveTab] = useState("generate");
  const [credits, setCredits] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadImages();
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

  const loadImages = async () => {
    try {
      const data = await imageGenerationService.getGeneratedImages();
      setImages(data);
    } catch (error) {
      console.error("Error loading images:", error);
    }
  };

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    if (credits < 2) {
      toast({
        title: "Nedostatek kreditů",
        description: "Generování obrázku stojí 2 kredity. Doplňte si kredity.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const loadingToast = toast({
        title: "Generování obrázku...",
        description: "To může trvat 15-30 sekund. Prosím čekejte.",
        duration: 30000,
      });

      await imageGenerationService.generateImage({
        prompt: prompt.trim(),
        provider,
        size,
      });

      loadingToast.dismiss();

      const newCredits = await creditsService.getCredits();
      setCredits(newCredits);
      
      await loadImages();
      setPrompt("");
      setActiveTab("gallery");

      toast({
        title: "Úspěch!",
        description: "Obrázek byl vygenerován",
      });
    } catch (error) {
      console.error("Error generating image:", error);
      
      if (error instanceof Error) {
        if (error.message.includes("No API key")) {
          toast({
            title: "Chybí API klíč",
            description: `Není nastaven API klíč pro ${provider}. Kontaktujte administrátora.`,
            variant: "destructive",
          });
        } else if (error.message.includes("Insufficient credits")) {
          toast({
            title: "Nedostatek kreditů",
            description: "Nemáte dostatek kreditů. Kontaktujte administrátora.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Chyba při generování",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (imageId: string) => {
    try {
      await imageGenerationService.deleteImage(imageId);
      await loadImages();
    } catch (error) {
      console.error("Error deleting image:", error);
    }
  };

  const handleSavePrompt = async () => {
    if (!prompt.trim()) return;

    try {
      await favoritePromptsService.createPrompt({
        title: prompt.slice(0, 50) + (prompt.length > 50 ? "..." : ""),
        prompt_text: prompt,
        category: "image",
      });
      toast({
        title: "Prompt uložen",
        description: "Prompt byl přidán do oblíbených",
      });
    } catch (error) {
      console.error("Error saving prompt:", error);
    }
  };

  const handleLoadPrompt = (promptText: string) => {
    setPrompt(promptText);
    setMenuOpen(false);
  };

  return (
    <AuthGuard>
      {/* Mobile/PWA Fullscreen Layout */}
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card shrink-0">
          <div className="flex items-center gap-2">
            {/* Menu Button with Gallery */}
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="font-heading flex items-center gap-2">
                    <Grid3x3 className="h-5 w-5" />
                    Galerie ({images.length})
                  </SheetTitle>
                </SheetHeader>
                
                {/* Images Grid */}
                <div className="flex-1 overflow-y-auto p-3">
                  {images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        Zatím nemáte žádné obrázky
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {images.map((image) => (
                        <div 
                          key={image.id}
                          className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                          onClick={() => {
                            router.push({
                              pathname: "/image-editor",
                              query: {
                                imageUrl: image.image_url,
                                imageId: image.id,
                              },
                            });
                            setMenuOpen(false);
                          }}
                        >
                          <img
                            src={image.image_url}
                            alt={image.prompt}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push({
                                  pathname: "/image-editor",
                                  query: {
                                    imageUrl: image.image_url,
                                    imageId: image.id,
                                  },
                                });
                              }}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(image.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Close Button */}
                <div className="p-4 border-t bg-muted/30">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setMenuOpen(false)}
                  >
                    Zavřít a pokračovat
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Dashboard Button */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.push("/dashboard")}
            >
              <Home className="h-5 w-5" />
            </Button>
          </div>

          {/* Right Side - User Menu */}
          <UserMenu credits={credits} showCredits={false} />
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center mb-4 mx-auto">
                <ImageIcon className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-heading font-bold">
                AI Generování Obrázků
              </h1>
              <p className="text-muted-foreground">
                Popište, co chcete vytvořit
              </p>
            </div>

            {/* Generation Form */}
            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Prompt Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prompt">Popis obrázku</Label>
                  <div className="flex gap-2">
                    <PromptSelector category="image" onSelect={handleLoadPrompt} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSavePrompt}
                      disabled={!prompt.trim()}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Textarea
                  id="prompt"
                  placeholder="Například: Magický les s létajícími draky při západu slunce, digitální umění, vysoké detaily"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="resize-none"
                  required
                />
              </div>

              {/* Provider Selection - Pills */}
              <div className="space-y-3">
                <Label>AI Model</Label>
                <div className="flex flex-wrap gap-2">
                  {IMAGE_PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProvider(p.id as ImageProvider)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                        provider === p.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <span>{p.icon}</span>
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div className="space-y-2">
                <Label htmlFor="size">Velikost</Label>
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger id="size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMAGE_SIZES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full h-12" size="lg" disabled={loading || !prompt.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generuji...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Vygenerovat obrázek
                  </>
                )}
              </Button>

              {/* Cost Info */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Wand2 className="h-4 w-4" />
                <span>2 kredity za obrázek</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}