import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { paymentService } from "@/services/paymentService";
import { creditsService } from "@/services/creditsService";
import { authState } from "@/services/authStateService";

const CREDIT_PACKAGES = [
  {
    id: "starter",
    name: "Starter Pack",
    credits: 50,
    price: 4.99,
    description: "Pro začátečníky",
  },
  {
    id: "popular",
    name: "Popular Pack",
    credits: 150,
    price: 12.99,
    description: "Nejoblíbenější",
    badge: "Nejprodávanější",
  },
  {
    id: "pro",
    name: "Pro Pack",
    credits: 500,
    price: 39.99,
    description: "Pro pokročilé",
  },
  {
    id: "enterprise",
    name: "Enterprise Pack",
    credits: 2000,
    price: 149.99,
    description: "Pro firmy",
  },
];

interface CreditPurchaseDialogProps {
  onCreditsUpdated?: (newBalance: number) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreditPurchaseDialog({ onCreditsUpdated, open: externalOpen, onOpenChange, onSuccess }: CreditPurchaseDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;
  
  const [selectedPackage, setSelectedPackage] = useState("popular");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePurchase = async (e: FormEvent) => {
    e.preventDefault();
    const pkg = CREDIT_PACKAGES.find(p => p.id === selectedPackage);
    if (!pkg) return;

    setLoading(true);
    try {
      const user = await authState.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create payment record
      await paymentService.createPayment({
        amount: pkg.price,
        currency: "USD",
        description: `${pkg.name} - ${pkg.credits} kreditů`,
        method: "stripe",
      });

      // In production, integrate with Stripe/PayPal here
      // For demo, we'll simulate successful payment
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Add credits to user account (admin would do this after payment verification)
      toast({
        title: "Platba přijata",
        description: "Vaše kredity budou připsány do 5 minut. Kontaktujte podporu pro potvrzení.",
      });

      setOpen(false);
      onSuccess?.();
      
      // Refresh credits
      if (onCreditsUpdated) {
        const newBalance = await creditsService.getCredits();
        onCreditsUpdated(newBalance);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se zpracovat platbu. Zkuste to znovu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Coins className="h-4 w-4 mr-2" />
          Koupit kredity
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Zakoupit kredity</DialogTitle>
          <DialogDescription>
            Vyberte balíček kreditů, který vám nejlépe vyhovuje
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handlePurchase} className="space-y-6 py-4">
          <RadioGroup value={selectedPackage} onValueChange={setSelectedPackage}>
            <div className="grid gap-4 md:grid-cols-2">
              {CREDIT_PACKAGES.map((pkg) => (
                <Card 
                  key={pkg.id}
                  className={`cursor-pointer transition-all ${
                    selectedPackage === pkg.id 
                      ? "border-primary shadow-lg" 
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedPackage(pkg.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <RadioGroupItem value={pkg.id} id={pkg.id} />
                      {pkg.badge && (
                        <Badge variant="default" className="bg-accent">
                          {pkg.badge}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="font-heading">{pkg.name}</CardTitle>
                    <CardDescription>{pkg.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">${pkg.price}</span>
                        <span className="text-muted-foreground">USD</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Coins className="h-4 w-4 text-accent" />
                        <span className="font-medium">{pkg.credits} kreditů</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ~${(pkg.price / pkg.credits).toFixed(3)} za kredit
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </RadioGroup>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">💳 Platební metody</h4>
            <p className="text-sm text-muted-foreground">
              Po kliknutí na "Pokračovat na platbu" budete přesměrováni na zabezpečenou platební bránu. 
              Akceptujeme Stripe, PayPal a kryptoměny.
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Zrušit
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Zpracování...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pokračovat na platbu
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}