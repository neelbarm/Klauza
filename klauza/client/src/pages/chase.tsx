import { useState, useEffect } from "react";
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
  ArrowLeft,
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
  User,
  Mail,
  MapPin,
  Building,
  Calendar,
  Timer,
  Paperclip,
  Scale,
  FileCheck,
} from "lucide-react";
import type { Dispute, Client, Contract, Invoice } from "@shared/schema";
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

function daysUntil(dateStr: string | null): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const EVIDENCE_TYPES = [
  { value: "email", label: "Email / Message" },
  { value: "contract", label: "Contract / Agreement" },
  { value: "invoice", label: "Invoice" },
  { value: "screenshot", label: "Screenshot" },
  { value: "receipt", label: "Payment Receipt" },
  { value: "other", label: "Other Document" },
];

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
interface EvidenceData {
  story: string;
  notes: string;
  defendant: { name: string; email: string; address: string; businessName: string };
  contractId: number | null;
  originalDueDate: string | null;
  state: string | null;
  evidenceFiles: { type: string; description: string; fileName: string | null; addedAt: string }[];
  escalations: any[];
  closeReason: string | null;
  deadlineDate: string | null;
}

function parseEvidence(raw: string | null): EvidenceData {
  const empty: EvidenceData = {
    story: "", notes: "", defendant: { name: "", email: "", address: "", businessName: "" },
    contractId: null, originalDueDate: null, state: null,
    evidenceFiles: [], escalations: [], closeReason: null, deadlineDate: null,
  };
  if (!raw) return empty;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.escalations || parsed.story !== undefined || parsed.defendant) {
      return { ...empty, ...parsed };
    }
    if (Array.isArray(parsed)) return { ...empty, notes: parsed.join("; ") };
  } catch {}
  return { ...empty, notes: raw };
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
                {esc.type === "demand_letter" ? (
                  <FormalLetterLayout text={esc.body} />
                ) : (
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed max-h-72 overflow-y-auto">
                    {esc.body}
                  </pre>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Formal letter layout for demand letters
function FormalLetterLayout({ text }: { text: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 sm:p-8 max-h-[500px] overflow-y-auto">
      <div className="max-w-[600px] mx-auto font-serif">
        {text.split("\n").map((line, i) => {
          const trimmed = line.trim();
          // Bold headings (all caps lines or lines ending with colon)
          if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.startsWith("[") && !trimmed.startsWith("-")) {
            return <p key={i} className="text-xs font-bold text-gray-900 mt-3 mb-1 tracking-wide">{trimmed}</p>;
          }
          // Section dividers
          if (trimmed.startsWith("---") || trimmed.startsWith("===")) {
            return <hr key={i} className="border-gray-300 my-3" />;
          }
          // Signature line
          if (trimmed.startsWith("____")) {
            return <div key={i} className="border-b border-gray-400 w-48 mt-6 mb-2" />;
          }
          // Numbered items
          if (/^\d+\./.test(trimmed)) {
            return <p key={i} className="text-xs text-gray-700 ml-4 mb-1 leading-relaxed">{trimmed}</p>;
          }
          // Empty lines
          if (!trimmed) {
            return <div key={i} className="h-2" />;
          }
          return <p key={i} className="text-xs text-gray-700 leading-relaxed mb-0.5">{line}</p>;
        })}
      </div>
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

// Countdown timer component
function CountdownTimer({ deadlineDate, label }: { deadlineDate: string | null; label?: string }) {
  const remaining = daysUntil(deadlineDate);
  if (!deadlineDate) return null;
  const isOverdue = remaining < 0;
  const isUrgent = remaining >= 0 && remaining <= 3;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium ${
      isOverdue ? "bg-red-50 text-red-700 border border-red-200" :
      isUrgent ? "bg-orange-50 text-orange-700 border border-orange-200" :
      "bg-blue-50 text-blue-700 border border-blue-200"
    }`}>
      <Timer className="h-3 w-3" />
      {isOverdue
        ? `${Math.abs(remaining)}d overdue`
        : remaining === 0 ? "Due today"
        : `${remaining}d ${label || "remaining"}`}
    </div>
  );
}

// Defendant info display
function DefendantInfo({ defendant }: { defendant: EvidenceData["defendant"] }) {
  if (!defendant.name && !defendant.email && !defendant.businessName) return null;

  return (
    <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Defendant Info</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {defendant.name && (
          <div className="flex items-center gap-2 text-xs">
            <User className="h-3 w-3 text-muted-foreground shrink-0" />
            <span>{defendant.name}</span>
          </div>
        )}
        {defendant.businessName && (
          <div className="flex items-center gap-2 text-xs">
            <Building className="h-3 w-3 text-muted-foreground shrink-0" />
            <span>{defendant.businessName}</span>
          </div>
        )}
        {defendant.email && (
          <div className="flex items-center gap-2 text-xs">
            <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
            <span>{defendant.email}</span>
          </div>
        )}
        {defendant.address && (
          <div className="flex items-center gap-2 text-xs">
            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
            <span>{defendant.address}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Evidence files list
function EvidenceFilesList({ files }: { files: EvidenceData["evidenceFiles"] }) {
  if (!files || files.length === 0) return null;

  const typeBadgeColors: Record<string, string> = {
    email: "bg-blue-100 text-blue-700",
    contract: "bg-purple-100 text-purple-700",
    invoice: "bg-green-100 text-green-700",
    screenshot: "bg-yellow-100 text-yellow-700",
    receipt: "bg-emerald-100 text-emerald-700",
    other: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="mt-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Evidence ({files.length})</p>
      <div className="space-y-1.5">
        {files.map((file, i) => (
          <div key={i} className="flex items-center gap-2 text-xs p-2 rounded-md bg-muted/20 border border-border">
            <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
            <Badge className={`text-[9px] ${typeBadgeColors[file.type] || typeBadgeColors.other}`}>
              {file.type}
            </Badge>
            <span className="flex-1 truncate">{file.description}</span>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {file.addedAt ? new Date(file.addedAt).toLocaleDateString() : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Court info panel (shown at Stage 4)
function CourtInfoPanel({ state }: { state: string | null }) {
  const { data: courtInfo } = useQuery({
    queryKey: ["/api/court-info", state],
    queryFn: async () => {
      if (!state) return null;
      const res = await apiRequest("GET", `/api/court-info/${state}`);
      return res.json();
    },
    enabled: !!state,
  });

  if (!courtInfo) return null;

  return (
    <div className="mt-3 p-4 rounded-lg bg-red-50/50 border border-red-200">
      <div className="flex items-center gap-2 mb-3">
        <Scale className="h-4 w-4 text-red-600" />
        <p className="text-xs font-semibold text-red-800">Small Claims Court — {courtInfo.state}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-[10px] text-red-600/70 uppercase">Court</p>
          <p className="text-red-900 font-medium">{courtInfo.courtName}</p>
        </div>
        <div>
          <p className="text-[10px] text-red-600/70 uppercase">Claim Limit</p>
          <p className="text-red-900 font-medium">${courtInfo.limit?.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[10px] text-red-600/70 uppercase">Filing Fee</p>
          <p className="text-red-900">{courtInfo.filingFee}</p>
        </div>
        <div>
          <p className="text-[10px] text-red-600/70 uppercase">Service Fee</p>
          <p className="text-red-900">{courtInfo.serviceFee}</p>
        </div>
        <div>
          <p className="text-[10px] text-red-600/70 uppercase">Statute of Limitations</p>
          <p className="text-red-900">{courtInfo.statute}</p>
        </div>
        <div>
          <p className="text-[10px] text-red-600/70 uppercase">Late Fee Rate</p>
          <p className="text-red-900">{courtInfo.lateFeeRate}</p>
        </div>
      </div>
      {courtInfo.notes && (
        <p className="text-[10px] text-red-700/80 mt-3 italic">{courtInfo.notes}</p>
      )}
    </div>
  );
}

// 4-Step Create Dispute Wizard
function CreateDisputeWizard({
  clients,
  onClose,
}: {
  clients: Client[];
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  // Step 1: What happened
  const [invoiceId, setInvoiceId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [state, setState] = useState("");

  // Step 2: Who owes you
  const [clientId, setClientId] = useState("");
  const [defendantName, setDefendantName] = useState("");
  const [defendantEmail, setDefendantEmail] = useState("");
  const [defendantAddress, setDefendantAddress] = useState("");
  const [defendantBusiness, setDefendantBusiness] = useState("");

  // Step 3: Evidence
  const [evidenceItems, setEvidenceItems] = useState<{ type: string; description: string }[]>([]);
  const [newEvidenceType, setNewEvidenceType] = useState("email");
  const [newEvidenceDesc, setNewEvidenceDesc] = useState("");

  // Auto-fill defendant info from client selection
  const selectedClient = clients.find(c => c.id === Number(clientId));
  useEffect(() => {
    if (selectedClient) {
      if (!defendantName) setDefendantName(selectedClient.name || "");
      if (!defendantEmail) setDefendantEmail(selectedClient.email || "");
      if (!defendantBusiness) setDefendantBusiness(selectedClient.company || "");
    }
  }, [clientId]);

  const { data: contracts } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/contracts");
      return res.json();
    },
  });
  const [contractId, setContractId] = useState("");

  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/invoices");
      return res.json();
    },
  });

  // Auto-fill from selected invoice
  const selectedInvoice = invoices?.find(inv => inv.id === Number(invoiceId));
  useEffect(() => {
    if (selectedInvoice) {
      if (selectedInvoice.amount) setAmount((selectedInvoice.amount / 100).toString());
      if (selectedInvoice.dueDate) setDueDate(selectedInvoice.dueDate);
      if (selectedInvoice.description) setDescription(selectedInvoice.description);
      if (selectedInvoice.clientId) setClientId(String(selectedInvoice.clientId));
    }
  }, [invoiceId]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/disputes", data);
      return res.json();
    },
    onSuccess: async (dispute: any) => {
      // Add evidence items one by one
      for (const item of evidenceItems) {
        try {
          await apiRequest("POST", `/api/disputes/${dispute.id}/evidence`, {
            type: item.type,
            description: item.description,
          });
        } catch {}
      }
      queryClient.invalidateQueries({ queryKey: ["/api/disputes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Dispute created", description: "Chase process has been initiated." });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function addEvidence() {
    if (!newEvidenceDesc.trim()) return;
    setEvidenceItems([...evidenceItems, { type: newEvidenceType, description: newEvidenceDesc.trim() }]);
    setNewEvidenceDesc("");
    setNewEvidenceType("email");
  }

  function removeEvidence(i: number) {
    setEvidenceItems(evidenceItems.filter((_, idx) => idx !== i));
  }

  function handleSubmit() {
    createMutation.mutate({
      clientId: Number(clientId),
      amount: Math.round(parseFloat(amount) * 100),
      description,
      defendantName,
      defendantEmail,
      defendantAddress,
      defendantBusinessName: defendantBusiness,
      contractId: contractId ? Number(contractId) : null,
      invoiceId: invoiceId ? Number(invoiceId) : null,
      dueDate: dueDate || null,
      state: state || null,
    });
  }

  const canProceed = (s: number) => {
    if (s === 1) return description.trim().length > 0 && amount && parseFloat(amount) > 0;
    if (s === 2) return clientId;
    if (s === 3) return true;
    return true;
  };

  const stepTitles = ["What Happened", "Who Owes You", "Evidence", "Review & File"];
  const stepIcons = [FileText, User, Paperclip, FileCheck];

  return (
    <div className="space-y-4">
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4].map((s, i) => {
          const Icon = stepIcons[i];
          return (
            <div key={s} className="flex items-center gap-1">
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] transition-all ${
                s === step ? "bg-primary/10 text-primary font-semibold border border-primary/30" :
                s < step ? "bg-green-50 text-green-700 border border-green-200" :
                "bg-muted/50 text-muted-foreground"
              }`}>
                {s < step ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Icon className="h-3 w-3" />}
                <span className="hidden sm:inline">{stepTitles[i]}</span>
                <span className="sm:hidden">{s}</span>
              </div>
              {i < 3 && <ChevronRight className="h-3 w-3 text-muted-foreground/30" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: What happened */}
      {step === 1 && (
        <div className="space-y-4">
          {invoices && invoices.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Link an Invoice (optional)</Label>
              <Select value={invoiceId} onValueChange={setInvoiceId}>
                <SelectTrigger data-testid="select-dispute-invoice">
                  <SelectValue placeholder="Select an invoice to auto-fill details" />
                </SelectTrigger>
                <SelectContent>
                  {invoices.filter(inv => inv.status !== "paid").map((inv) => (
                    <SelectItem key={inv.id} value={String(inv.id)}>
                      #{inv.id} — {formatCurrency(inv.amount)}{inv.description ? ` — ${inv.description.slice(0, 40)}` : ""} ({inv.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">Selecting an invoice auto-fills amount, due date, and description.</p>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-sm font-medium">What happened? Tell us your story</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="I completed a website redesign for a client in January. The agreed price was $5,000. They approved the final deliverables but have been ghosting me since the invoice was due on Feb 15..."
              rows={4}
              data-testid="input-dispute-story"
            />
            <p className="text-[10px] text-muted-foreground">Be specific: what work was done, what was agreed, and what went wrong.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Amount Owed ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="5000.00"
                required
                data-testid="input-dispute-amount"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Original Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Your State (for jurisdiction)</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Step 2: Who owes you */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger data-testid="select-dispute-client">
                <SelectValue placeholder="Choose existing client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}{c.company ? ` (${c.company})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-3">
            <p className="text-xs font-medium text-muted-foreground">Defendant Details (for letters & legal filings)</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Full Name</Label>
                <Input
                  value={defendantName}
                  onChange={(e) => setDefendantName(e.target.value)}
                  placeholder="John Smith"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Business Name</Label>
                <Input
                  value={defendantBusiness}
                  onChange={(e) => setDefendantBusiness(e.target.value)}
                  placeholder="Acme Corp LLC"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={defendantEmail}
                  onChange={(e) => setDefendantEmail(e.target.value)}
                  placeholder="john@acme.com"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Address</Label>
                <Input
                  value={defendantAddress}
                  onChange={(e) => setDefendantAddress(e.target.value)}
                  placeholder="123 Main St, City, ST 12345"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Link Contract (optional)</Label>
            <Select value={contractId} onValueChange={setContractId}>
              <SelectTrigger>
                <SelectValue placeholder="Link a contract for reference" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No contract</SelectItem>
                {contracts?.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Step 3: Evidence */}
      {step === 3 && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Add evidence to strengthen your case. Each piece of evidence will be referenced in your demand letter.</p>

          {/* Existing items */}
          {evidenceItems.length > 0 && (
            <div className="space-y-2">
              {evidenceItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/30 border border-border text-xs">
                  <Badge variant="outline" className="text-[9px] shrink-0">{item.type}</Badge>
                  <span className="flex-1 truncate">{item.description}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeEvidence(i)}
                  >
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add evidence form */}
          <div className="p-3 rounded-lg border border-dashed border-border space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <Select value={newEvidenceType} onValueChange={setNewEvidenceType}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVIDENCE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Description</Label>
                <div className="flex gap-2">
                  <Input
                    value={newEvidenceDesc}
                    onChange={(e) => setNewEvidenceDesc(e.target.value)}
                    placeholder="e.g. Email confirming deliverables on Jan 20"
                    className="h-8 text-xs"
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEvidence(); } }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs shrink-0"
                    onClick={addEvidence}
                    disabled={!newEvidenceDesc.trim()}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {evidenceItems.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">No evidence added yet. You can skip this step and add evidence later.</p>
          )}
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs font-semibold">Dispute Summary</p>
              <p className="text-lg font-bold text-primary">{amount ? formatCurrency(Math.round(parseFloat(amount) * 100)) : "$0.00"}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted-foreground">Client:</span> {selectedClient?.name || "—"}</div>
              <div><span className="text-muted-foreground">Defendant:</span> {defendantName || "—"}</div>
              {defendantBusiness && <div><span className="text-muted-foreground">Business:</span> {defendantBusiness}</div>}
              {defendantEmail && <div><span className="text-muted-foreground">Email:</span> {defendantEmail}</div>}
              {dueDate && <div><span className="text-muted-foreground">Due Date:</span> {new Date(dueDate).toLocaleDateString()}</div>}
              {state && <div><span className="text-muted-foreground">Jurisdiction:</span> {state}</div>}
              {contractId && contractId !== "none" && <div><span className="text-muted-foreground">Contract:</span> #{contractId}</div>}
              <div><span className="text-muted-foreground">Evidence:</span> {evidenceItems.length} item(s)</div>
            </div>
          </div>

          {description && (
            <div className="p-3 rounded-lg bg-muted/20 border border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Story</p>
              <p className="text-xs">{description.length > 200 ? description.slice(0, 200) + "..." : description}</p>
            </div>
          )}

          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-orange-600 mt-0.5 shrink-0" />
              <div className="text-xs text-orange-800">
                <p className="font-medium mb-1">What happens next:</p>
                <ul className="space-y-0.5 text-orange-700">
                  <li>A 14-day deadline timer starts immediately</li>
                  <li>You can escalate through 4 stages: reminder, notice, demand, small claims</li>
                  <li>Each stage generates professional letters with the info you provided</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => step === 1 ? onClose() : setStep(step - 1)}
        >
          <ArrowLeft className="h-3 w-3 mr-1" />
          {step === 1 ? "Cancel" : "Back"}
        </Button>

        {step < 4 ? (
          <Button
            size="sm"
            className="bg-primary text-primary-foreground"
            disabled={!canProceed(step)}
            onClick={() => setStep(step + 1)}
          >
            Next <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        ) : (
          <Button
            size="sm"
            className="bg-primary text-primary-foreground"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            data-testid="button-create-dispute"
          >
            {createMutation.isPending ? (
              <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Creating...</>
            ) : (
              <><Gavel className="h-3 w-3 mr-1" /> Start Chase</>
            )}
          </Button>
        )}
      </div>
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
    2: "A polite, professional email reminding the client about the outstanding payment. Uses their real name and details. Keeps the tone friendly while establishing a paper trail.",
    3: "A formal notice referencing your contract terms, calculating actual late fees based on your state's rates, and warning of legal escalation.",
    4: "A formal demand letter with full legal language, itemized amounts with late fees, state-specific court references, and a 10-day deadline.",
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
              <h3 className="text-sm font-semibold">
                {evidence.defendant?.name || clientName}
                {evidence.defendant?.businessName ? ` (${evidence.defendant.businessName})` : ""}
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
              {evidence.state && (
                <Badge variant="outline" className="text-[9px]">{evidence.state}</Badge>
              )}
            </div>
            <p className="text-lg font-bold text-primary">{formatCurrency(dispute.amount)}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <p className="text-xs text-muted-foreground">
                Stage {stage}: {stageName}
              </p>
              {days > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {days}d ago
                </span>
              )}
              {evidence.originalDueDate && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Due: {new Date(evidence.originalDueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Countdown + Actions */}
          <div className="flex flex-col items-end gap-2">
            {!isTerminal && evidence.deadlineDate && (
              <CountdownTimer deadlineDate={evidence.deadlineDate} label="to deadline" />
            )}
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
                        {currentEscalation?.type === "demand_letter" ? (
                          <FormalLetterLayout text={currentEscalation.body} />
                        ) : (
                          <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed p-4 bg-muted rounded-lg">
                            {currentEscalation?.body || dispute.demandLetter}
                          </pre>
                        )}
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
        </div>

        {/* Stage visualization */}
        <StageVisualization currentStage={stage} />

        {/* Story excerpt */}
        {evidence.story && (
          <div className="mt-3 p-3 rounded-lg bg-muted/20 border border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Story</p>
            <p className="text-xs text-foreground/80 leading-relaxed">
              {evidence.story.length > 300 ? evidence.story.slice(0, 300) + "..." : evidence.story}
            </p>
          </div>
        )}

        {/* Defendant info */}
        <DefendantInfo defendant={evidence.defendant} />

        {/* Evidence files */}
        <EvidenceFilesList files={evidence.evidenceFiles} />

        {/* Court info panel at Stage 4 */}
        {stage >= 4 && evidence.state && (
          <CourtInfoPanel state={evidence.state} />
        )}

        {/* Escalation history */}
        <EscalationHistory escalations={evidence.escalations} />

        {/* Demand letter (legacy / stage 3+ with no escalation history) */}
        {stage >= 3 && dispute.demandLetter && evidence.escalations.length === 0 && (
          <div className="mt-4">
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
            <FormalLetterLayout text={dispute.demandLetter} />
          </div>
        )}

        {/* Evidence notes (legacy) */}
        {evidence.notes && (
          <div className="mt-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
            <p className="text-xs text-foreground/70">{evidence.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ChasePage() {
  const [open, setOpen] = useState(false);
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
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Start a New Chase</DialogTitle>
              </DialogHeader>
              {usageData?.plan === 'free' && usageData?.usage.disputes >= usageData?.limits.disputes ? (
                <UpgradePrompt feature="disputes" current={usageData.usage.disputes} limit={usageData.limits.disputes} />
              ) : (
                <CreateDisputeWizard
                  clients={clients || []}
                  onClose={() => setOpen(false)}
                />
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
