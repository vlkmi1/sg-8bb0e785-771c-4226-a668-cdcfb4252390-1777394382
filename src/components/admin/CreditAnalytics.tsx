import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Activity, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CreditData {
  date: string;
  credits_added: number;
  credits_used: number;
  net_credits: number;
  transaction_count: number;
}

interface UsageData {
  description: string;
  usage_count: number;
  total_credits: number;
}

interface StatsCard {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: React.ReactNode;
}

const COLORS = ["#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#3B82F6", "#6366F1"];

export function CreditAnalytics() {
  const [creditData, setCreditData] = useState<CreditData[]>([]);
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const daysAgo = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - daysAgo);

      const { data: creditAnalytics, error: creditError } = await supabase
        .from("admin_credit_analytics")
        .select("*")
        .gte("date", fromDate.toISOString())
        .order("date", { ascending: true });

      if (creditError) throw creditError;

      const { data: usageAnalytics, error: usageError } = await supabase
        .from("admin_usage_by_feature")
        .select("*")
        .gte("date", fromDate.toISOString());

      if (usageError) throw usageError;

      const aggregated = usageAnalytics?.reduce((acc: Record<string, UsageData>, curr) => {
        const key = curr.description || "Unknown";
        if (!acc[key]) {
          acc[key] = {
            description: key,
            usage_count: 0,
            total_credits: 0,
          };
        }
        acc[key].usage_count += curr.usage_count || 0;
        acc[key].total_credits += curr.total_credits || 0;
        return acc;
      }, {});

      setCreditData(creditAnalytics || []);
      setUsageData(Object.values(aggregated || {}).sort((a, b) => b.total_credits - a.total_credits).slice(0, 10));
    } catch (error) {
      console.error("Error loading analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const stats: StatsCard[] = [
    {
      title: "Celková spotřeba",
      value: creditData.reduce((sum, d) => sum + (d.credits_used || 0), 0).toLocaleString("cs-CZ"),
      change: "+12.5%",
      trend: "up",
      icon: <Zap className="h-4 w-4" />,
    },
    {
      title: "Přidané kredity",
      value: creditData.reduce((sum, d) => sum + (d.credits_added || 0), 0).toLocaleString("cs-CZ"),
      change: "+8.2%",
      trend: "up",
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      title: "Průměr/den",
      value: Math.round(creditData.reduce((sum, d) => sum + (d.credits_used || 0), 0) / (creditData.length || 1)).toLocaleString("cs-CZ"),
      change: "-3.1%",
      trend: "down",
      icon: <Activity className="h-4 w-4" />,
    },
    {
      title: "Aktivní uživatelé",
      value: "1,234",
      change: "+18.7%",
      trend: "up",
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold">Analytika spotřeby</h2>
          <p className="text-muted-foreground">Přehled využití kreditů a trendů</p>
        </div>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
          <TabsList>
            <TabsTrigger value="7d">7 dní</TabsTrigger>
            <TabsTrigger value="30d">30 dní</TabsTrigger>
            <TabsTrigger value="90d">90 dní</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, idx) => (
          <Card key={idx}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs flex items-center gap-1 ${stat.trend === "up" ? "text-accent" : "text-destructive"}`}>
                {stat.trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {stat.change} oproti předchozímu období
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Spotřeba kreditů v čase</CardTitle>
            <CardDescription>Denní přehled použitých a přidaných kreditů</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={creditData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit" })}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <Tooltip 
                  labelFormatter={(value) => new Date(value as string).toLocaleDateString("cs-CZ")}
                  formatter={(value: number) => [value.toLocaleString("cs-CZ"), ""]}
                />
                <Legend />
                <Line type="monotone" dataKey="credits_used" stroke="#8B5CF6" name="Použité" strokeWidth={2} />
                <Line type="monotone" dataKey="credits_added" stroke="#10B981" name="Přidané" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Čistá změna kreditů</CardTitle>
            <CardDescription>Rozdíl mezi přidanými a použitými kredity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={creditData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit" })}
                  className="text-xs"
                />
                <YAxis className="text-xs" />
                <Tooltip 
                  labelFormatter={(value) => new Date(value as string).toLocaleDateString("cs-CZ")}
                  formatter={(value: number) => [value.toLocaleString("cs-CZ"), ""]}
                />
                <Bar dataKey="net_credits" fill="#8B5CF6" name="Čistá změna" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Top 10 funkcí podle spotřeby</CardTitle>
          <CardDescription>Nejpoužívanější AI funkce a jejich spotřeba kreditů</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={usageData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" className="text-xs" />
                <YAxis dataKey="description" type="category" width={150} className="text-xs" />
                <Tooltip formatter={(value: number) => value.toLocaleString("cs-CZ")} />
                <Bar dataKey="total_credits" fill="#8B5CF6" name="Kredity" />
              </BarChart>
            </ResponsiveContainer>

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={usageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.description} (${(props.percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8B5CF6"
                  dataKey="total_credits"
                >
                  {usageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => value.toLocaleString("cs-CZ")} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}