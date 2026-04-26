import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Brain, 
  ImageIcon, 
  Video, 
  Mic, 
  Share2, 
  User, 
  Music,
  Sparkles,
  ArrowRight,
  Check,
  Zap,
  Globe,
  Shield,
  Star,
  TrendingUp,
  Users,
  Crown,
  ChevronRight
} from "lucide-react";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { supabase } from "@/integrations/supabase/client";

const FEATURES = [
  {
    icon: Brain,
    title: "AI Chat",
    description: "Konverzujte s nejpokročilejšími AI modely světa",
    models: "GPT-4, Claude 3, Gemini, Nano Bannana",
    gradient: "from-primary/20 to-secondary/20",
    color: "text-primary"
  },
  {
    icon: ImageIcon,
    title: "Generování obrázků",
    description: "Vytvořte úžasné vizuály pomocí AI za sekundy",
    models: "DALL-E, Stable Diffusion, Midjourney",
    gradient: "from-accent/20 to-primary/20",
    color: "text-accent"
  },
  {
    icon: Video,
    title: "Generování videí",
    description: "Produkujte profesionální videa s AI",
    models: "RunwayML, Pika Labs, Stability Video",
    gradient: "from-secondary/20 to-accent/20",
    color: "text-secondary"
  },
  {
    icon: Mic,
    title: "Hlasový chat",
    description: "Mluvte s AI v reálném čase jako s člověkem",
    models: "OpenAI Whisper, ElevenLabs, Google TTS",
    gradient: "from-primary/20 to-accent/20",
    color: "text-primary"
  },
  {
    icon: Share2,
    title: "Social Media Manager",
    description: "Automatizujte příspěvky na 6 sociálních sítích",
    models: "Facebook, Instagram, LinkedIn, Twitter, YouTube, TikTok",
    gradient: "from-secondary/20 to-primary/20",
    color: "text-secondary"
  },
  {
    icon: User,
    title: "AI Influencer",
    description: "Vytvořte vlastního virtuálního influencera",
    models: "HeyGen, D-ID, Synthesia, Runway Gen-2",
    gradient: "from-accent/20 to-secondary/20",
    color: "text-accent"
  },
  {
    icon: Music,
    title: "Music Generator",
    description: "Komponujte originální hudbu pomocí AI",
    models: "Suno AI, MusicGen, Mubert, AIVA",
    gradient: "from-primary/20 to-secondary/20",
    color: "text-primary"
  },
];

const STATS = [
  { value: "21+", label: "AI Modelů" },
  { value: "7", label: "Modulů" },
  { value: "6", label: "Sociálních sítí" },
  { value: "24/7", label: "Dostupnost" },
];

const PRICING_TIERS = [
  {
    name: "Free",
    price: "0",
    period: "měsíc",
    credits: "50",
    features: [
      "AI Chat",
      "50 kreditů/měsíc",
      "Základní modely",
      "Email podpora"
    ],
    cta: "Začít zdarma",
    popular: false
  },
  {
    name: "Pro",
    price: "449",
    period: "měsíc",
    credits: "300",
    features: [
      "Všechny funkce Free",
      "300 kreditů/měsíc",
      "Generování obrázků & videí",
      "Hlasový chat",
      "Social Media Manager",
      "Prioritní podpora"
    ],
    cta: "Začít teď",
    popular: true
  },
  {
    name: "Enterprise",
    price: "1199",
    period: "měsíc",
    credits: "∞",
    features: [
      "Všechny funkce Pro",
      "Neomezené kredity",
      "AI Influencer",
      "Music Generator",
      "Všechny premium modely",
      "Dedikovaná podpora"
    ],
    cta: "Kontaktovat",
    popular: false
  },
];

