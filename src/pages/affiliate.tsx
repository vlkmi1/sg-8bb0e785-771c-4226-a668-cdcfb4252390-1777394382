import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Share2, Copy, Users, DollarSign, TrendingUp, LogOut, Check, Coins, CreditCard, AlertCircle, Download } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { affiliateService, type ReferralCode, type Referral, type ReferralEarning, type ReferralPayout, type AffiliateStats } from "@/services/affiliateService";

export default function Affiliate() {
  const router = useRouter();
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [earnings, setEarnings] = useState<ReferralEarning[]>([]);
  const [payouts, setPayouts] = useState<ReferralPayout[]>([]);
  const [copied, setCopied] = useState(false);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [payoutForm, setPayoutForm] = useState({
    amount: 0,
    method: "bank_transfer" as "bank_transfer" | "paypal" | "credits",
    bank_account: "",
    paypal_email: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [codeData, statsData, referralsData, earningsData, payoutsData] = await Promise.all([
        affiliateService.getReferralCode(),
        affiliateService.getStats(),
        affiliateService.getReferrals(),
        affiliateService.getEarnings(),
        affiliateService.getPayouts(),
      ]);

      setReferralCode(codeData);
      setStats(statsData);
      setReferrals(referralsData);
      setEarnings(earningsData);
      setPayouts(payoutsData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const getReferralUrl = () => {
    if (!referralCode) return "";
    return `${window.location.origin}/auth/register?ref=${referralCode.code}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getReferralUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestPayout = async (e: FormEvent) => {
    e.preventDefault();
    if (!stats || payoutForm.amount > stats.availableForPayout) {
      alert("Nedostatečná částka k výběru");
      return;
    }

    setLoading(true);
    try {
      await affiliateService.requestPayout(payoutForm);
      await loadData();
      setPayoutDialogOpen(false);
      setPayoutForm({
        amount: 0,
        method: "bank_transfer",
        bank_account: "",
        paypal_email: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error requesting payout:", error);
      alert("Chyba při žádosti o výplatu");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; text: string }> = {
      pending: { variant: "secondary", text: "Čeká" },
      active: { variant: "default", text: "Aktivní" },
      inactive: { variant: "outline", text: "Neaktivní" },
      approved: { variant: "default", text: "Schváleno" },
      paid: { variant: "default", text: "Vyplaceno" },
      processing: { variant: "secondary", text: "Zpracovává se" },
      completed: { variant: "default", text: "Dokončeno" },
      rejected: { variant: "destructive", text: "Zamítnuto" },
    };
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  if (!referralCode || !stats) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p>Načítání...</p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <Share2 className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-lg font-heading font-bold">Provizní systém</h1>
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

        <main className="container mx-auto px-6 py-8 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Celkový výdělek</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEarned.toFixed(2)} Kč</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingEarnings.toFixed(2)} Kč čeká na schválení
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">K výběru</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{stats.availableForPayout.toFixed(2)} Kč</div>
                <p className="text-xs text-muted-foreground">
                  Min. výběr: 500 Kč
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Referrálové</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalReferrals}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.activeReferrals} aktivních
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Konverze</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalClicks > 0 ? ((stats.totalConversions / stats.totalClicks) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalConversions} z {stats.totalClicks} kliknutí
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Referral Link */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">Váš referral link</CardTitle>
              <CardDescription>
                Sdílejte tento link a získejte 20% provizi z předplatného a 15% z nákupů kreditů vašich referrálů
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input value={getReferralUrl()} readOnly className="font-mono text-sm" />
                <Button onClick={handleCopyLink} variant={copied ? "default" : "outline"}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Zkopírováno
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Kopírovat
                    </>
                  )}
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Provize - Předplatné</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-primary">20%</p>
                    <p className="text-xs text-muted-foreground">z každé platby předplatného</p>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Provize - Kredity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-accent">15%</p>
                    <p className="text-xs text-muted-foreground">z každého nákupu kreditů</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between items-center">
                <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="lg" 
                      disabled={stats.availableForPayout < 500}
                      className="bg-accent hover:bg-accent/90"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Požádat o výplatu
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Žádost o výplatu</DialogTitle>
                      <DialogDescription>
                        Dostupná částka k výběru: {stats.availableForPayout.toFixed(2)} Kč
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRequestPayout} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Částka (Kč)</Label>
                        <Input
                          id="amount"
                          type="number"
                          min={500}
                          max={stats.availableForPayout}
                          step={0.01}
                          value={payoutForm.amount}
                          onChange={(e) => setPayoutForm({ ...payoutForm, amount: parseFloat(e.target.value) })}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="method">Metoda výplaty</Label>
                        <Select
                          value={payoutForm.method}
                          onValueChange={(v: any) => setPayoutForm({ ...payoutForm, method: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bank_transfer">Bankovní převod</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="credits">Přidat do kreditů</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {payoutForm.method === "bank_transfer" && (
                        <div className="space-y-2">
                          <Label htmlFor="bank_account">Číslo účtu</Label>
                          <Input
                            id="bank_account"
                            placeholder="123456789/0100"
                            value={payoutForm.bank_account}
                            onChange={(e) => setPayoutForm({ ...payoutForm, bank_account: e.target.value })}
                            required
                          />
                        </div>
                      )}

                      {payoutForm.method === "paypal" && (
                        <div className="space-y-2">
                          <Label htmlFor="paypal_email">PayPal email</Label>
                          <Input
                            id="paypal_email"
                            type="email"
                            placeholder="vase@email.com"
                            value={payoutForm.paypal_email}
                            onChange={(e) => setPayoutForm({ ...payoutForm, paypal_email: e.target.value })}
                            required
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="notes">Poznámka (volitelné)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Dodatečné informace..."
                          value={payoutForm.notes}
                          onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })}
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Odesílání..." : "Odeslat žádost"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                {stats.availableForPayout < 500 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    Minimální výběr je 500 Kč
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="referrals" className="space-y-4">
            <TabsList>
              <TabsTrigger value="referrals">Referrálové</TabsTrigger>
              <TabsTrigger value="earnings">Výdělky</TabsTrigger>
              <TabsTrigger value="payouts">Výplaty</TabsTrigger>
            </TabsList>

            <TabsContent value="referrals">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Vaši referrálové</CardTitle>
                  <CardDescription>
                    Seznam uživatelů, kteří se zaregistrovali přes váš link
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {referrals.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Zatím žádní referrálové
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Uživatel</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Celkem utraceno</TableHead>
                          <TableHead>Vaše provize</TableHead>
                          <TableHead>Datum</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referrals.map((ref) => (
                          <TableRow key={ref.id}>
                            <TableCell>{(ref as any).profiles?.email || "N/A"}</TableCell>
                            <TableCell>{getStatusBadge(ref.status)}</TableCell>
                            <TableCell>{Number(ref.total_spent).toFixed(2)} Kč</TableCell>
                            <TableCell className="font-semibold text-accent">
                              {Number(ref.commission_earned).toFixed(2)} Kč
                            </TableCell>
                            <TableCell>
                              {new Date(ref.created_at).toLocaleDateString("cs-CZ")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="earnings">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Historie výdělků</CardTitle>
                  <CardDescription>
                    Přehled všech provizí z plateb vašich referrálů
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {earnings.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Zatím žádné výdělky
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Datum</TableHead>
                          <TableHead>Typ platby</TableHead>
                          <TableHead>Částka platby</TableHead>
                          <TableHead>Sazba</TableHead>
                          <TableHead>Vaše provize</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {earnings.map((earning) => (
                          <TableRow key={earning.id}>
                            <TableCell>
                              {new Date(earning.created_at).toLocaleDateString("cs-CZ")}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {earning.payment_type === "subscription" ? "Předplatné" : "Kredity"}
                              </Badge>
                            </TableCell>
                            <TableCell>{Number(earning.amount).toFixed(2)} Kč</TableCell>
                            <TableCell>{Number(earning.commission_rate)}%</TableCell>
                            <TableCell className="font-semibold text-accent">
                              {Number(earning.commission_amount).toFixed(2)} Kč
                            </TableCell>
                            <TableCell>{getStatusBadge(earning.status)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payouts">
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading">Historie výplat</CardTitle>
                  <CardDescription>
                    Přehled vašich žádostí o výplatu provizí
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {payouts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Zatím žádné výplaty
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Datum žádosti</TableHead>
                          <TableHead>Částka</TableHead>
                          <TableHead>Metoda</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Zpracováno</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payouts.map((payout) => (
                          <TableRow key={payout.id}>
                            <TableCell>
                              {new Date(payout.created_at).toLocaleDateString("cs-CZ")}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {Number(payout.amount).toFixed(2)} Kč
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {payout.method === "bank_transfer" && "Bankovní převod"}
                                {payout.method === "paypal" && "PayPal"}
                                {payout.method === "credits" && "Kredity"}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(payout.status)}</TableCell>
                            <TableCell>
                              {payout.processed_at
                                ? new Date(payout.processed_at).toLocaleDateString("cs-CZ")
                                : "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AuthGuard>
  );
}