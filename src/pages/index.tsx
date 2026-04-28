import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  MessageSquare, 
  Wand2, 
  Crown, 
  Sparkles, 
  ArrowRight,
  Video,
  Mic,
  Share2,
  User,
  Music,
  FileText,
  Image as ImageIcon,
  Megaphone,
  Edit3,
  Star,
  Bot,
  TrendingUp,
  Zap,
  Shield,
  ChevronDown
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { supabase } from "@/integrations/supabase/client";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
  };

  const features = [
    {
      icon: MessageSquare,
      title: "AI Chat",
      description: "Komunikujte s GPT-4, Claude, Gemini a dalšími modely",
      href: "/chat",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      icon: Wand2,
      title: "Generování obrázků",
      description: "Vytvářejte úžasné AI obrázky pomocí DALL-E a Stable Diffusion",
      href: "/generate",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    },
    {
      icon: Video,
      title: "AI Video",
      description: "Generujte virální krátká videa pro sociální sítě",
      href: "/viral-videos",
      color: "text-pink-500",
      bgColor: "bg-pink-500/10"
    },
    {
      icon: User,
      title: "AI Influencer",
      description: "Vytvořte si vlastního AI influencera pro sociální sítě",
      href: "/ai-influencer",
      color: "text-rose-500",
      bgColor: "bg-rose-500/10"
    },
    {
      icon: Share2,
      title: "Sociální příspěvky",
      description: "Automaticky generujte přitažlivé příspěvky pro všechny platformy",
      href: "/social-posts",
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10"
    },
    {
      icon: Mic,
      title: "Voice Chat",
      description: "Mluvte s AI pomocí hlasového rozhraní",
      href: "/voice-chat",
      color: "text-green-500",
      bgColor: "bg-green-500/10"
    },
    {
      icon: Music,
      title: "AI Hudba",
      description: "Vytvářejte originální hudbu pomocí umělé inteligence",
      href: "/music-generate",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10"
    },
    {
      icon: Bot,
      title: "AI Asistenti",
      description: "Vytvořte si specializované AI asistenty pro různé úkoly",
      href: "/assistants",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10"
    },
    {
      icon: FileText,
      title: "Sumarizace dokumentů",
      description: "Vytvořte stručné shrnutí dlouhých textů",
      href: "/document-summary",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    {
      icon: Megaphone,
      title: "Generátor reklam",
      description: "Vytvářejte efektivní reklamní kampaně pomocí AI",
      href: "/ad-generator",
      color: "text-red-500",
      bgColor: "bg-red-500/10"
    },
    {
      icon: Edit3,
      title: "Editor obrázků",
      description: "Upravujte a vylepšujte obrázky pomocí AI",
      href: "/image-editor",
      color: "text-violet-500",
      bgColor: "bg-violet-500/10"
    },
    {
      icon: Star,
      title: "Oblíbené prompty",
      description: "Ukládejte a sdílejte své nejlepší AI prompty",
      href: "/favorite-prompts",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10"
    }
  ];

  const pricing = [
    {
      name: "Free",
      price: "0",
      period: "zdarma navždy",
      credits: "50",
      features: [
        "Přístup ke všem AI modelům",
        "50 kreditů měsíčně",
        "Omezená historie (7 dní)",
        "Základní podpora"
      ],
      cta: "Začít zdarma",
      highlighted: false
    },
    {
      name: "Basic",
      price: "149",
      period: "měsíčně",
      credits: "500",
      features: [
        "Vše z Free plánu",
        "500 kreditů měsíčně",
        "Neomezená historie",
        "Prioritní podpora"
      ],
      cta: "Vybrat Basic",
      highlighted: false
    },
    {
      name: "Pro",
      price: "499",
      period: "měsíčně",
      credits: "2000",
      features: [
        "Vše z Basic plánu",
        "2000 kreditů měsíčně",
        "Pokročilé funkce",
        "API přístup"
      ],
      cta: "Vybrat Pro",
      highlighted: true
    },
    {
      name: "Business",
      price: "999",
      period: "měsíčně",
      credits: "5000",
      features: [
        "Vše z Pro plánu",
        "5000 kreditů měsíčně",
        "Týmové funkce",
        "Dedikovaná podpora"
      ],
      cta: "Vybrat Business",
      highlighted: false
    }
  ];

  const faq = [
    {
      question: "Co jsou kredity a jak fungují?",
      answer: "Kredity jsou jednotky, které spotřebováváte při používání AI funkcí. Jeden kredit odpovídá přibližně jedné AI operaci (zpráva, obrázek, atd.). Každý měsíc dostanete kredity podle vašeho předplatného."
    },
    {
      question: "Mohu kredity přenést do dalšího měsíce?",
      answer: "Ano! Nevyužité kredity z měsíčního předplatného se přenášejí do dalšího měsíce. Jednorázově zakoupené kredity platí navždy."
    },
    {
      question: "Jaké AI modely jsou k dispozici?",
      answer: "Podporujeme nejpopulárnější AI modely včetně GPT-4, GPT-3.5, Claude 3, Gemini Pro, DALL-E 3, Stable Diffusion a další. Pravidelně přidáváme nové modely."
    },
    {
      question: "Můžu zrušit předplatné kdykoliv?",
      answer: "Ano, předplatné můžete kdykoli zrušit. Kredity vám zůstanou k dispozici až do konce aktuálního fakturačního období."
    },
    {
      question: "Je k dispozici firemní verze?",
      answer: "Ano! Business a Enterprise plány nabízejí pokročilé funkce pro týmy včetně sdíleného kreditu, správy uživatelů a dedikované podpory."
    }
  ];

  return (
    <>
      <SEO 
        title="kAIkus - Všechny AI nástroje na jednom místě"
        description="Generujte text, obrázky, videa, hudbu a další pomocí nejlepších AI modelů. GPT-4, Claude, DALL-E, Stable Diffusion a více."
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        {/* Header */}
        <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-primary to-accent rounded-xl">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  kAIkus
                </h1>
              </Link>
              <div className="flex items-center gap-2 sm:gap-3">
                <ThemeSwitch />
                {isAuthenticated ? (
                  <Button onClick={() => router.push("/dashboard")} size="sm" className="text-xs sm:text-sm">
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" onClick={() => router.push("/auth/login")} size="sm" className="text-xs sm:text-sm hidden sm:inline-flex">
                      Přihlásit
                    </Button>
                    <Button onClick={() => router.push("/auth/register")} size="sm" className="text-xs sm:text-sm">
                      Registrace
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto space-y-6 sm:space-y-8">
            <Badge className="bg-accent/20 text-accent hover:bg-accent/30 text-xs sm:text-sm px-3 sm:px-4 py-1">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" />
              Všechny AI nástroje na jednom místě
            </Badge>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight">
              Vytvářejte s pomocí <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient">
                umělé inteligence
              </span>
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Generujte text, obrázky, videa, hudbu a další pomocí nejlepších AI modelů.
              Vše z jednoho místa, jednoduše a rychle.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 px-4 sm:px-0">
              {isAuthenticated ? (
                <Button 
                  size="lg" 
                  onClick={() => router.push("/dashboard")}
                  className="w-full sm:w-auto text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8"
                >
                  Přejít na Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    onClick={() => router.push("/auth/register")}
                    className="w-full sm:w-auto text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8"
                  >
                    Začít zdarma
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => router.push("/pricing")}
                    className="w-full sm:w-auto text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8"
                  >
                    Zobrazit ceník
                  </Button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-8 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" />
                <span>Bezpečné a šifrované</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" />
                <span>Okamžité výsledky</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                <span>Neustále aktualizováno</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold mb-3 sm:mb-4">
              Nástroje pro <span className="text-primary">každou potřebu</span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Od chatování s AI přes tvorbu obsahu až po generování hudby – vše na jednom místě
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() => isAuthenticated ? router.push(feature.href) : router.push("/auth/register")}
              >
                <CardHeader className="space-y-3 sm:space-y-4">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${feature.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`h-6 w-6 sm:h-7 sm:w-7 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-base sm:text-lg font-heading">{feature.title}</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" size="sm" className="w-full group-hover:bg-primary/10 text-xs sm:text-sm">
                    Vyzkoušet
                    <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 bg-muted/30">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold mb-3 sm:mb-4">
              Jednoduché a <span className="text-primary">transparentní</span> ceny
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Vyberte si plán, který vám nejlépe vyhovuje. Bez skrytých poplatků.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
            {pricing.map((plan, index) => (
              <Card 
                key={index}
                className={`relative ${plan.highlighted ? 'border-primary shadow-xl scale-100 sm:scale-105' : ''}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-accent text-white px-3 sm:px-4 py-1 text-xs sm:text-sm">
                      <Crown className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Nejpopulárnější
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pt-6 sm:pt-8">
                  <CardTitle className="text-lg sm:text-xl font-heading mb-2">{plan.name}</CardTitle>
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl sm:text-4xl lg:text-5xl font-bold">{plan.price}</span>
                      <span className="text-sm sm:text-base text-muted-foreground">Kč</span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{plan.period}</p>
                  </div>
                  <Badge variant="secondary" className="mt-3 sm:mt-4 text-xs sm:text-sm">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {plan.credits} kreditů/měsíc
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <ul className="space-y-2 sm:space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs sm:text-sm">
                        <div className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-accent text-xs sm:text-sm">✓</span>
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full text-xs sm:text-sm h-10 sm:h-11"
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => isAuthenticated ? router.push("/pricing") : router.push("/auth/register")}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8 sm:mt-12">
            <Button 
              variant="link" 
              onClick={() => router.push("/pricing")}
              className="text-xs sm:text-sm"
            >
              Zobrazit kompletní ceník a jednorázové balíčky
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold mb-3 sm:mb-4">
              Často kladené <span className="text-primary">otázky</span>
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Máte dotazy? Máme odpovědi.
            </p>
          </div>

          <Accordion type="single" collapsible className="max-w-3xl mx-auto space-y-3 sm:space-y-4">
            {faq.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4 sm:px-6 bg-card">
                <AccordionTrigger className="text-sm sm:text-base text-left py-4 sm:py-5 hover:no-underline">
                  <span className="font-semibold pr-4">{item.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground pb-4 sm:pb-5">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
          <Card className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 border-primary/20">
            <CardContent className="text-center py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold mb-4 sm:mb-6">
                Připraveni začít s AI?
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
                Zaregistrujte se zdarma a získejte 50 kreditů na vyzkoušení všech funkcí
              </p>
              <Button 
                size="lg" 
                onClick={() => router.push("/auth/register")}
                className="text-base sm:text-lg h-12 sm:h-14 px-6 sm:px-8"
              >
                Začít zdarma
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-gradient-to-br from-primary to-accent rounded-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-lg font-heading font-bold">kAIkus</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Váš univerzální AI nástroj pro tvorbu obsahu, generování obrázků, videí a mnoho dalšího.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Produkty</h3>
                <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li><Link href="/chat" className="hover:text-primary transition-colors">AI Chat</Link></li>
                  <li><Link href="/generate" className="hover:text-primary transition-colors">Generování obrázků</Link></li>
                  <li><Link href="/viral-videos" className="hover:text-primary transition-colors">AI Video</Link></li>
                  <li><Link href="/social-posts" className="hover:text-primary transition-colors">Sociální příspěvky</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Firma</h3>
                <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li><Link href="/pricing" className="hover:text-primary transition-colors">Ceník</Link></li>
                  <li><Link href="/affiliate" className="hover:text-primary transition-colors">Affiliate program</Link></li>
                  <li><Link href="/terms" className="hover:text-primary transition-colors">Podmínky použití</Link></li>
                  <li><Link href="/privacy-policy" className="hover:text-primary transition-colors">Ochrana soukromí</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Podpora</h3>
                <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
                  <li><Link href="/settings" className="hover:text-primary transition-colors">Nastavení</Link></li>
                  <li><a href="mailto:support@kaikus.cz" className="hover:text-primary transition-colors">Kontakt</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-muted-foreground">
              <p>© 2026 kAIkus. Všechna práva vyhrazena.</p>
              <div className="flex items-center gap-4 sm:gap-6">
                <Link href="/terms" className="hover:text-primary transition-colors">Podmínky</Link>
                <Link href="/privacy-policy" className="hover:text-primary transition-colors">Soukromí</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </>
  );
}