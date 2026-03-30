import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Receipt, Loader2, Calendar, DollarSign } from "lucide-react";
import type { Invoice, Client } from "@shared/schema";
import { useUsage } from "@/hooks/use-usage";
import { UpgradePrompt } from "@/components/upgrade-prompt";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function statusBadgeVariant(status: string | null) {
  switch (status) {
    case "paid": return "default";
    case "overdue": return "destructive";
    case "sent": return "secondary";
    case "disputed": return "destructive";
    default: return "outline";
  }
}

export default function InvoicesPage() {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();
  const { data: usageData } = useUsage();

  const { data: invoices, isLoading } = useQuery<Invoice[]>({
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

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/invoices", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setOpen(false);
      resetForm();
      toast({ title: "Invoice created", description: "Your new invoice has been created." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function resetForm() {
    setClientId("");
    setAmount("");
    setDueDate("");
    setDescription("");
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !amount) return;
    createMutation.mutate({
      clientId: Number(clientId),
      amount: Math.round(parseFloat(amount) * 100),
      dueDate: dueDate || null,
      description: description || null,
    });
  }

  const filteredInvoices = invoices?.filter((inv) => {
    if (filter === "all") return true;
    return inv.status === filter;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="invoices-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Invoices</h1>
          <p className="text-sm text-muted-foreground">Track and manage your invoices</p>
        </div>
        <div className="flex items-center gap-3">
          {usageData && (
            <Badge variant={usageData.plan === 'free' ? 'outline' : 'default'} className="text-[10px]">
              {usageData.plan === 'free'
                ? `${usageData.usage.invoices}/${usageData.limits.invoices} used`
                : usageData.plan.toUpperCase()}
            </Badge>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-new-invoice">
                <Plus className="h-4 w-4 mr-2" />
                New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
              </DialogHeader>
              {usageData?.plan === 'free' && usageData?.usage.invoices >= usageData?.limits.invoices ? (
                <UpgradePrompt feature="invoices" current={usageData.usage.invoices} limit={usageData.limits.invoices} />
              ) : (
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-sm">Client</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger data-testid="select-invoice-client">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Amount ($)</Label>
                  <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required data-testid="input-invoice-amount" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} data-testid="input-invoice-due-date" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Invoice description" rows={3} data-testid="input-invoice-description" />
                </div>
                <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={createMutation.isPending} data-testid="button-create-invoice">
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Invoice
                </Button>
              </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "draft", "sent", "paid", "overdue", "disputed"].map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            className={filter === s ? "bg-primary text-primary-foreground" : ""}
            onClick={() => setFilter(s)}
            data-testid={`filter-${s}`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {/* Invoice List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : filteredInvoices && filteredInvoices.length > 0 ? (
        <div className="space-y-3">
          {filteredInvoices.map((inv) => {
            const client = clients?.find((c) => c.id === inv.clientId);
            return (
              <Card key={inv.id} className="bg-card border-border hover:border-primary/30 transition-colors" data-testid={`card-invoice-${inv.id}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">{inv.description || `Invoice #${inv.id}`}</h3>
                      <p className="text-xs text-muted-foreground">
                        {client?.name || "Unknown client"}
                        {inv.dueDate && (
                          <span className="inline-flex items-center gap-1 ml-2">
                            <Calendar className="h-3 w-3" />
                            Due {inv.dueDate}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold">{formatCurrency(inv.amount)}</span>
                    <Badge variant={statusBadgeVariant(inv.status) as any} className="text-[10px]">
                      {inv.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <Receipt className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-medium mb-1">
            {filter === "all" ? "No invoices yet" : `No ${filter} invoices`}
          </h3>
          <p className="text-xs text-muted-foreground">
            {filter === "all" ? "Create your first invoice to get started." : "Try a different filter."}
          </p>
        </div>
      )}
    </div>
  );
}