const BENEFITS = [
  {
    icon: Zap,
    title: "Bleskově rychlé",
    description: "Všechny AI modely v jednom místě bez přepínání"
  },
  {
    icon: Shield,
    title: "100% bezpečné",
    description: "Vaše data jsou šifrována a nikdy se nesdílí"
  },
  {
    icon: Globe,
    title: "Vždy dostupné",
    description: "Cloudová platforma dostupná odkudkoliv, kdykoliv"
  },
  {
    icon: TrendingUp,
    title: "Průběžně vylepšováno",
    description: "Každý týden nové funkce a AI modely"
  },
];

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
    setLoading(false);
  };

  const handleCTA = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/auth/register");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Načítání...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-heading font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              kAIkus
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeSwitch />
            {isLoggedIn ? (
              <Button onClick={() => router.push("/dashboard")}>
                Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => router.push("/auth/login")}>
                  Přihlásit se
                </Button>
                <Button onClick={() => router.push("/auth/register")}>
                  Začít zdarma
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 -z-10" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10 -z-10" />
        
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              21+ AI modelů na jednom místě
            </Badge>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold leading-tight">
              Váš kompletní{" "}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                AI ekosystém
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
              Spojte sílu GPT-4, Claude, Gemini, DALL-E, Stable Diffusion a dalších špičkových AI modelů v jediné platformě.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" onClick={handleCTA} className="text-lg h-14 px-8">
                <Sparkles className="mr-2 h-5 w-5" />
                Začít zdarma
              </Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-lg h-14 px-8">
                Prozkoumat funkce
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 max-w-3xl mx-auto">
              {STATS.map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4">
              <Star className="h-3 w-3 mr-1" />
              7 výkonných modulů
            </Badge>
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">
              Všechno co potřebujete pro AI práci
            </h2>
            <p className="text-lg text-muted-foreground">
              Od konverzací přes tvorbu obsahu až po automatizaci sociálních sítí
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
            {FEATURES.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <Card key={idx} className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity -z-10`} />
                  <CardHeader>
                    <div className={`p-3 bg-gradient-to-br ${feature.gradient} rounded-xl w-fit mb-4`}>
                      <Icon className={`h-8 w-8 ${feature.color}`} />
                    </div>
                    <CardTitle className="font-heading text-xl">{feature.title}</CardTitle>
                    <CardDescription className="text-base">{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold">Podporované modely:</span>
                      <p className="mt-1">{feature.models}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {BENEFITS.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx} className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="secondary" className="mb-4">
              <Crown className="h-3 w-3 mr-1" />
              Flexibilní ceny
            </Badge>
            <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">
              Vyberte si plán podle vašich potřeb
            </h2>
            <p className="text-lg text-muted-foreground">
              Začněte zdarma nebo získejte plný přístup k AI superschopnostem
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
            {PRICING_TIERS.map((tier, idx) => (
              <Card key={idx} className={`relative ${tier.popular ? 'border-primary border-2 shadow-2xl scale-105' : ''}`}>
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-secondary text-white">
                      <Star className="h-3 w-3 mr-1" />
                      Nejoblíbenější
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl font-heading mb-2">{tier.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-5xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground ml-2">Kč/{tier.period}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {tier.credits} kreditů/měsíc
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={tier.popular ? "default" : "outline"}
                    onClick={handleCTA}
                  >
                    {tier.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Všechny plány zahrnují přístup k základním funkcím. Kredity lze kdykoliv dobít.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-10 -z-10" />
        
        <div className="container mx-auto px-6">
          <Card className="max-w-4xl mx-auto border-2 border-primary/20 shadow-2xl">
            <CardContent className="p-12 text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mb-6">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              
              <h2 className="text-3xl md:text-4xl font-heading font-bold">
                Připraveni revolucionizovat svou práci s AI?
              </h2>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Připojte se k tisícům uživatelů, kteří už využívají kAIkus pro zvýšení produktivity a kreativity
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button size="lg" onClick={handleCTA} className="text-lg h-14 px-8">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Začít používat kAIkus
                </Button>
                <Button size="lg" variant="outline" onClick={() => router.push("/pricing")} className="text-lg h-14 px-8">
                  Zobrazit ceny
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-6">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-heading font-bold">kAIkus</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Kompletní AI platforma pro moderní tvůrce a podnikatele.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">Funkce</a></li>
                <li><a href="/pricing" className="hover:text-primary transition-colors">Ceny</a></li>
                <li><a href="/auth/register" className="hover:text-primary transition-colors">Začít zdarma</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Moduly</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>AI Chat</li>
                <li>Generování obrázků</li>
                <li>Generování videí</li>
                <li>Hlasový chat</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Podpora</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Dokumentace</li>
                <li>Email podpora</li>
                <li>Časté otázky</li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2026 kAIkus. Všechna práva vyhrazena.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}