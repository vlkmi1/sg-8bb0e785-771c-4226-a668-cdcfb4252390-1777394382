import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { Check, Sparkles, Crown, Rocket, Zap, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditPurchaseDialog } from "@/components/CreditPurchaseDialog";

interface SubscriptionPlan {
  id: string;
  tier: string;
  name: string;
  price: number;
  billing_period: string;
  credits_included: number;
  features: string[];
  is_active: boolean;
}

const planIcons: Record<string, JSX.Element> = {
  free: <Zap className="h-8 w-8" />,
  basic: <Zap className="h-8 w-8" />,
  pro: <Rocket className="h-8 w-8" />,
  enterprise: <Crown className="h-8 w-8" />,
};

export default function Pricing() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadPlans();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setIsAuthenticated(!!user);
  };

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("is_active", true)
        .neq("tier", "free")
        .order("price", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error("Error loading plans:", error);
    }
  };

  const handleSubscribe = async (planId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push("/auth/login?redirect=/pricing");
      return;
    }

    setLoading(planId);

    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) throw new Error("Invalid plan");

      const periodEnd = new Date();
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const { data: subscription, error: subError } = await supabase
        .from("user_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: plan.id,
          status: "active",
          expires_at: periodEnd.toISOString(),
        })
        .select()
        .single();

      if (subError) throw subError;

      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          amount: plan.price,
          method: "card",
          payment_type: "subscription",
          status: "completed",
          metadata: { plan_name: plan.name, subscription_id: subscription.id }
        });

      if (paymentError) throw paymentError;

      await supabase.rpc("add_credits", {
        target_user_id: user.id,
        amount: plan.credits_included
      });

      toast({
        title: "Předplatné aktivováno! 🎉",
        description: `Bylo přidáno ${plan.credits_included.toLocaleString("cs-CZ")} kreditů`,
      });

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error subscribing:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se aktivovat předplatné",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const isPopular = (tier: string) => tier === "pro";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-xl font-heading font-bold">Ceník</h1>
              </div>
            </div>
            <ThemeSwitch />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4">
            Vyberte si ideální plán
          </h2>
          <p className="text-muted-foreground text-lg">
            Získejte přístup k nejmodernějším AI modelům a nástrojům
          </p>
        </div>

        <Tabs defaultValue="subscription" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="subscription">Předplatné</TabsTrigger>
            <TabsTrigger value="credits">Kredity</TabsTrigger>
          </TabsList>

          <TabsContent value="subscription">
            {plans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Načítání plánů...</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`relative ${isPopular(plan.tier) ? "border-primary shadow-lg scale-105" : ""}`}
                  >
                    {isPopular(plan.tier) && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                        Nejpopulárnější
                      </Badge>
                    )}
                    <CardHeader className="text-center pb-4">
                      <div className="flex justify-center mb-4 text-primary">
                        {planIcons[plan.tier] || <Zap className="h-8 w-8" />}
                      </div>
                      <CardTitle className="text-2xl font-heading">{plan.name}</CardTitle>
                      <CardDescription className="text-muted-foreground mt-2">
                        {plan.credits_included.toLocaleString("cs-CZ")} kreditů/{plan.billing_period === "monthly" ? "měsíc" : "rok"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center">
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-4xl font-bold">{plan.price.toLocaleString("cs-CZ")}</span>
                          <span className="text-muted-foreground">Kč</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">/{plan.billing_period === "monthly" ? "měsíc" : "rok"}</p>
                      </div>

                      <ul className="space-y-3">
                        {Array.isArray(plan.features) && plan.features.map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={loading !== null}
                        className="w-full"
                        variant={isPopular(plan.tier) ? "default" : "outline"}
                      >
                        {loading === plan.id ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                            Zpracovává se...
                          </div>
                        ) : (
                          "Vybrat plán"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">
                💡 Všechny plány zahrnují 14denní zkušební období
              </p>
              <p className="text-sm text-muted-foreground">
                Kredity se obnovují každý měsíc. Nevyužité kredity nepropadají.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="credits">
            <div className="text-center py-12">
              <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-6">
                <Sparkles className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-heading font-bold mb-4">
                Doplňte si kredity kdykoliv
              </h3>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Nevyčerpali jste měsíční kredity? Dokupte si je podle potřeby a plaťte jen za to, co skutečně použijete.
              </p>
              <Button
                size="lg"
                onClick={() => router.push("/credits")}
                className="gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Zakoupit kredity
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-heading font-bold mb-4">
                    🎯 Jak fungují kredity?
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• 1 kredit = 1 AI operace (chat zpráva, generování)</li>
                    <li>• Kredity nikdy nepropadají</li>
                    <li>• Přenoste si je do dalšího měsíce</li>
                    <li>• Transparentní spotřeba v dashboardu</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-heading font-bold mb-4">
                    🎁 Výhody předplatného
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Až 50% úspora oproti jednotlivým kreditům</li>
                    <li>• Prioritní přístup k novým modelům</li>
                    <li>• Rychlejší odezva</li>
                    <li>• Bonus kredity každý měsíc</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <CreditPurchaseDialog
        open={showCreditDialog}
        onOpenChange={setShowCreditDialog}
        onSuccess={() => {
          toast({
            title: "Úspěch! 🎉",
            description: "Kredity byly přidány na váš účet",
          });
        }}
      />
    </div>
  );
}