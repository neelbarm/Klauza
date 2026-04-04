import { useState, useRef } from "react";
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
import { Plus, Receipt, Loader2, Calendar, DollarSign, Upload, FileText, CheckCircle } from "lucide-react";
import type { Invoice, Client } from "@shared/schema";
import { useUsage } from "@/hooks/use-usage";
import { UpgradePrompt } from "@/components/upgrade-prompt";

const API_BASE = "__PORT_5000__".startsWith("__") ? "" : "__PORT_5000__";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function statusBadgeClass(status: string | null): string {
  switch (status) {
    case "paid": return "bg-green-100 text-green-700 border border-green-200";
    case "overdue": return "bg-red-100 text-red-700 border border-red-200";
    case "disputed": return "bg-red-50 text-red-600 border border-red-100";
    case "sent": return "bg-yellow-100 text-yellow-700 border border-yellow-200";
    case "draft": return "bg-muted text-muted-foreground border border-border";
    default: return "bg-muted text-muted-foreground border border-border";
  }
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

// ==================== UPLOAD INVOICE DIALOG ====================
function UploadInvoiceDialog({ clients }: { clients: Client[] | undefined }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<any>(null);
  const [parseError, setParseError] = useState("");

  // Pre-filled form state
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("sent");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { data: usageData } = useUsage();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/invoices", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setOpen(false);
      resetAll();
      toast({ title: "Invoice created", description: "Invoice imported from scan successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function resetAll() {
    setFile(null);
    setParsed(null);
    setParseError("");
    setClientId("");
    setAmount("");
    setDueDate("");
    setDescription("");
    setStatus("sent");
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  };

  const handleParse = async () => {
    if (!file) return;
    setParsing(true);
    setParseError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE}/api/parse-invoice`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Parse failed");
      }
      const data = await res.json();
      const p = data.parsed;
      setParsed(p);

      // Pre-fill form
      if (p.amount) setAmount(String(p.amount / 100));
      if (p.dueDate) setDueDate(p.dueDate);
      if (p.description) setDescription(p.description);

      // Determine status
      const today = new Date().toISOString().split("T")[0];
      if (p.status === "paid") {
        setStatus("paid");
      } else if (p.dueDate && p.dueDate < today) {
        setStatus("overdue");
      } else {
        setStatus("sent");
      }

      // Match client by name
      if (p.clientName && clients) {
        const match = clients.find(
          (c) => c.name.toLowerCase().includes(p.clientName.toLowerCase()) ||
                 p.clientName.toLowerCase().includes(c.name.toLowerCase())
        );
        if (match) setClientId(String(match.id));
      }
    } catch (err: any) {
      setParseError(err.message || "Failed to parse invoice");
    }
    setParsing(false);
  };

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !amount) return;
    createMutation.mutate({
      clientId: Number(clientId),
      amount: Math.round(parseFloat(amount) * 100),
      dueDate: dueDate || null,
      description: description || null,
      status,
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetAll(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-upload-invoice">
          <Upload className="h-4 w-4 mr-2" />
          Upload Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload &amp; Parse Invoice</DialogTitle>
        </DialogHeader>

        {usageData?.plan === "free" && usageData?.usage.invoices >= usageData?.limits.invoices ? (
          <UpgradePrompt feature="invoices" current={usageData.usage.invoices} limit={usageData.limits.invoices} />
        ) : !parsed ? (
          <div className="space-y-4 mt-2">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              {file ? (
                <p className="text-sm font-medium text-primary">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm font-medium">Drop your invoice PDF here</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF or text file — max 10MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setFile(f);
                }}
              />
            </div>

            {parseError && (
              <p className="text-sm text-destructive">{parseError}</p>
            )}

            <Button
              onClick={handleParse}
              disabled={parsing || !file}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {parsing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Parsing Invoice...</>
              ) : (
                <><Upload className="h-4 w-4 mr-2" /> Parse Invoice</>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-2">
            {/* Parsed data confirmation */}
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="h-4 w-4" />
              Invoice parsed — review and confirm below
            </div>
            {parsed.clientName && (
              <p className="text-xs text-muted-foreground">
                Detected client: <span className="font-medium">{parsed.clientName}</span>
                {parsed.invoiceNumber && <> · Invoice #{parsed.invoiceNumber}</>}
              </p>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Client *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {parsed.clientName && !clientId && (
                  <p className="text-xs text-muted-foreground">No match found for "{parsed.clientName}" — please select manually</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Amount ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Invoice description"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setParsed(null); setFile(null); }}
                >
                  Re-upload
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground"
                  disabled={createMutation.isPending || !clientId || !amount}
                >
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Invoice from Scan
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ==================== MAIN PAGE ====================
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
            <Badge variant={usageData.plan === "free" ? "outline" : "default"} className="text-[10px]">
              {usageData.plan === "free"
                ? `${usageData.usage.invoices}/${usageData.limits.invoices} used`
                : usageData.plan.toUpperCase()}
            </Badge>
          )}
          <UploadInvoiceDialog clients={clients} />
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
              {usageData?.plan === "free" && usageData?.usage.invoices >= usageData?.limits.invoices ? (
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
                    <Badge className={`text-[10px] ${statusBadgeClass(inv.status)}`}>
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
