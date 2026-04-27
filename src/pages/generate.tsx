import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageIcon, Sparkles, LogOut, Loader2, Coins } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ImageGallery } from "@/components/ImageGallery";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { imageGenerationService, type ImageProvider, type GeneratedImage } from "@/services/imageGenerationService";
import { creditsService } from "@/services/creditsService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const IMAGE_PROVIDERS = [
  { id: "openai", name: "DALL-E (OpenAI)", models: ["dall-e-3", "dall-e-2"] },
  { id: "stability", name: "Stable Diffusion", models: ["stable-diffusion-xl", "stable-diffusion-2"] },
  { id: "midjourney", name: "Midjourney", models: ["v6", "v5.2"] },
];

const IMAGE_SIZES = [
  { value: "1024x1024", label: "1024×1024 (Čtverec)" },
  { value: "1024x1792", label: "1024×1792 (Vertikální)" },
  { value: "1792x1024", label: "1792×1024 (Horizontální)" },
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
      alert("Nemáte dostatek kreditů. Generování obrázku stojí 2 kredity. Kontaktujte administrátora.");
      return;
    }

    setLoading(true);
    try {
      // Show user that generation takes time
      const loadingToast = toast({
        title: "Generování obrázku...",
        description: "To může trvat 15-30 sekund. Prosím čekejte.",
        duration: 30000, // 30 seconds
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
      
      // Show user-friendly error messages
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
        } else if (error.message.includes("Stability AI error")) {
          toast({
            title: "Chyba Stability AI",
            description: "API klíč je neplatný nebo vypršel. Kontaktujte administrátora.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Chyba při generování",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Chyba",
          description: "Nastala neočekávaná chyba při generování obrázku.",
          variant: "destructive",
        });
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-lg font-heading font-bold">Generování obrázků</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 rounded-lg border border-accent/20">
                  <Coins className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">{credits}</span>
                  <span className="text-xs text-muted-foreground">kreditů</span>
                </div>
                <ThemeSwitch />
                <Button variant="ghost" onClick={() => router.push("/")}>
                  Dashboard
                </Button>
                <Button variant="ghost" onClick={() => router.push("/chat")}>
                  Chat
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
              <TabsTrigger value="generate">Generovat</TabsTrigger>
              <TabsTrigger value="gallery">Galerie ({images.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-6">
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Vygenerujte obrázek pomocí AI
                  </CardTitle>
                  <CardDescription>
                    Popište, co chcete vytvořit, a AI vygeneruje obrázek podle vašeho popisu
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleGenerate} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="prompt">Popis obrázku (Prompt)</Label>
                      <Textarea
                        id="prompt"
                        placeholder="Například: Magický les s létajícími draky při západu slunce, digitální umění, vysoké detaily"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={4}
                        className="resize-none"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Tip: Buďte co nejkonkrétnější. Uveďte styl, náladu a detaily.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="provider">AI Model</Label>
                        <Select value={provider} onValueChange={(value) => setProvider(value as ImageProvider)}>
                          <SelectTrigger id="provider">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {IMAGE_PROVIDERS.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

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
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={loading || !prompt.trim()}>
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Generuji obrázek...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          Vygenerovat obrázek
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {images.length > 0 && (
                <div className="text-center">
                  <Button variant="outline" onClick={() => setActiveTab("gallery")}>
                    Zobrazit všechny obrázky ({images.length})
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="gallery">
              <ImageGallery images={images} onDelete={handleDelete} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  );
}