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
  DialogFooter,
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
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle,
  XCircle,
  Eye,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Clock,
  Ban,
} from "lucide-react";
import type { Dispute, Client } from "@shared/schema";
import { useUsage } from "@/hooks/use-usage";
import { UpgradePrompt } from "@/components/upgrade-prompt";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function daysSince(dateStr: string | null): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
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

// Parse evidence JSON into structured data
function parseEvidence(raw: string | null): { notes: string; escalations: any[]; closeReason: string | null } {
  if (!raw) return { notes: "", escalations: [], closeReason: null };
  try {
    const parsed = JSON.parse(raw);
    if (parsed.escalations) return parsed;
    if (Array.isArray(parsed)) return { notes: parsed.join("; "), escalations: [], closeReason: null };
  } catch {}
  return { notes: raw, escalations: [], closeReason: null };
}

// Escalation history section
function EscalationHistory({ escalations }: { escalations: any[] }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const { toast } = useToast();

  if (escalations.length === 0) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Text copied to clipboard." });
  };

  return (
    <div className="space-y-2 mt-4">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Escalation History</p>
      {escalations.map((esc, i) => {
        const isOpen = expanded === i;
        const stageLabel = stageConfig[esc.stage - 1]?.name || `Stage ${esc.stage}`;
        const StageIcon = stageConfig[esc.stage - 1]?.icon || FileText;
        const stageColor = stageConfig[esc.stage - 1]?.color || "text-muted-foreground";

        return (
          <div key={i} className="border border-border rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpanded(isOpen ? null : i)}
            >
              <div className="flex items-center gap-2">
                <StageIcon className={`h-3.5 w-3.5 ${stageColor}`} />
                <span className="text-xs font-medium">{stageLabel}</span>
                <Badge variant="outline" className="text-[9px]">{esc.type}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {esc.generatedAt ? new Date(esc.generatedAt).toLocaleDateString() : ""}
                </span>
                {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </div>
            </div>
            {isOpen && (
              <div className="border-t border-border p-3 bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">Subject: {esc.subject}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px]"
                    onClick={(e) => { e.stopPropagation(); handleCopy(esc.body); }}
                  >
                    <Copy className="h-2.5 w-2.5 mr-1" /> Copy
                  </Button>
                </div>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed max-h-72 overflow-y-auto">
                  {esc.body}
                </pre>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Stats bar
function StatsBar({ disputes }: { disputes: Dispute[] }) {
  const total = disputes.length;
  const active = disputes.filter(d => d.status === "open" || d.status === "escalated").length;
  const totalAmount = disputes.filter(d => d.status !== "closed").reduce((s, d) => s + d.amount, 0);
  const recovered = disputes.filter(d => d.status === "resolved").reduce((s, d) => s + (d.resolvedAmount || 0), 0);
  const totalDisputed = disputes.reduce((s, d) => s + d.amount, 0);
  const recoveryRate = totalDisputed > 0 ? Math.round((recovered / totalDisputed) * 100) : 0;

  const stats = [
    { label: "Total Disputes", value: String(total), icon: Shield, color: "text-primary" },
    { label: "Active", value: String(active), icon: AlertTriangle, color: "text-orange-500" },
    { label: "In Dispute", value: formatCurrency(totalAmount), icon: DollarSign, color: "text-yellow-500" },
    { label: "Recovered", value: formatCurrency(recovered), icon: TrendingUp, color: "text-green-500" },
    { label: "Recovery Rate", value: `${recoveryRate}%`, icon: CheckCircle, color: "text-blue-500" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {stats.map((s) => (
        <Card key={s.label} className="border-border">
          <CardContent className="p-3 flex items-center gap-3">
            <s.icon className={`h-4 w-4 ${s.color} shrink-0`} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-sm font-semibold">{s.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Dispute card component
function DisputeCard({ dispute, clientName }: { dispute: Dispute; clientName: string }) {
  const stage = dispute.stage || 1;
  const stageName = stageConfig[stage - 1]?.name || "Unknown";
  const evidence = parseEvidence(dispute.evidence);
  const days = daysSince(dispute.createdAt);
  const isTerminal = dispute.status === "resolved" || dispute.status === "closed";
  const { toast } = useToast();

  // Escalation state
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [resolvedAmount, setResolvedAmount] = useState("");
  const [resolveNotes, setResolveNotes] = useState("");
  const [closeReason, setCloseReason] = useState("");

  const escalateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/disputes/${dispute.id}/escalate`);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/disputes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setEscalateOpen(false);
      toast({ title: "Escalated", description: `Dispute escalated to ${data.stageName || "next stage"}.` });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/disputes/${dispute.id}/resolve`, {
        resolvedAmount: Math.round(parseFloat(resolvedAmount || "0") * 100),
        notes: resolveNotes,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disputes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setResolveOpen(false);
      setResolvedAmount("");
      setResolveNotes("");
      toast({ title: "Resolved!", description: "Dispute marked as resolved." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/disputes/${dispute.id}/close`, {
        reason: closeReason,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disputes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setCloseOpen(false);
      setCloseReason("");
      toast({ title: "Closed", description: "Dispute has been closed." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Find the latest escalation text for the current stage
  const currentEscalation = evidence.escalations.find((e: any) => e.stage === stage);

  const handleCopyEmail = () => {
    if (currentEscalation) {
      navigator.clipboard.writeText(currentEscalation.body);
      toast({ title: "Copied!", description: "Email text copied to clipboard." });
    } else if (dispute.demandLetter) {
      navigator.clipboard.writeText(dispute.demandLetter);
      toast({ title: "Copied!", description: "Letter text copied to clipboard." });
    }
  };

  // Next stage info for escalation confirm
  const nextStage = stage + 1;
  const nextStageName = nextStage <= 4 ? stageConfig[nextStage - 1]?.name : null;
  const nextStageDescriptions: Record<number, string> = {
    2: "A polite, professional email reminding the client about the outstanding payment. Keeps the tone friendly while establishing a paper trail.",
    3: "A formal notice that references your contract terms, mentions late fees, and warns of further escalation. More firm in tone.",
    4: "A formal demand letter with legal language threatening small claims court filing if payment is not received within 10 business days.",
  };

  return (
    <Card
      className={`bg-card border-border ${
        dispute.status === "resolved" ? "border-l-4 border-l-green-500" :
        dispute.status === "closed" ? "border-l-4 border-l-gray-400" : ""
      }`}
      data-testid={`card-dispute-${dispute.id}`}
    >
      <CardContent className="p-5">
        {/* Resolved banner */}
        {dispute.status === "resolved" && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-700">RESOLVED</p>
              <p className="text-xs text-green-600">
                Recovered {formatCurrency(dispute.resolvedAmount || 0)} of {formatCurrency(dispute.amount)}
                {dispute.resolvedAt && ` on ${new Date(dispute.resolvedAt).toLocaleDateString()}`}
              </p>
            </div>
            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
              {dispute.amount > 0 ? Math.round(((dispute.resolvedAmount || 0) / dispute.amount) * 100) : 0}% recovered
            </Badge>
          </div>
        )}

        {/* Closed banner */}
        {dispute.status === "closed" && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
            <Ban className="h-4 w-4 text-gray-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600">CLOSED</p>
              {evidence.closeReason && (
                <p className="text-xs text-gray-500">Reason: {evidence.closeReason}</p>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-sm font-semibold">{clientName}</h3>
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
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs text-muted-foreground">
                Stage {stage}: {stageName}
              </p>
              {days > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {days}d ago
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {!isTerminal && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Copy email */}
              {(currentEscalation || dispute.demandLetter) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleCopyEmail}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy Email
                </Button>
              )}

              {/* Preview email */}
              {(currentEscalation || dispute.demandLetter) && (
                <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <Eye className="h-3 w-3 mr-1" /> Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-base">
                        {currentEscalation?.subject || "Demand Letter"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="mt-2">
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed p-4 bg-muted rounded-lg">
                        {currentEscalation?.body || dispute.demandLetter}
                      </pre>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(currentEscalation?.body || dispute.demandLetter || "");
                          toast({ title: "Copied!", description: "Text copied to clipboard." });
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" /> Copy to Clipboard
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Escalate */}
              {stage < 4 && (
                <Dialog open={escalateOpen} onOpenChange={setEscalateOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      data-testid={`button-escalate-${dispute.id}`}
                    >
                      <ArrowRight className="h-3 w-3 mr-1" /> Escalate
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Escalate to {nextStageName}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs font-medium mb-1">What happens next:</p>
                        <p className="text-xs text-muted-foreground">
                          {nextStageDescriptions[nextStage] || "Proceeds to the next enforcement stage."}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                        <span>This action cannot be undone. The generated text will be available for you to copy and send.</span>
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEscalateOpen(false)}>Cancel</Button>
                      <Button
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => escalateMutation.mutate()}
                        disabled={escalateMutation.isPending}
                      >
                        {escalateMutation.isPending ? (
                          <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Escalating...</>
                        ) : (
                          <><ArrowRight className="h-3 w-3 mr-1" /> Confirm Escalation</>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* Resolve */}
              <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" /> Resolve
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Mark as Resolved</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <p className="text-sm text-muted-foreground">
                      Record the resolution for this {formatCurrency(dispute.amount)} dispute with {clientName}.
                    </p>
                    <div className="space-y-2">
                      <Label className="text-sm">Amount Recovered ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={resolvedAmount}
                        onChange={(e) => setResolvedAmount(e.target.value)}
                        placeholder={(dispute.amount / 100).toFixed(2)}
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Original amount: {formatCurrency(dispute.amount)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Notes (optional)</Label>
                      <Textarea
                        value={resolveNotes}
                        onChange={(e) => setResolveNotes(e.target.value)}
                        placeholder="How was it resolved? e.g. Client paid in full after demand letter"
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" size="sm" onClick={() => setResolveOpen(false)}>Cancel</Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => resolveMutation.mutate()}
                      disabled={resolveMutation.isPending}
                    >
                      {resolveMutation.isPending ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Saving...</>
                      ) : (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Mark Resolved</>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Close */}
              <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-destructive">
                    <XCircle className="h-3 w-3 mr-1" /> Close
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Close Dispute</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <p className="text-sm text-muted-foreground">
                      Close this dispute without resolution. This will increase {clientName}'s risk score since the payment was not recovered.
                    </p>
                    <div className="space-y-2">
                      <Label className="text-sm">Reason</Label>
                      <Textarea
                        value={closeReason}
                        onChange={(e) => setCloseReason(e.target.value)}
                        placeholder="e.g. Client went out of business, amount too small to pursue, etc."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCloseOpen(false)}>Cancel</Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => closeMutation.mutate()}
                      disabled={closeMutation.isPending}
                    >
                      {closeMutation.isPending ? (
                        <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Closing...</>
                      ) : (
                        <><XCircle className="h-3 w-3 mr-1" /> Close Dispute</>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        {/* Stage visualization */}
        <StageVisualization currentStage={stage} />

        {/* Escalation history */}
        <EscalationHistory escalations={evidence.escalations} />

        {/* Demand letter (legacy / stage 3+ with no escalation history) */}
        {stage >= 3 && dispute.demandLetter && evidence.escalations.length === 0 && (
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold">Generated Demand Letter</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[10px]"
                onClick={() => {
                  navigator.clipboard.writeText(dispute.demandLetter || "");
                  toast({ title: "Copied!", description: "Letter copied to clipboard." });
                }}
              >
                <Copy className="h-2.5 w-2.5 mr-1" /> Copy
              </Button>
            </div>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {dispute.demandLetter}
            </pre>
          </div>
        )}

        {/* Evidence notes */}
        {evidence.notes && (
          <div className="mt-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Evidence / Notes</p>
            <p className="text-xs text-foreground/70">{evidence.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ChasePage() {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [evidence, setEvidence] = useState("");
  const { toast } = useToast();
  const { data: usageData } = useUsage();

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
      evidence: evidence ? JSON.stringify({ notes: evidence, escalations: [], closeReason: null }) : null,
    });
  }

  const getClientName = (clientId: number) => {
    return clients?.find((c) => c.id === clientId)?.name || "Unknown Client";
  };

  // Gate: free users cannot access Chase at all
  if (usageData?.plan === 'free') {
    return (
      <div className="p-6 max-w-7xl mx-auto" data-testid="chase-page">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Chase</h1>
          <p className="text-sm text-muted-foreground">Enforce payments and manage disputes</p>
        </div>
        <div className="max-w-lg mx-auto mt-12">
          <UpgradePrompt feature="disputes" current={0} limit={0} />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="chase-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Chase</h1>
          <p className="text-sm text-muted-foreground">Enforce payments and manage disputes</p>
        </div>
        <div className="flex items-center gap-3">
          {usageData && (
            <Badge variant={usageData.plan === 'free' ? 'outline' : 'default'} className="text-[10px]">
              {usageData.plan === 'free'
                ? `${usageData.usage.disputes}/${usageData.limits.disputes} used`
                : usageData.plan.toUpperCase()}
            </Badge>
          )}
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
              {usageData?.plan === 'free' && usageData?.usage.disputes >= usageData?.limits.disputes ? (
                <UpgradePrompt feature="disputes" current={usageData.usage.disputes} limit={usageData.limits.disputes} />
              ) : (
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
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats bar */}
      {disputes && disputes.length > 0 && <StatsBar disputes={disputes} />}

      {/* Dispute List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : disputes && disputes.length > 0 ? (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <DisputeCard
              key={dispute.id}
              dispute={dispute}
              clientName={getClientName(dispute.clientId)}
            />
          ))}
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
