import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Plus,
  Shield,
  Loader2,
  MessageSquare,
  FileWarning,
  FileText,
  Gavel,
  ArrowRight,
  ChevronRight,
} from "lucide-react";
import type { Dispute, Client } from "@shared/schema";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

const stageConfig = [
  { num: 1, name: "Friendly Reminder", icon: MessageSquare, color: "text-blue-500" },
  { num: 2, name: "Formal Notice", icon: FileWarning, color: "text-yellow-500" },
  { num: 3, name: "Demand Letter", icon: FileText, color: "text-orange-500" },
  { num: 4, name: "Small Claims", icon: Gavel, color: "text-red-500" },
];

function StageVisualization({ currentStage }: { currentStage: number }) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {stageConfig.map((stage, i) => {
        const isActive = currentStage >= stage.num;
        const isCurrent = currentStage === stage.num;
        return (
          <div key={stage.num} className="flex items-center gap-1 sm:gap-2">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] sm:text-xs transition-all ${
              isCurrent ? "bg-primary/10 text-primary font-semibold border border-primary/30" :
              isActive ? "bg-muted text-foreground" :
              "bg-muted/50 text-muted-foreground"
            }`}>
              <stage.icon className={`h-3 w-3 ${isActive ? stage.color : "text-muted-foreground/50"}`} />
              <span className="hidden sm:inline">{stage.name}</span>
              <span className="sm:hidden">{stage.num}</span>
            </div>
            {i < 3 && <ChevronRight className="h-3 w-3 text-muted-foreground/30" />}
          </div>
        );
      })}
    </div>
  );
}

export default function ChasePage() {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [evidence, setEvidence] = useState("");
  const { toast } = useToast();

  const { data: disputes, isLoading } = useQuery<Dispute[]>({
    queryKey: ["/api/disputes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/disputes");
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
      const res = await apiRequest("POST", "/api/disputes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disputes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setOpen(false);
      resetForm();
      toast({ title: "Dispute created", description: "Chase process has been initiated." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const escalateMutation = useMutation({
    mutationFn: async (disputeId: number) => {
      const res = await apiRequest("POST", `/api/disputes/${disputeId}/escalate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disputes"] });
      toast({ title: "Escalated", description: "Dispute has been escalated to the next stage." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function resetForm() {
    setClientId("");
    setAmount("");
    setEvidence("");
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !amount) return;
    createMutation.mutate({
      clientId: Number(clientId),
      amount: Math.round(parseFloat(amount) * 100),
      evidence: evidence ? JSON.stringify([evidence]) : null,
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="chase-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Chase</h1>
          <p className="text-sm text-muted-foreground">Enforce payments and manage disputes</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-new-dispute">
              <Plus className="h-4 w-4 mr-2" />
              New Dispute
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Dispute</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label className="text-sm">Client</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger data-testid="select-dispute-client">
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
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount owed" required data-testid="input-dispute-amount" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Evidence / Notes</Label>
                <Textarea value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="Describe the situation and evidence..." rows={3} data-testid="input-dispute-evidence" />
              </div>
              <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={createMutation.isPending} data-testid="button-create-dispute">
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Start Chase
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dispute List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : disputes && disputes.length > 0 ? (
        <div className="space-y-4">
          {disputes.map((dispute) => {
            const client = clients?.find((c) => c.id === dispute.clientId);
            const stage = dispute.stage || 1;
            const stageName = stageConfig[stage - 1]?.name || "Unknown";

            return (
              <Card key={dispute.id} className="bg-card border-border" data-testid={`card-dispute-${dispute.id}`}>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-semibold">
                          {client?.name || "Unknown Client"}
                        </h3>
                        <Badge
                          variant={
                            dispute.status === "resolved" ? "default" :
                            dispute.status === "escalated" ? "destructive" :
                            dispute.status === "closed" ? "secondary" : "outline"
                          }
                          className="text-[10px]"
                        >
                          {dispute.status}
                        </Badge>
                      </div>
                      <p className="text-lg font-bold text-primary">{formatCurrency(dispute.amount)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Stage {stage}: {stageName}
                      </p>
                    </div>
                    {dispute.status !== "resolved" && dispute.status !== "closed" && stage < 4 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={() => escalateMutation.mutate(dispute.id)}
                        disabled={escalateMutation.isPending}
                        data-testid={`button-escalate-${dispute.id}`}
                      >
                        {escalateMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4 mr-1" />
                        )}
                        Escalate
                      </Button>
                    )}
                  </div>

                  {/* Stage visualization */}
                  <StageVisualization currentStage={stage} />

                  {/* Demand Letter (stage 3+) */}
                  {stage >= 3 && dispute.demandLetter && (
                    <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="text-xs font-semibold">Generated Demand Letter</span>
                      </div>
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                        {dispute.demandLetter}
                      </pre>
                    </div>
                  )}

                  {/* Evidence */}
                  {dispute.evidence && (
                    <div className="mt-3">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Evidence</p>
                      <p className="text-xs text-foreground/70">
                        {(() => {
                          try {
                            const parsed = JSON.parse(dispute.evidence);
                            return Array.isArray(parsed) ? parsed.join(", ") : dispute.evidence;
                          } catch {
                            return dispute.evidence;
                          }
                        })()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-sm font-medium mb-1">No active disputes</h3>
          <p className="text-xs text-muted-foreground">Start a chase when a client owes you money.</p>
        </div>
      )}
    </div>
  );
}
