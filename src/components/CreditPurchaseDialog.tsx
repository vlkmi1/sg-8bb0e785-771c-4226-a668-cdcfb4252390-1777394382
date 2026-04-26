import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Sparkles, TrendingUp, Zap, Crown, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  bonus_credits: number;
}

interface CreditPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const packageIcons: Record<string, JSX.Element> = {
  "Základní": <Coins className="h-8 w-8 text-primary" />,
  "Standard": <Zap className="h-8 w-8 text-primary" />,
  "Velký": <TrendingUp className="h-8 w-8 text-primary" />,
  "Premium": <Sparkles className="h-8 w-8 text-primary" />,
  "Mega": <Crown className="h-8 w-8 text-primary" />,
};

export function CreditPurchaseDialog({ open, onOpenChange, onSuccess }: CreditPurchaseDialogProps) {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadPackages();
    }
  }, [open]);

  const loadPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("is_active", true)
        .order("credits", { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error("Error loading packages:", error);
    }
  };

  const handlePurchase = async (pkg: CreditPackage) => {
    setLoading(true);
    setSelectedPackage(pkg.id);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          user_id: user.id,
          amount: pkg.price,
          method: "card",
          payment_type: "credits",
          status: "pending",
          metadata: { package_name: pkg.name, credits_added: pkg.credits + pkg.bonus_credits }
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // TODO: Integrate with actual payment gateway (Stripe/PayPal)
      // For now, simulate successful payment
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update payment status
      await supabase
        .from("payments")
        .update({ status: "completed" })
        .eq("id", payment.id);

      // Add credits to user
      const { error: creditsError } = await supabase.rpc("add_credits", {
        target_user_id: user.id,
        amount: pkg.credits + pkg.bonus_credits
      });

      if (creditsError) throw creditsError;

      toast({
        title: "Kredity zakoupeny! 🎉",
        description: `Bylo přidáno ${pkg.credits + pkg.bonus_credits} kreditů na váš účet`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error purchasing credits:", error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se zakoupit kredity",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setSelectedPackage(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            Dobít kredity
          </DialogTitle>
          <DialogDescription>
            Vyberte balíček kreditů pro pokračování ve využívání AI služeb
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {packages.map((pkg) => (
            <Card
              key={pkg.id}
              className={`relative cursor-pointer transition-all hover:shadow-lg ${
                selectedPackage === pkg.id ? "ring-2 ring-primary" : ""
              }`}
            >
              {pkg.bonus_credits > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-accent text-accent-foreground">
                  +{pkg.bonus_credits} bonus
                </Badge>
              )}
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-lg">{pkg.name}</h3>
                  {packageIcons[pkg.name]}
                </div>

                <div className="space-y-2">
                  <div className="text-3xl font-bold text-primary">
                    {pkg.credits.toLocaleString("cs-CZ")}
                    {pkg.bonus_credits > 0 && (
                      <span className="text-accent ml-1">+{pkg.bonus_credits}</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">kreditů</p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-2xl font-bold">{pkg.price}</span>
                    <span className="text-muted-foreground">Kč</span>
                  </div>

                  <Button
                    onClick={() => handlePurchase(pkg)}
                    disabled={loading}
                    className="w-full"
                    variant={pkg.name === "Premium" ? "default" : "outline"}
                  >
                    {loading && selectedPackage === pkg.id ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Zpracovává se...
                      </div>
                    ) : (
                      "Zakoupit"
                    )}
                  </Button>
                </div>

                {pkg.name === "Premium" && (
                  <div className="text-xs text-center text-muted-foreground">
                    ⭐ Nejpopulárnější volba
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Co můžete s kredity dělat?
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Chatovat s nejnovějšími AI modely (GPT-4, Claude, Gemini)</li>
            <li>• Generovat obrázky a umělecká díla</li>
            <li>• Vytvářet videa a animace</li>
            <li>• Komponovat AI hudbu</li>
            <li>• Využívat pokročilé AI asistenty</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}