import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, FileText, Loader2 } from "lucide-react";
import type { Contract, Client } from "@shared/schema";
import { useUsage } from "@/hooks/use-usage";
import { UpgradePrompt } from "@/components/upgrade-prompt";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function StrengthCircle({ score }: { score: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 70 ? "hsl(142, 71%, 45%)" : score >= 40 ? "hsl(43, 74%, 49%)" : "hsl(0, 72%, 51%)";

  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={radius} fill="none" stroke="hsl(30, 10%, 83%)" strokeWidth="3" opacity="0.3" />
        <circle
          cx="22" cy="22" r={radius} fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-semibold">{score}</span>
    </div>
  );
}

export default function TemplatesPage() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("fixed");
  const [clientId, setClientId] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [killFeePercent, setKillFeePercent] = useState("25");
  const [paymentTerms, setPaymentTerms] = useState("net30");
  const { toast } = useToast();
  const { data: usageData } = useUsage();

  const { data: contracts, isLoading } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/contracts");
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
      const res = await apiRequest("POST", "/api/contracts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setOpen(false);
      resetForm();
      toast({ title: "Contract created", description: "Your new contract has been created." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function resetForm() {
    setTitle("");
    setType("fixed");
    setClientId("");
    setTotalValue("");
    setKillFeePercent("25");
    setPaymentTerms("net30");
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    createMutation.mutate({
      title,
      type,
      clientId: clientId ? Number(clientId) : null,
      totalValue: totalValue ? Math.round(parseFloat(totalValue) * 100) : 0,
      killFeePercent: Number(killFeePercent),
      paymentTerms,
      strengthScore: Math.floor(Math.random() * 40 + 50), // Simulate AI scoring
    });
  }

  const statusColor = (status: string | null) => {
    switch (status) {
      case "signed": return "default";
      case "sent": return "secondary";
      case "expired": return "destructive";
      default: return "outline";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="templates-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Templates</h1>
          <p className="text-sm text-muted-foreground">Manage your contracts and templates</p>
        </div>
        <div className="flex items-center gap-3">
          {usageData && (
            <Badge variant={usageData.plan === 'free' ? 'outline' : 'default'} className="text-[10px]">
              {usageData.plan === 'free'
                ? `${usageData.usage.contracts}/${usageData.limits.contracts} used`
                : usageData.plan.toUpperCase()}
            </Badge>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-new-contract">
                <Plus className="h-4 w-4 mr-2" />
                New Contract
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Contract</DialogTitle>
            </DialogHeader>
            {usageData?.plan === 'free' && usageData?.usage.contracts >= usageData?.limits.contracts ? (
              <UpgradePrompt feature="contracts" current={usageData.usage.contracts} limit={usageData.limits.contracts} />
            ) : (
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label className="text-sm">Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Contract title" required data-testid="input-contract-title" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger data-testid="select-contract-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Price</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="retainer">Retainer</SelectItem>
                    <SelectItem value="sow">Statement of Work</SelectItem>
                    <SelectItem value="nda">NDA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger data-testid="select-contract-client">
                    <SelectValue placeholder="Select client (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Total Value ($)</Label>
                  <Input type="number" step="0.01" value={totalValue} onChange={(e) => setTotalValue(e.target.value)} placeholder="0.00" data-testid="input-contract-value" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Kill Fee %</Label>
                  <Input type="number" value={killFeePercent} onChange={(e) => setKillFeePercent(e.target.value)} placeholder="25" data-testid="input-kill-fee" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Payment Terms</Label>
                <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                  <SelectTrigger data-testid="select-payment-terms">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="net15">Net 15</SelectItem>
                    <SelectItem value="net30">Net 30</SelectItem>
                    <SelectItem value="net45">Net 45</SelectItem>
                    <SelectItem value="net60">Net 60</SelectItem>
                    <SelectItem value="on_receipt">Due on Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={createMutation.isPending} data-testid="button-create-contract">
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Contract
              </Button>
            </form>
            )}
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Contract List */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      ) : contracts && contracts.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {contracts.map((c) => {
            const client = clients?.find((cl) => cl.id === c.clientId);
            return (
              <Card key={c.id} className="bg-card border-border hover:border-primary/30 transition-colors" data-testid={`card-contract-${c.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate">{c.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {c.type} {client ? `· ${client.name}` : ""}
                      </p>
                    </div>
                    <StrengthCircle score={c.strengthScore || 0} />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium">{formatCurrency(c.totalValue || 0)}</span>
                    <Badge variant={statusColor(c.status) as any} className="text-[10px]">
                      {c.status}
                    </Badge>
                  </div>
                  {c.killFeePercent && (
                    <p className="text-[10px] text-muted-foreground mt-2">
                      Kill fee: {c.killFeePercent}% · {c.paymentTerms}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-medium mb-1">No contracts yet</h3>
          <p className="text-xs text-muted-foreground">Create your first contract to get started.</p>
        </div>
      )}
    </div>
  );
}
