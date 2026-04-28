import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Download,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loggingService, type LogEntry, type LogLevel, type LogCategory, type LogStatistics } from "@/services/loggingService";

const LOG_LEVEL_CONFIG = {
  error: { icon: AlertTriangle, color: "text-destructive", bgColor: "bg-destructive/10", label: "Error" },
  warning: { icon: AlertTriangle, color: "text-yellow-600", bgColor: "bg-yellow-50 dark:bg-yellow-950", label: "Warning" },
  info: { icon: Info, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950", label: "Info" },
  success: { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950", label: "Success" },
};

const CATEGORY_LABELS: Record<LogCategory, string> = {
  auth: "Autentizace",
  api: "API",
  database: "Databáze",
  payment: "Platby",
  generation: "Generování",
  system: "Systém",
  user_action: "Akce uživatele",
  admin_action: "Admin akce",
};

export function SystemLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [statistics, setStatistics] = useState<LogStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();

  // Filters
  const [levelFilter, setLevelFilter] = useState<LogLevel | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [daysFilter, setDaysFilter] = useState(7);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysFilter);

      const filters: any = {};
      if (levelFilter !== "all") filters.level = levelFilter;
      if (categoryFilter !== "all") filters.category = categoryFilter;
      if (searchTerm) filters.searchTerm = searchTerm;
      filters.startDate = startDate.toISOString();

      const data = await loggingService.getLogs(filters, 100);
      setLogs(data);
    } catch (error) {
      console.error("Error loading logs:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst logy",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [daysFilter, levelFilter, categoryFilter, searchTerm, toast]);

  const loadStatistics = useCallback(async () => {
    try {
      const stats = await loggingService.getStatistics(daysFilter);
      setStatistics(stats);
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  }, [daysFilter]);

  useEffect(() => {
    loadLogs();
    loadStatistics();
  }, [loadLogs, loadStatistics]);

  const handleCleanOldLogs = async () => {
    if (!confirm("Opravdu chcete smazat všechny logy starší než 30 dní?")) return;

    try {
      const deletedCount = await loggingService.cleanOldLogs(30);
      toast({
        title: "Úspěch",
        description: `Smazáno ${deletedCount} logů`,
      });
      loadLogs();
      loadStatistics();
    } catch (error) {
      console.error("Error cleaning logs:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se smazat logy",
        variant: "destructive",
      });
    }
  };

  const handleExportLogs = () => {
    const csv = [
      ["Čas", "Úroveň", "Kategorie", "Zpráva", "Uživatel"].join(","),
      ...logs.map(log => [
        new Date(log.created_at!).toLocaleString("cs-CZ"),
        log.log_level,
        log.category,
        `"${log.message.replace(/"/g, '""')}"`,
        (log as any).profiles?.email || "-",
      ].join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `system-logs-${new Date().toISOString()}.csv`;
    link.click();
  };

  const handleViewDetails = (log: LogEntry) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  const LogLevelBadge = ({ level }: { level: LogLevel }) => {
    const config = LOG_LEVEL_CONFIG[level];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={`${config.bgColor} ${config.color} border-0`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {statistics && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Celkem</p>
                  <p className="text-2xl font-bold">{statistics.total_logs}</p>
                </div>
                <Info className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Chyby</p>
                  <p className="text-2xl font-bold text-destructive">{statistics.errors}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Varování</p>
                  <p className="text-2xl font-bold text-yellow-600">{statistics.warnings}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Info</p>
                  <p className="text-2xl font-bold text-blue-600">{statistics.info}</p>
                </div>
                <Info className="h-8 w-8 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Úspěchy</p>
                  <p className="text-2xl font-bold text-green-600">{statistics.success}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtry a akce</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Úroveň</Label>
              <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Vše</SelectItem>
                  <SelectItem value="error">Chyby</SelectItem>
                  <SelectItem value="warning">Varování</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Úspěchy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Vše</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Časové období</Label>
              <Select value={daysFilter.toString()} onValueChange={(v) => setDaysFilter(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Dnes</SelectItem>
                  <SelectItem value="7">Posledních 7 dní</SelectItem>
                  <SelectItem value="30">Posledních 30 dní</SelectItem>
                  <SelectItem value="90">Posledních 90 dní</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Hledat</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Hledat..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Akce</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadLogs} className="flex-1">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportLogs} className="flex-1">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={handleCleanOldLogs} className="flex-1">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Systémové logy ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Čas</TableHead>
                  <TableHead>Úroveň</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Zpráva</TableHead>
                  <TableHead>Uživatel</TableHead>
                  <TableHead className="text-right">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Načítání...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Žádné logy nenalezeny
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {new Date(log.created_at!).toLocaleString("cs-CZ")}
                      </TableCell>
                      <TableCell>
                        <LogLevelBadge level={log.log_level} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{CATEGORY_LABELS[log.category]}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate">{log.message}</TableCell>
                      <TableCell className="text-sm">
                        {(log as any).profiles?.email || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                        >
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail logu</DialogTitle>
            <DialogDescription>
              Kompletní informace o systémové události
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Čas</Label>
                  <p className="font-mono text-sm">
                    {new Date(selectedLog.created_at!).toLocaleString("cs-CZ")}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Úroveň</Label>
                  <div className="mt-1">
                    <LogLevelBadge level={selectedLog.log_level} />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Kategorie</Label>
                  <p className="text-sm">{CATEGORY_LABELS[selectedLog.category]}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Uživatel</Label>
                  <p className="text-sm">
                    {(selectedLog as any).profiles?.email || "-"}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Zpráva</Label>
                <p className="mt-1 text-sm">{selectedLog.message}</p>
              </div>

              {selectedLog.details && (
                <div>
                  <Label className="text-muted-foreground">Technické detaily</Label>
                  <pre className="mt-1 p-3 bg-muted rounded text-xs overflow-auto max-h-60">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.user_agent && (
                <div>
                  <Label className="text-muted-foreground">User Agent</Label>
                  <p className="mt-1 text-xs text-muted-foreground font-mono">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}