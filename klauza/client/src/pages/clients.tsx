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
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, Loader2, Mail, Building } from "lucide-react";
import type { Client } from "@shared/schema";
import { useUsage } from "@/hooks/use-usage";
import { UpgradePrompt } from "@/components/upgrade-prompt";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function riskBadge(score: number) {
  if (score >= 70) return { variant: "destructive" as const, label: "High Risk" };
  if (score >= 40) return { variant: "secondary" as const, label: "Medium" };
  return { variant: "outline" as const, label: "Low Risk" };
}

export default function ClientsPage() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const { toast } = useToast();
  const { data: usageData } = useUsage();

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clients");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; email?: string; company?: string }) => {
      const res = await apiRequest("POST", "/api/clients", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setOpen(false);
      setName("");
      setEmail("");
      setCompany("");
      toast({ title: "Client added", description: "New client has been added." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    createMutation.mutate({
      name,
      email: email || undefined,
      company: company || undefined,
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="clients-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Clients</h1>
          <p className="text-sm text-muted-foreground">Manage your client relationships</p>
        </div>
        <div className="flex items-center gap-3">
          {usageData && (
            <Badge variant={usageData.plan === 'free' ? 'outline' : 'default'} className="text-[10px]">
              {usageData.plan === 'free'
                ? `${usageData.usage.clients}/${usageData.limits.clients} used`
                : usageData.plan.toUpperCase()}
            </Badge>
          )}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-add-client">
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
              </DialogHeader>
              {usageData?.plan === 'free' && usageData?.usage.clients >= usageData?.limits.clients ? (
                <UpgradePrompt feature="clients" current={usageData.usage.clients} limit={usageData.limits.clients} />
              ) : (
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-sm">Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Client name" required data-testid="input-client-name" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" data-testid="input-client-email" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Company</Label>
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" data-testid="input-client-company" />
                </div>
                <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={createMutation.isPending} data-testid="button-create-client">
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add Client
                </Button>
              </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Client List */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : clients && clients.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => {
            const risk = riskBadge(client.riskScore || 50);
            return (
              <Card key={client.id} className="bg-card border-border hover:border-primary/30 transition-colors" data-testid={`card-client-${client.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold">{client.name}</h3>
                        {client.company && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {client.company}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={risk.variant} className="text-[10px]" data-testid={`badge-client-risk-${client.id}`}>
                      {risk.label}
                    </Badge>
                  </div>
                  {client.email && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                      <Mail className="h-3 w-3" />
                      {client.email}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Revenue</p>
                      <p className="text-sm font-medium">{formatCurrency(client.totalRevenue || 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">Risk Score</p>
                      <p className="text-sm font-medium">{client.riskScore ?? 50}/100</p>
                    </div>
                    <Badge variant={client.status === "active" ? "outline" : client.status === "flagged" ? "destructive" : "secondary"} className="text-[10px]">
                      {client.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-medium mb-1">No clients yet</h3>
          <p className="text-xs text-muted-foreground">Add your first client to get started.</p>
        </div>
      )}
    </div>
  );
}
