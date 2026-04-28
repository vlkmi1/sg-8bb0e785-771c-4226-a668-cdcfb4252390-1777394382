import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  UserPlus,
  RefreshCw,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { adminService } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { subscriptionService, type SubscriptionPlan } from "@/services/subscriptionService";

type Profile = Tables<"profiles">;

interface UserWithStats extends Profile {
  stats?: {
    total_conversations: number;
    total_images: number;
    total_videos: number;
    total_spent: number;
    total_earned: number;
    last_activity: string;
  };
}

export function UsersManagement() {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "admin" | "blocked">("all");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDescription, setCreditDescription] = useState("");
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [changingPlan, setChangingPlan] = useState(false);
  const [creditsDialogOpen, setCreditsDialogOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, statusFilter, filterUsers]);

  const loadUsers = async () => {
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst uživatele",
        variant: "destructive",
      });
    }
  };

  const loadPlans = async () => {
    try {
      const plans = await subscriptionService.getAllPlans();
      setAvailablePlans(plans);
    } catch (error) {
      console.error("Error loading plans:", error);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.email?.toLowerCase().includes(query) ||
        u.full_name?.toLowerCase().includes(query)
      );
    }

    // Status filter
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (filterStatus) {
      case "active":
        filtered = filtered.filter(u => 
          u.last_sign_in_at && new Date(u.last_sign_in_at) > thirtyDaysAgo
        );
        break;
      case "inactive":
        filtered = filtered.filter(u => 
          !u.last_sign_in_at || new Date(u.last_sign_in_at) <= thirtyDaysAgo
        );
        break;
      case "admin":
        filtered = filtered.filter(u => u.is_admin);
        break;
      case "blocked":
        filtered = filtered.filter(u => u.is_blocked);
        break;
    }

    setFilteredUsers(filtered);
  };

  const handleViewUser = async (user: Profile) => {
    setLoading(true);
    try {
      const [userWithStats, transactions, subscription] = await Promise.all([
        adminService.getUserWithStats(user.id),
        adminService.getUserTransactions(user.id),
        subscriptionService.getUserSubscription(user.id),
      ]);
      setSelectedUser(userWithStats);
      setUserTransactions(transactions);
      setUserSubscription(subscription);
      setUserDialogOpen(true);
    } catch (error) {
      console.error("Error loading user details:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst detaily uživatele",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCredits = async () => {
    if (!selectedUser || !creditAmount) return;

    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount === 0) {
      toast({
        title: "Chyba",
        description: "Zadejte platnou částku",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await adminService.updateUserCredits(
        selectedUser.id,
        amount,
        creditDescription || (amount > 0 ? "Admin přidal kredity" : "Admin odebral kredity")
      );

      toast({
        title: "Úspěch",
        description: `Kredity byly ${amount > 0 ? "přidány" : "odebrány"}`,
      });

      setCreditAmount("");
      setCreditDescription("");
      setCreditsDialogOpen(false);
      loadUsers();
      
      // Refresh user details
      if (userDialogOpen) {
        const updated = await adminService.getUserWithStats(selectedUser.id);
        const updatedTransactions = await adminService.getUserTransactions(selectedUser.id);
        setSelectedUser(updated);
        setUserTransactions(updatedTransactions);
      }
    } catch (error) {
      console.error("Error updating credits:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se aktualizovat kredity",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (user: Profile) => {
    setLoading(true);
    try {
      await adminService.toggleAdminStatus(user.id, !user.is_admin);
      toast({
        title: "Úspěch",
        description: user.is_admin ? "Admin práva odebrána" : "Admin práva přidělena",
      });
      loadUsers();
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, is_admin: !user.is_admin });
      }
    } catch (error) {
      console.error("Error toggling admin:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se změnit admin práva",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBlock = async (user: Profile) => {
    setLoading(true);
    try {
      await adminService.toggleUserBlock(user.id, !user.is_blocked);
      toast({
        title: "Úspěch",
        description: user.is_blocked ? "Uživatel odblokován" : "Uživatel zablokován",
      });
      loadUsers();
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, is_blocked: !user.is_blocked });
      }
    } catch (error) {
      console.error("Error toggling block:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se změnit status blokace",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async (planId: string) => {
    if (!selectedUser) return;

    setChangingPlan(true);
    try {
      await subscriptionService.updateUserSubscription(selectedUser.id, planId);
      toast({
        title: "Plán změněn",
        description: "Plán uživatele byl úspěšně aktualizován",
      });
      
      // Reload user subscription
      const subscription = await subscriptionService.getUserSubscription(selectedUser.id);
      setUserSubscription(subscription);
    } catch (error) {
      console.error("Error changing plan:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se změnit plán",
        variant: "destructive",
      });
    } finally {
      setChangingPlan(false);
    }
  };

  const getActivityStatus = (lastSignIn: string | null) => {
    if (!lastSignIn) return { label: "Nikdy", color: "secondary" };
    
    const now = new Date();
    const signIn = new Date(lastSignIn);
    const daysSince = Math.floor((now.getTime() - signIn.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince === 0) return { label: "Dnes", color: "default" };
    if (daysSince <= 7) return { label: "Tento týden", color: "default" };
    if (daysSince <= 30) return { label: "Tento měsíc", color: "secondary" };
    return { label: `Před ${daysSince} dny`, color: "secondary" };
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hledat podle jména nebo emailu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrovat podle statusu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všichni ({users.length})</SelectItem>
            <SelectItem value="active">Aktivní</SelectItem>
            <SelectItem value="inactive">Neaktivní</SelectItem>
            <SelectItem value="admin">Admini</SelectItem>
            <SelectItem value="blocked">Blokovaní</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Uživatel</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Kredity</TableHead>
              <TableHead className="text-center">Aktivita</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Akce</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "Žádní uživatelé nenalezeni" : "Zatím nemáte žádné uživatele"}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const activity = getActivityStatus(user.last_sign_in_at);
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{user.full_name || "Bez jména"}</p>
                          <p className="text-xs text-muted-foreground">
                            Registrace: {new Date(user.created_at).toLocaleDateString("cs-CZ")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{user.email}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">
                        {user.credits || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={activity.color as any}>
                        {activity.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-1 justify-center">
                        {user.is_admin && (
                          <Badge variant="default" className="bg-primary">
                            <Shield className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {user.is_blocked && (
                          <Badge variant="destructive">
                            <Ban className="h-3 w-3 mr-1" />
                            Blokován
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUser(user)}
                          disabled={loading}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* User Details Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {selectedUser.full_name || "Bez jména"}
                </DialogTitle>
                <DialogDescription>{selectedUser.email}</DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Přehled</TabsTrigger>
                  <TabsTrigger value="transactions">Transakce</TabsTrigger>
                  <TabsTrigger value="actions">Akce</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm font-medium">Základní informace</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium">{selectedUser.email}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Kredity:</span>
                          <span className="font-semibold text-primary">{selectedUser.credits}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Plán:</span>
                          <Badge className={subscriptionService.getPlanBadgeColor(userSubscription?.plan?.tier || "free")}>
                            {subscriptionService.getPlanDisplayName(userSubscription?.plan?.tier || "free")}
                          </Badge>
                        </div>
                        {userSubscription?.expires_at && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Vyprší:</span>
                            <span>{new Date(userSubscription.expires_at).toLocaleDateString("cs-CZ")}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Registrace:</span>
                          <span>{new Date(selectedUser.created_at).toLocaleDateString("cs-CZ")}</span>
                        </div>
                        {selectedUser.last_sign_in_at && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Poslední přihlášení:</span>
                            <span>{new Date(selectedUser.last_sign_in_at).toLocaleDateString("cs-CZ")}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Statistiky použití</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Konverzace</span>
                          </div>
                          <span className="font-semibold">{selectedUser.stats?.total_conversations || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Obrázky</span>
                          </div>
                          <span className="font-semibold">{selectedUser.stats?.total_images || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Videa</span>
                          </div>
                          <span className="font-semibold">{selectedUser.stats?.total_videos || 0}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Finanční statistiky</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-accent" />
                            <span className="text-sm">Celkem připsáno</span>
                          </div>
                          <span className="font-semibold text-accent">
                            {selectedUser.stats?.total_earned || 0} kreditů
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-destructive" />
                            <span className="text-sm">Celkem spotřebováno</span>
                          </div>
                          <span className="font-semibold text-destructive">
                            {selectedUser.stats?.total_spent || 0} kreditů
                          </span>
                        </div>
                        {selectedUser.stats?.last_activity && (
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">Poslední aktivita</span>
                            </div>
                            <span className="text-sm">
                              {new Date(selectedUser.stats.last_activity).toLocaleDateString("cs-CZ")}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Admin práva</span>
                          <Badge variant={selectedUser.is_admin ? "default" : "secondary"}>
                            {selectedUser.is_admin ? (
                              <><Shield className="h-3 w-3 mr-1" />Ano</>
                            ) : (
                              <><ShieldOff className="h-3 w-3 mr-1" />Ne</>
                            )}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Blokace účtu</span>
                          <Badge variant={selectedUser.is_blocked ? "destructive" : "default"}>
                            {selectedUser.is_blocked ? (
                              <><Ban className="h-3 w-3 mr-1" />Blokován</>
                            ) : (
                              <><CheckCircle2 className="h-3 w-3 mr-1" />Aktivní</>
                            )}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Historie transakcí</CardTitle>
                      <CardDescription>Posledních 50 transakcí</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {userTransactions.length === 0 ? (
                          <p className="text-center py-8 text-muted-foreground">
                            Žádné transakce
                          </p>
                        ) : (
                          userTransactions.map((transaction) => (
                            <div
                              key={transaction.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium">{transaction.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(transaction.created_at).toLocaleString("cs-CZ")}
                                </p>
                              </div>
                              <Badge
                                variant={transaction.amount > 0 ? "default" : "secondary"}
                                className={transaction.amount > 0 ? "bg-accent" : ""}
                              >
                                {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                              </Badge>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="actions" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Změnit plán</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                        {availablePlans.map((plan) => {
                          const isCurrent = plan.id === userSubscription?.plan_id;
                          
                          return (
                            <Button
                              key={plan.id}
                              variant={isCurrent ? "outline" : "default"}
                              className="flex flex-col h-auto py-3"
                              disabled={isCurrent || changingPlan}
                              onClick={() => handleChangePlan(plan.id)}
                            >
                              <span className={`text-xs mb-1 ${subscriptionService.getPlanBadgeColor(plan.tier)}`}>
                                {subscriptionService.getPlanDisplayName(plan.tier)}
                              </span>
                              <span className="font-semibold">
                                {plan.price > 0 ? `${plan.price} ${plan.currency}` : "Free"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {plan.credits_included} kreditů
                              </span>
                              {isCurrent && (
                                <span className="text-xs mt-1">Aktuální</span>
                              )}
                            </Button>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Správa kreditů</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Dialog open={creditsDialogOpen} onOpenChange={setCreditsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="w-full">
                            <Coins className="h-4 w-4 mr-2" />
                            Upravit kredity
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Upravit kredity</DialogTitle>
                            <DialogDescription>
                              Přidat nebo odebrat kredity uživateli
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="amount">Počet kreditů</Label>
                              <Input
                                id="amount"
                                type="number"
                                placeholder="např. 100 nebo -50"
                                value={creditAmount}
                                onChange={(e) => setCreditAmount(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Použijte kladné číslo pro přidání, záporné pro odebrání
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="description">Popis</Label>
                              <Input
                                id="description"
                                placeholder="Důvod úpravy..."
                                value={creditDescription}
                                onChange={(e) => setCreditDescription(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              onClick={handleUpdateCredits}
                              disabled={loading || !creditAmount}
                            >
                              {loading ? "Ukládání..." : "Uložit"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Správa oprávnění</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button
                        variant={selectedUser.is_admin ? "destructive" : "default"}
                        className="w-full"
                        onClick={() => handleToggleAdmin(selectedUser)}
                        disabled={loading}
                      >
                        {selectedUser.is_admin ? (
                          <><ShieldOff className="h-4 w-4 mr-2" />Odebrat admin práva</>
                        ) : (
                          <><Shield className="h-4 w-4 mr-2" />Udělit admin práva</>
                        )}
                      </Button>
                      <Button
                        variant={selectedUser.is_blocked ? "default" : "destructive"}
                        className="w-full"
                        onClick={() => handleToggleBlock(selectedUser)}
                        disabled={loading}
                      >
                        {selectedUser.is_blocked ? (
                          <><CheckCircle2 className="h-4 w-4 mr-2" />Odblokovat uživatele</>
                        ) : (
                          <><Ban className="h-4 w-4 mr-2" />Zablokovat uživatele</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}