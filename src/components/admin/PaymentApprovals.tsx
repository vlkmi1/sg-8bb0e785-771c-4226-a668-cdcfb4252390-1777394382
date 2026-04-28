import { useState, useEffect } from "react";
import { adminService } from "@/services/adminService";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function PaymentApprovals() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = async () => {
    try {
      const data = await adminService.getPendingPayments();
      setPayments(data);
    } catch (error) {
      console.error("Error loading payments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await adminService.approvePayment(id);
      toast({ 
        title: "Platba schválena", 
        description: "Kredity nebo předplatné byly uživateli úspěšně aktivovány." 
      });
      loadPayments();
    } catch (error) {
      console.error("Approval error:", error);
      toast({ 
        title: "Chyba", 
        description: "Nepodařilo se schválit platbu", 
        variant: "destructive" 
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await adminService.rejectPayment(id, "Zamítnuto administrátorem");
      toast({ title: "Platba byla zamítnuta" });
      loadPayments();
    } catch (error) {
      toast({ title: "Chyba", description: "Nepodařilo se zamítnout platbu", variant: "destructive" });
    }
  };

  if (loading) return <div className="py-8 text-center text-muted-foreground">Načítání plateb...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading">
          <Clock className="h-5 w-5 text-orange-500" />
          Schvalování manuálních plateb
        </CardTitle>
        <CardDescription>
          Zde vidíte platby bankovním převodem a QR kódem, které čekají na manuální schválení (po připsání na bankovní účet).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Check className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p>Žádné čekající platby</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Uživatel</TableHead>
                <TableHead>Položka</TableHead>
                <TableHead>Metoda</TableHead>
                <TableHead>Částka</TableHead>
                <TableHead className="text-right">Akce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map(p => (
                <TableRow key={p.id}>
                  <TableCell>{new Date(p.created_at).toLocaleString('cs-CZ')}</TableCell>
                  <TableCell>
                    <div className="font-medium">{p.profiles?.full_name || 'Neznámý uživatel'}</div>
                    <div className="text-xs text-muted-foreground">{p.profiles?.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {p.payment_type === 'credits' ? 'Kredity' : 'Předplatné'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {p.metadata?.plan_name || `${p.metadata?.credits || 0} kr.`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">Převod / QR</Badge>
                  </TableCell>
                  <TableCell className="font-bold">{p.amount} {p.currency}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleReject(p.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(p.id)}>
                        <Check className="h-4 w-4 mr-1" />
                        Schválit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}