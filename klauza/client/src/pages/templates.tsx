import { useState, useRef } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  FileText,
  Loader2,
  Upload,
  AlertTriangle,
  ShieldCheck,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Wand2,
  Download,
  Save,
  Eye,
} from "lucide-react";
import type { Contract, Client } from "@shared/schema";
import { useUsage } from "@/hooks/use-usage";
import { UpgradePrompt } from "@/components/upgrade-prompt";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

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

function ScoreCircleLarge({ score }: { score: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 70 ? "hsl(142, 71%, 45%)" : score >= 40 ? "hsl(43, 74%, 49%)" : "hsl(0, 72%, 51%)";

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(30, 10%, 83%)" strokeWidth="6" opacity="0.3" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold">{score}</div>
        <div className="text-[10px] text-muted-foreground">/ 100</div>
      </div>
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const variants: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-700 border-red-200",
    HIGH: "bg-red-50 text-red-600 border-red-100",
    MEDIUM: "bg-yellow-100 text-yellow-700 border-yellow-200",
    MED: "bg-yellow-100 text-yellow-700 border-yellow-200",
    LOW: "bg-green-100 text-green-700 border-green-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variants[level] || variants.MEDIUM}`}>
      {level}
    </span>
  );
}

function SuggestedClause({ clause }: { clause: { name: string; text: string; reason: string } }) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(clause.text);
    toast({ title: "Copied!", description: "Clause text copied to clipboard." });
  };

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{clause.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy} className="h-7 text-xs">
              <Copy className="h-3 w-3 mr-1" /> Copy
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setExpanded(!expanded)} className="h-7 w-7 p-0">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{clause.reason}</p>
        {expanded && (
          <div className="mt-3 p-3 bg-muted rounded text-xs font-mono leading-relaxed whitespace-pre-wrap">
            {clause.text}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Expandable risk card component
function RiskCard({ risk }: { risk: any }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-2">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <RiskBadge level={risk.severity} />
            <span className="text-sm font-medium">{risk.category}</span>
          </div>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        {risk.clause && (
          <blockquote className="border-l-2 border-orange-300 pl-3 text-xs text-muted-foreground italic">
            "{risk.clause}"
          </blockquote>
        )}
        {expanded && (
          <>
            <p className="text-xs text-foreground">{risk.explanation}</p>
            <div className="flex items-start gap-2 bg-muted rounded p-2">
              <ShieldCheck className="h-3 w-3 text-primary mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">{risk.recommendation}</p>
            </div>
          </>
        )}
        {!expanded && (
          <p className="text-xs text-muted-foreground line-clamp-1">{risk.explanation}</p>
        )}
      </CardContent>
    </Card>
  );
}

// Generate a downloadable text report from scan results
function generateTextReport(result: any): string {
  const lines: string[] = [];
  lines.push("=".repeat(60));
  lines.push("KLAUZA CONTRACT SCAN REPORT");
  lines.push("=".repeat(60));
  lines.push(`Generated: ${new Date().toLocaleDateString()}`);
  lines.push("");
  lines.push(`Overall Score: ${result.overallScore}/100`);
  lines.push(`Risk Level: ${result.riskLevel}`);
  lines.push("");
  lines.push("SUMMARY");
  lines.push("-".repeat(40));
  lines.push(result.summary || "");
  lines.push("");

  if (result.risks?.length > 0) {
    lines.push("RISKS FOUND");
    lines.push("-".repeat(40));
    result.risks.forEach((r: any, i: number) => {
      lines.push(`${i + 1}. [${r.severity}] ${r.category}`);
      if (r.clause) lines.push(`   Clause: "${r.clause}"`);
      lines.push(`   Issue: ${r.explanation}`);
      lines.push(`   Fix: ${r.recommendation}`);
      lines.push("");
    });
  }

  if (result.missingProtections?.length > 0) {
    lines.push("MISSING PROTECTIONS");
    lines.push("-".repeat(40));
    result.missingProtections.forEach((mp: any, i: number) => {
      lines.push(`${i + 1}. [${mp.importance}] ${mp.protection}`);
      lines.push(`   ${mp.description}`);
      lines.push("");
    });
  }

  if (result.strengths?.length > 0) {
    lines.push("STRENGTHS");
    lines.push("-".repeat(40));
    result.strengths.forEach((s: string) => {
      lines.push(`  + ${s}`);
    });
    lines.push("");
  }

  if (result.suggestedClauses?.length > 0) {
    lines.push("SUGGESTED CLAUSES");
    lines.push("-".repeat(40));
    result.suggestedClauses.forEach((c: any) => {
      lines.push(`## ${c.name}`);
      lines.push(`Reason: ${c.reason}`);
      lines.push("");
      lines.push(c.text);
      lines.push("");
      lines.push("-".repeat(40));
    });
  }

  lines.push("");
  lines.push("Report generated by Klauza - Freelancer Contract Protection");
  return lines.join("\n");
}

// Shared scan results viewer component
function ScanResultsView({ scanResult, onClose }: { scanResult: any; onClose?: () => void }) {
  const { toast } = useToast();

  const handleDownloadReport = () => {
    const report = generateTextReport(scanResult);
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `klauza-scan-report-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded!", description: "Report saved to your device." });
  };

  const handleCopyReport = () => {
    const report = generateTextReport(scanResult);
    navigator.clipboard.writeText(report);
    toast({ title: "Copied!", description: "Full report copied to clipboard." });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold">Scan Results</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyReport}>
            <Copy className="h-3 w-3 mr-1" /> Copy Report
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadReport}>
            <Download className="h-3 w-3 mr-1" /> Download
          </Button>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Score + Risk */}
      <Card className="border-border">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
          <ScoreCircleLarge score={scanResult.overallScore || 0} />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="font-semibold">Contract Safety Score</h3>
              <RiskBadge level={scanResult.riskLevel || "MEDIUM"} />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{scanResult.summary}</p>
          </div>
        </CardContent>
      </Card>

      {/* Risks */}
      {scanResult.risks && scanResult.risks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Risks Found ({scanResult.risks.length})
          </h3>
          {scanResult.risks.map((risk: any, i: number) => (
            <RiskCard key={i} risk={risk} />
          ))}
        </div>
      )}

      {/* Missing Protections */}
      {scanResult.missingProtections && scanResult.missingProtections.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            Missing Protections ({scanResult.missingProtections.length})
          </h3>
          {scanResult.missingProtections.map((mp: any, i: number) => (
            <Card key={i} className="border-border">
              <CardContent className="p-4 flex items-start gap-3">
                <RiskBadge level={mp.importance} />
                <div>
                  <p className="text-sm font-medium">{mp.protection}</p>
                  <p className="text-xs text-muted-foreground mt-1">{mp.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Strengths */}
      {scanResult.strengths && scanResult.strengths.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            Strengths ({scanResult.strengths.length})
          </h3>
          <Card className="border-border">
            <CardContent className="p-4">
              <ul className="space-y-1">
                {scanResult.strengths.map((s: string, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Suggested Clauses */}
      {scanResult.suggestedClauses && scanResult.suggestedClauses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Suggested Clauses to Add ({scanResult.suggestedClauses.length})
          </h3>
          {scanResult.suggestedClauses.map((clause: any, i: number) => (
            <SuggestedClause key={i} clause={clause} />
          ))}
        </div>
      )}

      {/* Raw analysis fallback */}
      {scanResult.rawAnalysis && (
        <Card className="border-border">
          <CardContent className="p-4">
            <p className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">{scanResult.rawAnalysis}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== SCAN TAB ====================
function ScanContractTab() {
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [genProjectDesc, setGenProjectDesc] = useState("");
  const [genClientName, setGenClientName] = useState("");
  const [genProjectValue, setGenProjectValue] = useState("");
  const [genTimeline, setGenTimeline] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedContract, setGeneratedContract] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedContractId, setSavedContractId] = useState<number | null>(null);
  const [overageMode, setOverageMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Scan usage tracking
  const { data: scanUsage } = useQuery<{
    scansUsed: number;
    scansLimit: number;
    scansRemaining: number;
    plan: string;
    resetDate: string | null;
    overagePrice: number;
  }>({
    queryKey: ["/api/scan-usage"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/scan-usage");
      return res.json();
    },
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleScan = async (useOverage = false) => {
    setScanError("");
    setScanning(true);
    setSavedContractId(null);
    try {
      let data: any;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        if (useOverage) formData.append("overage", "true");
        const res = await fetch(`${API_BASE}/api/scan-contract`, {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        if (!res.ok) {
          const err = await res.json();
          if (err.error === "upgrade_required" || err.error === "scan_limit_reached") {
            setScanError(err.message);
            setScanning(false);
            queryClient.invalidateQueries({ queryKey: ["/api/scan-usage"] });
            return;
          }
          throw new Error(err.error || "Scan failed");
        }
        data = await res.json();
      } else if (pastedText.trim()) {
        const body: any = { text: pastedText };
        if (useOverage) body.overage = true;
        const res = await apiRequest("POST", "/api/scan-contract", body);
        data = await res.json();
      } else {
        setScanError("Please upload a file or paste contract text.");
        setScanning(false);
        return;
      }
      setScanResult(data.analysis);
      // Contract is auto-saved by the backend
      if (data.contract?.id) {
        setSavedContractId(data.contract.id);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scan-usage"] });
      setOverageMode(false);
    } catch (err: any) {
      if (err.message?.includes("upgrade_required") || err.message?.includes("scan_limit_reached") || err.message?.includes("used all your scans")) {
        setScanError(err.message);
        queryClient.invalidateQueries({ queryKey: ["/api/scan-usage"] });
      } else {
        setScanError(err.message || "Failed to scan contract.");
      }
    }
    setScanning(false);
  };

  const handleSaveToContracts = async () => {
    if (!scanResult) return;
    setSaving(true);
    try {
      const res = await apiRequest("POST", "/api/contracts", {
        title: file?.name || "Scanned Contract",
        type: "sow",
        status: "draft",
        strengthScore: scanResult.overallScore || 0,
        content: JSON.stringify(scanResult),
      });
      const contract = await res.json();
      setSavedContractId(contract.id);
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({ title: "Saved!", description: "Scan results saved to My Contracts." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleGenerate = async () => {
    if (!genProjectDesc) return;
    setGenerating(true);
    try {
      const res = await apiRequest("POST", "/api/generate-contract", {
        projectDescription: genProjectDesc,
        clientName: genClientName,
        projectValue: genProjectValue ? Math.round(parseFloat(genProjectValue) * 100) : null,
        timeline: genTimeline,
        scanResults: scanResult || undefined,
      });
      const data = await res.json();
      setGeneratedContract(data.contract);
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate contract", variant: "destructive" });
    }
    setGenerating(false);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(generatedContract);
    toast({ title: "Copied!", description: "Contract copied to clipboard." });
  };

  const scansRemaining = scanUsage?.scansRemaining ?? 0;
  const scansLimit = scanUsage?.scansLimit ?? 0;
  const scansUsed = scanUsage?.scansUsed ?? 0;
  const scanPlan = scanUsage?.plan || "free";
  const resetDateStr = scanUsage?.resetDate
    ? new Date(scanUsage.resetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;
  const usagePercent = scansLimit > 0 ? Math.min(100, Math.round((scansUsed / scansLimit) * 100)) : 100;
  const usageColor = scansRemaining === 0 ? "bg-red-500" : scansRemaining <= 3 ? "bg-orange-500" : "bg-green-500";
  const scanDisabled = scansRemaining === 0 && !overageMode;

  return (
    <div className="space-y-6">
      {/* Scan usage bar */}
      {scanUsage && (
        <div className="rounded-lg border border-border p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{scansUsed}/{scansLimit} scans used this month</span>
            {resetDateStr && <span className="text-xs text-muted-foreground">Resets {resetDateStr}</span>}
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full transition-all ${usageColor}`} style={{ width: `${usagePercent}%` }} />
          </div>
        </div>
      )}

      {/* Low scan warning */}
      {scanUsage && scansRemaining > 0 && scansRemaining <= 2 && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-orange-200 bg-orange-50 text-sm">
          <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0" />
          <p className="text-orange-800">You have {scansRemaining} scan{scansRemaining > 1 ? "s" : ""} left this month.{resetDateStr ? ` Scans reset on ${resetDateStr}.` : ""}</p>
        </div>
      )}

      {/* No scans remaining */}
      {scanUsage && scansRemaining === 0 && !scanResult && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
          {scanPlan === "free" ? (
            <UpgradePrompt feature="contract scanning" current={0} limit={0} />
          ) : (
            <>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-800 font-medium">You've used all {scansLimit} scans this month.</p>
              </div>
              <p className="text-xs text-red-700">Pay ${scanUsage.overagePrice} per additional scan or upgrade your plan.</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => setOverageMode(true)}
                >
                  Pay ${scanUsage.overagePrice} to Scan
                </Button>
                <Link href="/dashboard?tab=settings">
                  <Button size="sm" variant="outline">Upgrade Plan</Button>
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {/* Upload / Paste Area */}
      {!scanResult && (
        <Card className="border-border">
          <CardContent className="p-6 space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              {file ? (
                <p className="text-sm font-medium text-primary">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm font-medium">Drop your contract here</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, TXT, or MD — max 10MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setFile(f); setPastedText(""); }
                }}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or paste text</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Textarea
              value={pastedText}
              onChange={(e) => { setPastedText(e.target.value); if (e.target.value) setFile(null); }}
              placeholder="Paste your contract text here..."
              rows={8}
              className="font-mono text-xs"
            />

            {scanError && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <XCircle className="h-4 w-4" />
                {scanError}
              </div>
            )}

            <Button
              onClick={() => handleScan(overageMode)}
              disabled={scanning || (!file && !pastedText.trim()) || scanDisabled}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              {scanning ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing Contract...</>
              ) : overageMode ? (
                <><ShieldCheck className="h-4 w-4 mr-2" /> Scan Contract (${scanUsage?.overagePrice || 10} overage)</>
              ) : (
                <><ShieldCheck className="h-4 w-4 mr-2" /> Scan Contract</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {scanResult && (
        <div className="space-y-4">
          {/* Action bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { setScanResult(null); setFile(null); setPastedText(""); setSavedContractId(null); }}>
                Scan Another
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" /> Auto-saved to My Contracts
              </Badge>
            </div>
          </div>

          <ScanResultsView scanResult={scanResult} />

          {/* CTA: Generate Protective Contract */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6 text-center space-y-3">
              <h3 className="font-semibold">Want a bulletproof contract instead?</h3>
              <p className="text-sm text-muted-foreground">
                {scanResult?.risks?.length > 0
                  ? `Generate a protective contract that specifically addresses the ${scanResult.risks.length} risk${scanResult.risks.length > 1 ? "s" : ""} found in your scan.`
                  : "Generate a fully protective freelance contract with all the clauses you need."}
              </p>
              <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Protective Contract
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Generate Protective Contract</DialogTitle>
                    {scanResult?.risks?.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        AI will address {scanResult.risks.length} identified risk{scanResult.risks.length > 1 ? "s" : ""} and {scanResult.missingProtections?.length || 0} missing protection{(scanResult.missingProtections?.length || 0) !== 1 ? "s" : ""} from your scan.
                      </p>
                    )}
                  </DialogHeader>
                  {!generatedContract ? (
                    <div className="space-y-4 mt-2">
                      <div className="space-y-2">
                        <Label>Project Description *</Label>
                        <Textarea
                          value={genProjectDesc}
                          onChange={(e) => setGenProjectDesc(e.target.value)}
                          placeholder="e.g. Brand identity design including logo, color palette, and brand guidelines"
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Client Name</Label>
                          <Input value={genClientName} onChange={(e) => setGenClientName(e.target.value)} placeholder="Client or company name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Project Value ($)</Label>
                          <Input type="number" step="0.01" value={genProjectValue} onChange={(e) => setGenProjectValue(e.target.value)} placeholder="5000.00" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Timeline</Label>
                        <Input value={genTimeline} onChange={(e) => setGenTimeline(e.target.value)} placeholder="e.g. 4 weeks, starting April 1" />
                      </div>
                      <Button
                        onClick={handleGenerate}
                        disabled={generating || !genProjectDesc}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        {generating ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Contract...</>
                        ) : (
                          <><Wand2 className="h-4 w-4 mr-2" /> Generate Contract</>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-2">
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={handleCopyAll}>
                          <Copy className="h-3 w-3 mr-1" /> Copy All
                        </Button>
                      </div>
                      <Textarea
                        value={generatedContract}
                        readOnly
                        rows={20}
                        className="font-mono text-xs"
                      />
                      <Button variant="outline" onClick={() => setGeneratedContract("")} className="w-full">
                        Generate Another
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ==================== GENERATE TAB ====================
function GenerateContractTab() {
  const [projectDesc, setProjectDesc] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectValue, setProjectValue] = useState("");
  const [timeline, setTimeline] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedContract, setGeneratedContract] = useState("");
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!projectDesc) return;
    setGenerating(true);
    try {
      const res = await apiRequest("POST", "/api/generate-contract", {
        projectDescription: projectDesc,
        clientName,
        projectValue: projectValue ? Math.round(parseFloat(projectValue) * 100) : null,
        timeline,
      });
      const data = await res.json();
      setGeneratedContract(data.contract);
      // Refresh contracts list since backend auto-saves
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate contract", variant: "destructive" });
    }
    setGenerating(false);
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(generatedContract);
    toast({ title: "Copied!", description: "Contract copied to clipboard." });
  };

  return (
    <div className="space-y-6">
      {!generatedContract ? (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              Generate a Protective Freelance Contract
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Project Description *</Label>
              <Textarea
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                placeholder="Describe the work: e.g. Full website redesign including 5 pages, responsive design, and CMS integration"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client Name</Label>
                <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client or company name" />
              </div>
              <div className="space-y-2">
                <Label>Project Value ($)</Label>
                <Input type="number" step="0.01" value={projectValue} onChange={(e) => setProjectValue(e.target.value)} placeholder="5000.00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Timeline</Label>
              <Input value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder="e.g. 6 weeks, starting May 1, 2026" />
            </div>
            <div className="rounded-lg bg-muted p-4 space-y-1">
              <p className="text-xs font-medium">Your contract will include:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {["Kill fee / cancellation policy", "IP ownership (transfers on full payment)", "Net-30 payment terms + 1.5%/mo late fee", "2-round revision limit", "14-day termination clause", "Liability cap", "Dispute resolution"].map((item) => (
                  <li key={item} className="flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating || !projectDesc}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Contract...</>
              ) : (
                <><Wand2 className="h-4 w-4 mr-2" /> Generate Contract</>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">Generated Contract</CardTitle>
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" /> Auto-saved to My Contracts
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyAll}>
                  <Copy className="h-3 w-3 mr-1" /> Copy to Clipboard
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setGeneratedContract("")}>
                  Generate Another
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={generatedContract}
              readOnly
              rows={28}
              className="font-mono text-xs"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function TemplatesPage() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("fixed");
  const [clientId, setClientId] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [killFeePercent, setKillFeePercent] = useState("25");
  const [paymentTerms, setPaymentTerms] = useState("net30");
  const [viewingScanId, setViewingScanId] = useState<number | null>(null);
  const [viewingScanResult, setViewingScanResult] = useState<any>(null);
  const [loadingScan, setLoadingScan] = useState(false);
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
      strengthScore: Math.floor(Math.random() * 40 + 50),
    });
  }

  const handleViewScan = async (contractId: number, content: string | null) => {
    if (!content) return;
    setLoadingScan(true);
    setViewingScanId(contractId);
    try {
      const parsed = JSON.parse(content);
      // Check if it looks like a scan result (has overallScore)
      if (parsed.overallScore !== undefined) {
        setViewingScanResult(parsed);
      } else {
        toast({ title: "No scan data", description: "This contract does not have scan results.", variant: "destructive" });
        setViewingScanId(null);
      }
    } catch {
      toast({ title: "Error", description: "Could not parse scan results.", variant: "destructive" });
      setViewingScanId(null);
    }
    setLoadingScan(false);
  };

  const statusColor = (status: string | null) => {
    switch (status) {
      case "signed": return "default";
      case "sent": return "secondary";
      case "expired": return "destructive";
      default: return "outline";
    }
  };

  // Check if contract has scan results
  const hasScanResults = (contract: Contract): boolean => {
    if (!contract.content) return false;
    try {
      const parsed = JSON.parse(contract.content);
      return parsed.overallScore !== undefined;
    } catch {
      return false;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" data-testid="templates-page">
      <Tabs defaultValue="contracts">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold">Contracts</h1>
            <p className="text-sm text-muted-foreground">Manage, scan, and generate contracts</p>
          </div>
          <div className="flex items-center gap-3">
            {usageData && (
              <Badge variant={usageData.plan === "free" ? "outline" : "default"} className="text-[10px]">
                {usageData.plan === "free"
                  ? `${usageData.usage.contracts}/${usageData.limits.contracts} used`
                  : usageData.plan.toUpperCase()}
              </Badge>
            )}
            <TabsList>
              <TabsTrigger value="contracts">My Contracts</TabsTrigger>
              <TabsTrigger value="scan">Scan Contract</TabsTrigger>
              <TabsTrigger value="generate">Generate</TabsTrigger>
            </TabsList>
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
                {usageData?.plan === "free" && usageData?.usage.contracts >= usageData?.limits.contracts ? (
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

        {/* Tab 1: My Contracts */}
        <TabsContent value="contracts">
          {/* View Scan Dialog */}
          <Dialog open={viewingScanId !== null} onOpenChange={(open) => { if (!open) { setViewingScanId(null); setViewingScanResult(null); } }}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Contract Scan Results</DialogTitle>
              </DialogHeader>
              {loadingScan ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : viewingScanResult ? (
                <ScanResultsView scanResult={viewingScanResult} />
              ) : null}
            </DialogContent>
          </Dialog>

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
                const hasResults = hasScanResults(c);
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
                      {hasResults && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-3 text-xs"
                          onClick={() => handleViewScan(c.id, c.content)}
                        >
                          <Eye className="h-3 w-3 mr-1" /> View Scan Results
                        </Button>
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
        </TabsContent>

        {/* Tab 2: Scan Contract */}
        <TabsContent value="scan">
          <ScanContractTab />
        </TabsContent>

        {/* Tab 3: Generate Contract */}
        <TabsContent value="generate">
          <GenerateContractTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
