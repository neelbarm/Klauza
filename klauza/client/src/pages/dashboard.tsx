import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  Clock,
  FileText,
  Shield,
  AlertTriangle,
  Users,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { Contract, Invoice, Client } from "@shared/schema";

interface DashboardStats {
  totalRevenue: number;
  pendingRevenue: number;
  overdueInvoices: number;
  activeContracts: number;
  totalContracts: number;
  activeDisputes: number;
  recoveredAmount: number;
  avgStrength: number;
  totalClients: number;
  atRiskClients: number;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

// Build chart data from real invoices — group by month
function buildRevenueChart(invoices: Invoice[] | undefined) {
  if (!invoices || invoices.length === 0) return [];

  const monthMap: Record<string, { paid: number; pending: number }> = {};

  invoices.forEach((inv) => {
    // Use createdAt or dueDate to determine the month
    const dateStr = inv.dueDate || inv.createdAt || "";
    let date: Date;
    try {
      date = new Date(dateStr);
      if (isNaN(date.getTime())) date = new Date();
    } catch {
      date = new Date();
    }

    const key = date.toLocaleDateString("en-US", { year: "numeric", month: "short" });

    if (!monthMap[key]) monthMap[key] = { paid: 0, pending: 0 };

    if (inv.status === "paid") {
      monthMap[key].paid += inv.amount;
    } else if (inv.status === "sent" || inv.status === "overdue" || inv.status === "draft") {
      monthMap[key].pending += inv.amount;
    }
  });

  // Sort by date and return
  return Object.entries(monthMap)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([month, data]) => ({
      month,
      paid: data.paid,
      pending: data.pending,
    }));
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/dashboard");
      return res.json();
    },
  });

  const { data: contracts } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/contracts");
      return res.json();
    },
  });

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/invoices");
      return res.json();
    },
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clients");
      return res.json();
    },
  });

  // Build chart data from actual invoices
  const chartData = useMemo(() => buildRevenueChart(invoices), [invoices]);
  const hasChartData = chartData.length > 0;

  const statCards = [
    {
      label: "Total Revenue",
      value: stats ? formatCurrency(stats.totalRevenue) : "$0.00",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Pending Revenue",
      value: stats ? formatCurrency(stats.pendingRevenue) : "$0.00",
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      label: "Active Contracts",
      value: stats?.activeContracts ?? 0,
      icon: FileText,
      color: "text-primary",
      bgColor: "bg-primary/5",
    },
    {
      label: "Active Disputes",
      value: stats?.activeDisputes ?? 0,
      icon: Shield,
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="dashboard-page">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your freelance business</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s) => (
          <Card key={s.label} className="bg-card border-border" data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, '-')}`}>
            <CardContent className="p-4">
              {statsLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-xl font-semibold mt-1">{s.value}</p>
                  </div>
                  <div className={`w-8 h-8 rounded-lg ${s.bgColor} flex items-center justify-center`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts + Lists */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasChartData ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barGap={2}>
                    <defs>
                      <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(18, 65%, 47%)" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="hsl(18, 65%, 47%)" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 10%, 83%)" opacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: 'hsl(30, 5%, 40%)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(30, 5%, 40%)' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `$${(v / 100).toLocaleString()}`}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === "paid" ? "Collected" : "Pending",
                      ]}
                      labelStyle={{ fontSize: 12, fontWeight: 600 }}
                      contentStyle={{
                        backgroundColor: 'hsl(30, 15%, 97%)',
                        border: '1px solid hsl(30, 10%, 83%)',
                        borderRadius: '8px',
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="paid"
                      fill="url(#paidGrad)"
                      radius={[4, 4, 0, 0]}
                      name="paid"
                    />
                    <Bar
                      dataKey="pending"
                      fill="hsl(30, 10%, 83%)"
                      radius={[4, 4, 0, 0]}
                      name="pending"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center">
                <BarChart3 className="h-10 w-10 text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground font-medium">No revenue data yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create invoices to see your revenue chart</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* At-risk clients */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              At-Risk Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clients && clients.filter(c => (c.riskScore || 50) >= 70).length > 0 ? (
              <div className="space-y-3">
                {clients.filter(c => (c.riskScore || 50) >= 70).map((client) => (
                  <div key={client.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.company || "No company"}</p>
                    </div>
                    <Badge
                      className={`text-[10px] ${
                        (client.riskScore || 50) >= 70
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : (client.riskScore || 50) >= 40
                          ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                          : "bg-green-100 text-green-700 border border-green-200"
                      }`}
                      data-testid={`badge-risk-${client.id}`}
                    >
                      Risk: {client.riskScore}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No at-risk clients</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Contracts & Invoices */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        {/* Recent Contracts */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            {contracts && contracts.length > 0 ? (
              <div className="space-y-2">
                {contracts.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0" data-testid={`contract-row-${c.id}`}>
                    <div>
                      <p className="text-sm font-medium">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.type} · {formatCurrency(c.totalValue || 0)}</p>
                    </div>
                    <Badge
                      variant={c.status === "signed" ? "default" : c.status === "sent" ? "secondary" : "outline"}
                      className="text-[10px]"
                    >
                      {c.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No contracts yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices && invoices.length > 0 ? (
              <div className="space-y-2">
                {invoices.slice(0, 5).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b border-border last:border-0" data-testid={`invoice-row-${inv.id}`}>
                    <div>
                      <p className="text-sm font-medium">{inv.description || `Invoice #${inv.id}`}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(inv.amount)}</p>
                    </div>
                    <Badge
                      variant={
                        inv.status === "paid" ? "default" :
                        inv.status === "overdue" ? "destructive" :
                        inv.status === "sent" ? "secondary" : "outline"
                      }
                      className="text-[10px]"
                    >
                      {inv.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No invoices yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
