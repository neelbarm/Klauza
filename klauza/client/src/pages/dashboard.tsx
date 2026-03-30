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
} from "lucide-react";
import {
  AreaChart,
  Area,
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

// Generate mock revenue chart data
function generateChartData() {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return months.map((m, i) => ({
    month: m,
    revenue: Math.floor(Math.random() * 5000 + 2000) * 100,
    pending: Math.floor(Math.random() * 2000 + 500) * 100,
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

  const chartData = generateChartData();

  const statCards = [
    {
      label: "Total Revenue",
      value: stats ? formatCurrency(stats.totalRevenue) : "$0",
      icon: DollarSign,
      color: "text-green-600",
    },
    {
      label: "Pending Revenue",
      value: stats ? formatCurrency(stats.pendingRevenue) : "$0",
      icon: Clock,
      color: "text-yellow-600",
    },
    {
      label: "Active Contracts",
      value: stats?.activeContracts ?? 0,
      icon: FileText,
      color: "text-primary",
    },
    {
      label: "Active Disputes",
      value: stats?.activeDisputes ?? 0,
      icon: Shield,
      color: "text-red-500",
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
                  <s.icon className={`h-5 w-5 ${s.color}`} />
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
            <CardTitle className="text-sm font-medium">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(18, 65%, 47%)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(18, 65%, 47%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 10%, 83%)" opacity={0.3} />
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
                    tickFormatter={(v) => `$${(v / 100).toFixed(0)}`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ fontSize: 12 }}
                    contentStyle={{
                      backgroundColor: 'hsl(30, 15%, 97%)',
                      border: '1px solid hsl(30, 10%, 83%)',
                      borderRadius: '6px',
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(18, 65%, 47%)"
                    strokeWidth={2}
                    fill="url(#revenueGrad)"
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
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
                    <Badge variant="destructive" className="text-[10px]" data-testid={`badge-risk-${client.id}`}>
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
