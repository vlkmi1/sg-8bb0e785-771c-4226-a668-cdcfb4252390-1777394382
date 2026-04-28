import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Coins, LogOut, CreditCard, QrCode, Gift, Sparkles, Zap } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { paymentService, type CreditPackage, type Payment } from "@/services/paymentService";
import { creditsService } from "@/services/creditsService";

export default function Credits() {
  const router = useRouter();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [credits, setCredits] = useState(0);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [currentPayment, setCurrentPayment] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState({
    paypal: false,
    stripe: false,
    bank_transfer: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [packagesData, userCredits] = await Promise.all([
        paymentService.getCreditPackages(),
        creditsService.getCredits(),
      ]);
      setPackages(packagesData);
      setCredits(userCredits);

      const [paypalAvailable, stripeAvailable, bankAvailable] = await Promise.all([
        paymentService.isPaymentMethodAvailable("paypal"),
        paymentService.isPaymentMethodAvailable("stripe"),
        paymentService.isPaymentMethodAvailable("bank_transfer"),
      ]);

      setAvailablePaymentMethods({
        paypal: paypalAvailable,
        stripe: stripeAvailable,
        bank_transfer: bankAvailable,
      });
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleSelectPackage = (pkg: CreditPackage) => {
    setSelectedPackage(pkg);
    setPaymentDialogOpen(true);
  };

  const handlePayPal = async () => {
    if (!selectedPackage) return;
    
    setLoading(true);
    try {
      const paypalUrl = await paymentService.initPayPalPayment(selectedPackage.id);
      window.location.href = paypalUrl;
    } catch (error) {
      console.error("Error initiating PayPal:", error);
      alert("Chyba při inicializaci PayPal platby.");
    } finally {
      setLoading(false);
    }
  };

  const handleStripe = async () => {
    if (!selectedPackage) return;
    
    setLoading(true);
    try {
      const stripeUrl = await paymentService.initStripePayment(selectedPackage.id);
      window.location.href = stripeUrl;
    } catch (error) {
      console.error("Error initiating Stripe:", error);
      alert("Chyba při inicializaci Stripe platby.");
    } finally {
      setLoading(false);
    }
  };

  const handleBankTransfer = async () => {
    if (!selectedPackage) return;

    setLoading(true);
    try {
      const bankDetails = await paymentService.generateBankTransferQR(selectedPackage.id);
      
      setQrCodeUrl(bankDetails.qrCodeUrl);
      setCurrentPayment({
        accountNumber: bankDetails.accountNumber,
        amount: bankDetails.amount,
        variableSymbol: bankDetails.variableSymbol,
        message: bankDetails.message,
      } as any);
      
      setPaymentDialogOpen(false);
      setQrDialogOpen(true);
    } catch (error) {
      console.error("Error creating bank transfer:", error);
      alert("Chyba při vytváření platby.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const getBadgeIcon = (name: string) => {
    if (name.includes("Populární") || name.includes("Starter")) return <Sparkles className="h-3 w-3 mr-1" />;
    if (name.includes("Nejvýhodnější") || name.includes("Mega")) return <Gift className="h-3 w-3 mr-1" />;
    return <Zap className="h-3 w-3 mr-1" />;
  };

  const getBadgeForPackage = (pkg: CreditPackage, idx: number) => {
    if (idx === 2) return { text: "Nejvýhodnější", className: "bg-accent" };
    if (idx === 1) return { text: "Populární", className: "bg-primary" };
    return null;
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-xl">
                  <Coins className="h-5 w-5 text-accent" />
                </div>
                <h1 className="text-lg font-heading font-bold">Dobití kreditů</h1>
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

        <main className="container mx-auto px-6 py-12">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl font-heading font-bold">
              Dobit <span className="text-accent">kredity</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Získejte kredity pro používání AI funkcí. Větší balíčky obsahují extra bonusové kredity zdarma!
            </p>
          </div>

          {packages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Načítání balíčků...</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 max-w-7xl mx-auto">
              {packages.map((pkg, idx) => {
                const totalCredits = pkg.credits + pkg.bonus_credits;
                const badge = getBadgeForPackage(pkg, idx);

                return (
                  <Card 
                    key={pkg.id}
                    className={`relative ${badge?.text === "Nejvýhodnější" ? "border-accent border-2" : ""} hover:shadow-lg transition-shadow`}
                  >
                    {badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className={badge.className}>
                          {getBadgeIcon(badge.text)}
                          {badge.text}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto p-3 bg-accent/10 rounded-xl mb-3 w-fit">
                        <Coins className="h-8 w-8 text-accent" />
                      </div>
                      <CardTitle className="text-xl font-heading">{pkg.name}</CardTitle>
                      <div className="pt-3">
                        <div className="text-3xl font-bold text-accent">{totalCredits.toLocaleString("cs-CZ")}</div>
                        <div className="text-xs text-muted-foreground">kreditů</div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">Základní:</span>
                          <span className="font-semibold">{pkg.credits.toLocaleString("cs-CZ")}</span>
                        </div>
                        {pkg.bonus_credits > 0 && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Bonus:</span>
                            <span className="font-semibold text-accent">+{pkg.bonus_credits.toLocaleString("cs-CZ")}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t">
                          <div className="text-center">
                            <span className="text-2xl font-bold">{pkg.price.toLocaleString("cs-CZ")} Kč</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        className="w-full"
                        variant={badge?.text === "Nejvýhodnější" ? "default" : "outline"}
                        onClick={() => handleSelectPackage(pkg)}
                      >
                        Vybrat balíček
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading">Vyberte platební metodu</DialogTitle>
                <DialogDescription>
                  {selectedPackage && (
                    <>Dobíjíte {(selectedPackage.credits + selectedPackage.bonus_credits).toLocaleString("cs-CZ")} kreditů za {selectedPackage.price.toLocaleString("cs-CZ")} Kč</>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-4">
                {!availablePaymentMethods.paypal && !availablePaymentMethods.stripe && !availablePaymentMethods.bank_transfer && (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="mb-2">Platební metody nejsou nakonfigurované</p>
                    <p className="text-sm">Kontaktujte správce systému</p>
                  </div>
                )}

                {availablePaymentMethods.stripe && (
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    size="lg"
                    onClick={handleStripe}
                    disabled={loading}
                  >
                    <CreditCard className="h-5 w-5 mr-3" />
                    Kreditní karta (Stripe)
                  </Button>
                )}

                {availablePaymentMethods.paypal && (
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    size="lg"
                    onClick={handlePayPal}
                    disabled={loading}
                  >
                    <CreditCard className="h-5 w-5 mr-3" />
                    PayPal
                  </Button>
                )}

                {availablePaymentMethods.bank_transfer && (
                  <Button
                    className="w-full justify-start"
                    variant="outline"
                    size="lg"
                    onClick={handleBankTransfer}
                    disabled={loading}
                  >
                    <QrCode className="h-5 w-5 mr-3" />
                    Bankovní převod (QR kód)
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading">Platba bankovním převodem</DialogTitle>
                <DialogDescription>
                  Naskenujte QR kód v mobilní aplikaci vaší banky
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {qrCodeUrl && (
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg border-2 border-muted">
                      <img src={qrCodeUrl} alt="QR kód pro platbu" className="w-64 h-64" />
                    </div>
                  </div>
                )}
                {currentPayment && (
                  <div className="space-y-3 text-sm">
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Částka:</span>
                        <span className="font-semibold text-lg">{currentPayment.amount?.toLocaleString("cs-CZ")} Kč</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Číslo účtu:</span>
                        <span className="font-mono font-semibold">{currentPayment.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Variabilní symbol:</span>
                        <span className="font-mono font-semibold">{currentPayment.variableSymbol}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Zpráva pro příjemce:</span>
                        <span className="font-semibold">{currentPayment.message}</span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-3">
                      <h4 className="font-semibold mb-2">📱 Jak zaplatit pomocí QR kódu:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        <li>Otevřete mobilní bankovnictví</li>
                        <li>Zvolte "Platba QR kódem"</li>
                        <li>Naskenujte QR kód výše</li>
                        <li>Potvrďte platbu</li>
                      </ol>
                    </div>
                  </div>
                )}
                <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Kredity obdržíte automaticky</strong> po připsání platby na účet (obvykle do 24 hodin). O zpracování platby vás informujeme emailem.
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </AuthGuard>
  );
}