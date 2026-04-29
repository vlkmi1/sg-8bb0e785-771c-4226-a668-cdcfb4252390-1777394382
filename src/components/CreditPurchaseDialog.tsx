import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, CreditCard, QrCode, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { paymentService, type CreditPackage, type PaymentMethod } from "@/services/paymentService";

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
  
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe");
  const [loading, setLoading] = useState(false);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [qrDetails, setQrDetails] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadPackages();
      setQrDetails(null);
    }
  }, [open]);

  const loadPackages = async () => {
    setLoadingPackages(true);
    try {
      const pkgs = await paymentService.getCreditPackages();
      setPackages(pkgs);
      if (pkgs.length > 0 && !selectedPackage) {
        setSelectedPackage(pkgs[0].id);
      }
    } catch (error) {
      console.error("Error loading packages:", error);
    } finally {
      setLoadingPackages(false);
    }
  };

  const handlePurchase = async (e: FormEvent) => {
    e.preventDefault();
    const pkg = packages.find(p => p.id === selectedPackage);
    if (!pkg) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (paymentMethod === "bank_transfer") {
        // Generate QR code and create pending payment
        try {
          const details = await paymentService.generateBankTransferQR(pkg.id);
          setQrDetails(details);
          toast({
            title: "Objednávka vytvořena",
            description: "Proveďte platbu pomocí QR kódu. Kredity budou připsány po schválení.",
          });
        } catch (err: any) {
          toast({
            title: "Platba převodem nedostupná",
            description: "Nejprve musí administrátor nastavit číslo účtu v nastavení plateb.",
            variant: "destructive",
          });
          
          // Fallback - create pending payment anyway
          await paymentService.createPayment({
            amount: pkg.price,
            currency: pkg.currency,
            description: `Nákup kreditů: ${pkg.name}`,
            method: "bank_transfer",
            metadata: { package_id: pkg.id, credits: pkg.credits }
          });
          
          toast({
            title: "Objednávka přijata",
            description: "Vyčkejte na pokyny k platbě od administrátora.",
          });
          setOpen(false);
        }
      } else {
        // Online payment (Stripe)
        await paymentService.createPayment({
          amount: pkg.price,
          currency: pkg.currency,
          description: `Nákup kreditů: ${pkg.name}`,
          method: "stripe",
          metadata: { package_id: pkg.id, credits: pkg.credits }
        });

        toast({
          title: "Přesměrování na platební bránu",
          description: "Po úspěšné platbě budou kredity připsány.",
        });
        
        // V produkci by se zde volalo:
        // const url = await paymentService.initStripePayment(pkg.id);
        // window.location.href = url;
        
        setTimeout(() => setOpen(false), 2000);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se vytvořit platbu. Zkuste to znovu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (qrDetails) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-center">Zaplaťte QR kódem</DialogTitle>
            <DialogDescription className="text-center">
              Po přijetí platby administrátor objednávku schválí a kredity budou připsány.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border">
              <img src={qrDetails.qrCodeUrl} alt="QR Platba" className="w-48 h-48" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-bold text-xl">{qrDetails.amount} {qrDetails.currency}</p>
              <p className="text-sm text-muted-foreground">Číslo účtu: <span className="font-mono text-foreground">{qrDetails.accountNumber}</span></p>
              <p className="text-sm text-muted-foreground">Variabilní symbol: <span className="font-mono text-foreground">{qrDetails.variableSymbol}</span></p>
            </div>
            <Button onClick={() => setOpen(false)} className="w-full mt-4">
              Zavřít a čekat na schválení
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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

        {loadingPackages ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Žádné aktivní balíčky kreditů nejsou momentálně k dispozici.</p>
          </div>
        ) : (
          <form onSubmit={handlePurchase} className="space-y-6 py-4">
            <RadioGroup value={selectedPackage} onValueChange={setSelectedPackage}>
              <div className="grid gap-4 md:grid-cols-2">
                {packages.map((pkg) => (
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
                          <span className="text-3xl font-bold">{pkg.price}</span>
                          <span className="text-muted-foreground">{pkg.currency}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Coins className="h-4 w-4 text-accent" />
                          <span className="font-medium">{pkg.credits} kreditů</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          ~{(pkg.price / pkg.credits).toFixed(2)} {pkg.currency} za kredit
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </RadioGroup>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Zvolte platební metodu</Label>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="flex flex-col sm:flex-row gap-4">
                <div className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer flex-1 ${paymentMethod === 'stripe' ? 'border-primary bg-primary/5' : ''}`} onClick={() => setPaymentMethod('stripe')}>
                  <RadioGroupItem value="stripe" id="stripe" />
                  <Label htmlFor="stripe" className="flex items-center cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <p className="font-medium">Platba kartou online</p>
                      <p className="text-xs text-muted-foreground">Okamžitá aktivace</p>
                    </div>
                  </Label>
                </div>
                
                <div className={`flex items-center space-x-3 border p-4 rounded-lg cursor-pointer flex-1 ${paymentMethod === 'bank_transfer' ? 'border-primary bg-primary/5' : ''}`} onClick={() => setPaymentMethod('bank_transfer')}>
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                  <Label htmlFor="bank_transfer" className="flex items-center cursor-pointer flex-1">
                    <QrCode className="h-5 w-5 mr-2 text-primary" />
                    <div>
                      <p className="font-medium">QR Platba / Převod</p>
                      <p className="text-xs text-muted-foreground">Aktivace po schválení</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Zrušit
              </Button>
              <Button type="submit" disabled={loading || !selectedPackage} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Zpracování...
                  </>
                ) : paymentMethod === 'stripe' ? (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Zaplatit kartou online
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Generovat QR platbu
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}