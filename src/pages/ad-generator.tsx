import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Megaphone, Sparkles, LogOut, Loader2, Coins, Copy, Trash2, Download, Star } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { adGeneratorService, type AdGeneration } from "@/services/adGeneratorService";
import { creditsService } from "@/services/creditsService";
import { favoritePromptsService } from "@/services/favoritePromptsService";
import { PromptSelector } from "@/components/PromptSelector";
import { authState } from "@/services/authStateService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AI_MODELS = [
  { id: "gpt-4", name: "GPT-4" },
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
  { id: "claude-3-opus", name: "Claude 3 Opus" },
  { id: "claude-3-sonnet", name: "Claude 3 Sonnet" },
];

const PLATFORMS = [
  { value: "facebook", label: "Facebook", icon: "📘" },
  { value: "instagram", label: "Instagram", icon: "📷" },
  { value: "linkedin", label: "LinkedIn", icon: "💼" },
  { value: "google", label: "Google Ads", icon: "🔍" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
];

const AD_FORMATS = [
  { value: "carousel", label: "Carousel (více obrázků)" },
  { value: "single_image", label: "Jeden obrázek" },
  { value: "video", label: "Video" },
  { value: "story", label: "Story" },
];

export default function AdGenerator() {
  const router = useRouter();
  const { toast } = useToast();
  const [productDescription, setProductDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [platform, setPlatform] = useState("facebook");
  const [adFormat, setAdFormat] = useState("single_image");
  const [model, setModel] = useState("gpt-4");
  const [loading, setLoading] = useState(false);
  const [ads, setAds] = useState<AdGeneration[]>([]);
  const [activeTab, setActiveTab] = useState("generate");
  const [credits, setCredits] = useState(0);
  const [copiedField, setCopiedField] = useState<string>("");

  useEffect(() => {
    loadCredits();
    loadAds();
  }, []);

  const loadCredits = async () => {
    try {
      const userCredits = await creditsService.getCredits();
      setCredits(userCredits);
    } catch (error) {
      console.error("Error loading credits:", error);
    }
  };

  const loadAds = async () => {
    try {
      const data = await adGeneratorService.getAds();
      setAds(data);
    } catch (error) {
      console.error("Error loading ads:", error);
    }
  };

  const handleSavePrompt = async () => {
    if (!productDescription.trim()) return;

    const fullPrompt = `Produkt: ${productDescription}${targetAudience ? `\nCílová skupina: ${targetAudience}` : ""}`;
    
    try {
      await favoritePromptsService.createPrompt({
        title: productDescription.slice(0, 50) + (productDescription.length > 50 ? "..." : ""),
        prompt_text: fullPrompt,
        category: "ad",
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
    // Parse prompt text - format: "Produkt: XXX\nCílová skupina: YYY"
    const lines = promptText.split("\n");
    const productLine = lines.find(l => l.startsWith("Produkt:"));
    const audienceLine = lines.find(l => l.startsWith("Cílová skupina:"));
    
    if (productLine) {
      setProductDescription(productLine.replace("Produkt:", "").trim());
    }
    if (audienceLine) {
      setTargetAudience(audienceLine.replace("Cílová skupina:", "").trim());
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!productDescription.trim()) return;

    if (credits < 3) {
      toast({
        title: "Nedostatek kreditů",
        description: "Generování reklamy stojí 3 kredity",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const user = await authState.getUser();
      if (!user) throw new Error("Not authenticated");

      const response = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productDescription: productDescription.trim(),
          targetAudience: targetAudience.trim(),
          platform,
          adFormat,
          model,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate ad");
      }

      const adContent = await response.json();

      await adGeneratorService.createAd({
        productDescription: productDescription.trim(),
        targetAudience: targetAudience.trim(),
        platform,
        adFormat,
        headline: adContent.headline,
        description: adContent.description,
        cta: adContent.cta,
        hashtags: adContent.hashtags,
        imageSuggestions: adContent.imageSuggestions,
        modelUsed: model,
      });

      await loadCredits();
      await loadAds();
      setProductDescription("");
      setTargetAudience("");
      setActiveTab("history");

      toast({
        title: "Reklama vygenerována",
        description: "Reklamní copy byl úspěšně vytvořen",
      });
    } catch (error: any) {
      console.error("Error generating ad:", error);
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adGeneratorService.deleteAd(id);
      await loadAds();
      toast({ title: "Reklama smazána" });
    } catch (error) {
      console.error("Error deleting ad:", error);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(""), 2000);
      toast({ title: "Zkopírováno", description: "Text byl zkopírován do schránky" });
    } catch (error) {
      console.error("Error copying:", error);
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
                  <Megaphone className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-lg font-heading font-bold">Generátor reklam</h1>
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
              <TabsTrigger value="create">Vytvořit reklamu</TabsTrigger>
              <TabsTrigger value="history">Historie ({ads.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6">
              <Card className="max-w-3xl mx-auto">
                <CardHeader>
                  <CardTitle className="font-heading flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Generátor reklam
                  </CardTitle>
                  <CardDescription>
                    Vytvořte kompletní reklamní kampaň včetně headline, popisu, CTA a hashtagů
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="product">Popis produktu/služby</Label>
                        <div className="flex gap-2">
                          <PromptSelector category="ad" onSelect={handleLoadPrompt} />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleSavePrompt}
                            disabled={!productDescription.trim()}
                          >
                            <Star className="h-4 w-4 mr-1" />
                            Uložit
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        id="product"
                        placeholder="Např.: Ekologické bambusové kartáčky na zuby s měkkými štětinami, 100% biologicky rozložitelné..."
                        value={productDescription}
                        onChange={(e) => setProductDescription(e.target.value)}
                        rows={4}
                        className="resize-none"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="audience">Cílová skupina (nepovinné)</Label>
                      <Input
                        id="audience"
                        placeholder="Např.: Environmentálně uvědomělí lidé 25-45 let"
                        value={targetAudience}
                        onChange={(e) => setTargetAudience(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="platform">Platforma</Label>
                        <Select value={platform} onValueChange={(v) => setPlatform(v)}>
                          <SelectTrigger id="platform">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PLATFORMS.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                {p.icon} {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="format">Formát reklamy</Label>
                        <Select value={adFormat} onValueChange={(v) => setAdFormat(v)}>
                          <SelectTrigger id="format">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AD_FORMATS.map((f) => (
                              <SelectItem key={f.value} value={f.value}>
                                {f.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="model">AI Model</Label>
                      <Select value={model} onValueChange={setModel}>
                        <SelectTrigger id="model">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AI_MODELS.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={loading || !productDescription.trim()}>
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Generuji reklamu...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-2" />
                          Vygenerovat reklamu (3 kredity)
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <div className="max-w-4xl mx-auto space-y-4">
                {ads.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Žádné reklamy</h3>
                      <p className="text-muted-foreground mb-4">
                        Vytvořte svou první AI reklamu
                      </p>
                      <Button onClick={() => setActiveTab("create")}>
                        Vytvořit reklamu
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  ads.map((ad) => (
                    <Card key={ad.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="font-heading text-base">
                                {PLATFORMS.find(p => p.value === ad.platform)?.icon}{" "}
                                {PLATFORMS.find(p => p.value === ad.platform)?.label} - {AD_FORMATS.find(f => f.value === ad.ad_format)?.label}
                              </CardTitle>
                            </div>
                            <CardDescription className="text-xs">
                              Model: {ad.model_used} • {new Date(ad.created_at).toLocaleDateString("cs-CZ")}
                            </CardDescription>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(ad.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-xs font-semibold text-muted-foreground">HEADLINE</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(ad.headline, `headline-${ad.id}`)}
                              >
                                {copiedField === `headline-${ad.id}` ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <p className="text-sm font-semibold">{ad.headline}</p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-xs font-semibold text-muted-foreground">POPIS</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(ad.description, `desc-${ad.id}`)}
                              >
                                {copiedField === `desc-${ad.id}` ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <p className="text-sm">{ad.description}</p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-xs font-semibold text-muted-foreground">CTA</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(ad.cta, `cta-${ad.id}`)}
                              >
                                {copiedField === `cta-${ad.id}` ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <p className="text-sm font-medium text-primary">{ad.cta}</p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-xs font-semibold text-muted-foreground">HASHTAGS</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(ad.hashtags, `tags-${ad.id}`)}
                              >
                                {copiedField === `tags-${ad.id}` ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">{ad.hashtags}</p>
                          </div>

                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground mb-1">NÁVRHY VIZUÁLŮ</h4>
                            <p className="text-xs whitespace-pre-line">{ad.image_suggestions}</p>
                          </div>
                        </div>

                        <details className="text-sm">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Zobrazit brief
                          </summary>
                          <div className="mt-2 p-4 bg-muted rounded-lg space-y-2 text-xs">
                            <div>
                              <strong>Produkt:</strong> {ad.product_description}
                            </div>
                            {ad.target_audience && (
                              <div>
                                <strong>Cílová skupina:</strong> {ad.target_audience}
                              </div>
                            )}
                          </div>
                        </details>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  );
}