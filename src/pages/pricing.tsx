import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, LogOut, Crown, Zap, Rocket, Star, Settings } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { subscriptionService, type SubscriptionPlan, type UserSubscription } from "@/services/subscriptionService";

const TIER_ICONS = {
  free: Star,
  basic: Zap,
  pro: Rocket,
  enterprise: Crown,
};

const TIER_COLORS = {
  free: "bg-muted",
  basic: "bg-primary/10",
  pro: "bg-secondary/10",
  enterprise: "bg-accent/10",
};

export default function Pricing() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansData, subscription] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getCurrentSubscription(),
      ]);
      setPlans(plansData);
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    try {
      await subscriptionService.subscribeToPlan(planId);
      await loadData();
      alert("Předplatné bylo úspěšně aktivováno!");
    } catch (error) {
      console.error("Error subscribing:", error);
      alert("Chyba při aktivaci předplatného.");
    } finally {
      setLoading(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan_id === planId;
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-lg font-heading font-bold">Předplatné</h1>
              </div>
              <div className="flex items-center gap-2">
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

        <main className="container mx-auto px-6 py-12">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl font-heading font-bold">
              Vyberte si <span className="text-primary">perfektní plán</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Odemkněte plný potenciál AI s našimi předplatnými. Začněte zdarma a upgradujte kdykoliv.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
            {plans.map((plan) => {
              const Icon = TIER_ICONS[plan.tier as keyof typeof TIER_ICONS] || Star;
              const isActive = isCurrentPlan(plan.id);
              const features = (plan.features as string[]) || [];
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative ${isActive ? "border-primary border-2" : ""} ${TIER_COLORS[plan.tier as keyof typeof TIER_COLORS]}`}
                >
                  {isActive && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary">Aktivní plán</Badge>
                    </div>
                  )}
                  {plan.tier === "pro" && !isActive && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-accent">Nejoblíbenější</Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center">
                    <div className="mx-auto p-3 bg-background/50 rounded-xl mb-4 w-fit">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-heading">{plan.name}</CardTitle>
                    <div className="pt-4">
                      <span className="text-4xl font-bold">{plan.price} Kč</span>
                      <span className="text-muted-foreground">/{plan.billing_period === "monthly" ? "měsíc" : "rok"}</span>
                    </div>
                    <CardDescription className="pt-2">
                      {plan.credits_included === 999999 
                        ? "Neomezené kredity" 
                        : `${plan.credits_included} kreditů měsíčně`}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isActive ? "secondary" : "default"}
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isActive || loading === plan.id}
                    >
                      {loading === plan.id ? "Aktivuji..." : isActive ? "Aktivní" : "Vybrat plán"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {currentSubscription && (
            <div className="mt-12 max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Vaše aktuální předplatné</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Plán:</span>
                    <Badge variant="default">{currentSubscription.subscription_plans?.name}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={currentSubscription.status === "active" ? "default" : "secondary"}>
                      {currentSubscription.status === "active" ? "Aktivní" : "Neaktivní"}
                    </Badge>
                  </div>
                  {currentSubscription.expires_at && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Platnost do:</span>
                      <span>{new Date(currentSubscription.expires_at).toLocaleDateString("cs-CZ")}</span>
                    </div>
                  )}
                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push("/credits")}
                    >
                      Dobít kredity
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}