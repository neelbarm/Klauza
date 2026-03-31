import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, db } from "./storage";
import { users, insertClientSchema, insertContractSchema, insertInvoiceSchema, insertDisputeSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import multer from "multer";
// pdf-parse doesn't support ESM default exports.
// Use dynamic import wrapper that works in both dev (tsx/ESM) and prod (esbuild/CJS).
async function loadPdfParse() {
  try {
    const mod = await import("pdf-parse");
    return mod.default || mod;
  } catch {
    return null;
  }
}
import path from "path";
import fs from "fs";
import { scanContract, generateProtectiveContract, parseInvoice } from "./ai-scanner";

const FREE_LIMITS = { contracts: 1, invoices: 1, clients: 2, disputes: 0 };

// Small claims court info by state
const COURT_INFO: Record<string, { limit: number; filingFee: string; serviceFee: string; statute: string; lateFeeRate: string; courtName: string; filingUrl: string; notes: string }> = {
  CA: { limit: 12500, filingFee: "$30–$75", serviceFee: "$25–$75", statute: "4 years (written), 2 years (oral)", lateFeeRate: "10% annually", courtName: "California Small Claims Court", filingUrl: "https://www.courts.ca.gov/selfhelp-smallclaims.htm", notes: "No attorneys allowed in small claims. Filing can be done online in some counties." },
  TX: { limit: 20000, filingFee: "$30–$100", serviceFee: "$25–$100", statute: "4 years", lateFeeRate: "18% annually (max)", courtName: "Texas Justice Court (Small Claims)", filingUrl: "https://www.txcourts.gov/programs-services/self-help/", notes: "Attorneys are allowed. Most cases heard within 60 days of filing." },
  FL: { limit: 8000, filingFee: "$55–$300", serviceFee: "$10–$40", statute: "5 years (written), 4 years (oral)", lateFeeRate: "18% annually (max)", courtName: "Florida Small Claims Court", filingUrl: "https://www.flcourts.gov/", notes: "Pre-trial mediation may be required. Attorneys allowed." },
  NY: { limit: 10000, filingFee: "$15–$20", serviceFee: "$0–$25", statute: "6 years", lateFeeRate: "16% annually (max)", courtName: "New York Small Claims Court", filingUrl: "https://nycourts.gov/courts/nyc/smallclaims/", notes: "No attorneys for individuals. Hearings typically within 30 days." },
  PA: { limit: 12000, filingFee: "$50–$100", serviceFee: "$30–$50", statute: "4 years", lateFeeRate: "6% annually", courtName: "Pennsylvania Magisterial District Court", filingUrl: "https://www.pacourts.us/", notes: "Claims filed at local magisterial district court." },
  IL: { limit: 10000, filingFee: "$20–$75", serviceFee: "$20–$60", statute: "10 years (written), 5 years (oral)", lateFeeRate: "9% annually", courtName: "Illinois Small Claims Court", filingUrl: "https://www.illinoiscourts.gov/", notes: "Most counties offer simplified small claims procedure." },
  OH: { limit: 6000, filingFee: "$30–$60", serviceFee: "$10–$25", statute: "8 years (written), 6 years (oral)", lateFeeRate: "8% annually", courtName: "Ohio Small Claims Court", filingUrl: "https://www.supremecourt.ohio.gov/", notes: "No attorneys unless both parties have one." },
  GA: { limit: 15000, filingFee: "$45–$75", serviceFee: "$25–$50", statute: "6 years", lateFeeRate: "7% annually", courtName: "Georgia Magistrate Court", filingUrl: "https://georgiacourts.gov/", notes: "Claims heard in magistrate court. Attorneys allowed." },
  NC: { limit: 10000, filingFee: "$30–$96", serviceFee: "$20–$30", statute: "3 years", lateFeeRate: "8% annually", courtName: "North Carolina Small Claims Court", filingUrl: "https://www.nccourts.gov/", notes: "Magistrate handles small claims. No jury trial." },
  MI: { limit: 6500, filingFee: "$30–$70", serviceFee: "$15–$35", statute: "6 years", lateFeeRate: "7% annually", courtName: "Michigan Small Claims Division", filingUrl: "https://courts.michigan.gov/", notes: "No attorneys allowed. Claims filed at district court." },
  NJ: { limit: 5000, filingFee: "$15–$50", serviceFee: "$10–$20", statute: "6 years", lateFeeRate: "6% annually", courtName: "New Jersey Small Claims Section", filingUrl: "https://www.njcourts.gov/", notes: "Part of the Special Civil Part. Mediation often offered." },
  VA: { limit: 5000, filingFee: "$46–$80", serviceFee: "$12–$25", statute: "5 years (written), 3 years (oral)", lateFeeRate: "6% annually", courtName: "Virginia General District Court", filingUrl: "https://www.vacourts.gov/", notes: "Small claims handled by General District Court." },
  WA: { limit: 10000, filingFee: "$14–$29", serviceFee: "$20–$50", statute: "6 years (written), 3 years (oral)", lateFeeRate: "12% annually", courtName: "Washington Small Claims Court", filingUrl: "https://www.courts.wa.gov/", notes: "No attorneys unless corporation. Very affordable filing." },
  AZ: { limit: 3500, filingFee: "$20–$35", serviceFee: "$15–$40", statute: "6 years (written), 3 years (oral)", lateFeeRate: "10% annually", courtName: "Arizona Justice Court", filingUrl: "https://www.azcourts.gov/", notes: "Low limit but very accessible. No attorneys allowed." },
  MA: { limit: 7000, filingFee: "$40–$60", serviceFee: "$20–$40", statute: "6 years", lateFeeRate: "12% annually", courtName: "Massachusetts Small Claims Session", filingUrl: "https://www.mass.gov/small-claims", notes: "Part of the District or Boston Municipal Court." },
};

// File upload setup
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB max

function checkPlanLimits(req: any, res: any, resource: keyof typeof FREE_LIMITS): boolean {
  const user = req.user!;
  if (user.plan === 'pro' || user.plan === 'enterprise') return true;

  const usage = storage.getUsageStats(user.id);
  if (usage[resource] >= FREE_LIMITS[resource]) {
    res.status(403).json({
      error: "upgrade_required",
      message: `Free plan allows ${FREE_LIMITS[resource]} ${resource}. Upgrade to Pro for unlimited access.`,
      limit: FREE_LIMITS[resource],
      current: usage[resource],
    });
    return false;
  }
  return true;
}

function requireAdmin(req: any, res: any): boolean {
  if (!req.isAuthenticated()) { res.status(401).json({ error: "Unauthorized" }); return false; }
  if (req.user!.role !== 'admin') { res.status(403).json({ error: "Admin access required" }); return false; }
  return true;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ==================== CLIENTS ====================
  app.get("/api/clients", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const list = storage.getClients(req.user!.id);
    res.json(list);
  });

  app.post("/api/clients", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    if (!checkPlanLimits(req, res, 'clients')) return;
    const data = { ...req.body, userId: req.user!.id };
    const parsed = insertClientSchema.safeParse(data);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const client = storage.createClient(parsed.data);
    res.status(201).json(client);
  });

  app.patch("/api/clients/:id", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const updated = storage.updateClient(Number(req.params.id), req.user!.id, req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  // ==================== CONTRACTS ====================
  app.get("/api/contracts", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    res.json(storage.getContracts(req.user!.id));
  });

  app.get("/api/contracts/:id", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const contract = storage.getContract(Number(req.params.id), req.user!.id);
    if (!contract) return res.status(404).json({ error: "Not found" });
    res.json(contract);
  });

  app.post("/api/contracts", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    if (!checkPlanLimits(req, res, 'contracts')) return;
    const data = { ...req.body, userId: req.user!.id };
    const parsed = insertContractSchema.safeParse(data);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const contract = storage.createContract(parsed.data);
    res.status(201).json(contract);
  });

  app.patch("/api/contracts/:id", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const updated = storage.updateContract(Number(req.params.id), req.user!.id, req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  // ==================== INVOICES ====================
  app.get("/api/invoices", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    res.json(storage.getInvoices(req.user!.id));
  });

  app.post("/api/invoices", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    if (!checkPlanLimits(req, res, 'invoices')) return;
    const data = { ...req.body, userId: req.user!.id };
    const parsed = insertInvoiceSchema.safeParse(data);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const invoice = storage.createInvoice(parsed.data);
    res.status(201).json(invoice);
  });

  app.patch("/api/invoices/:id", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const updated = storage.updateInvoice(Number(req.params.id), req.user!.id, req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  // ==================== DISPUTES (CHASE) ====================
  app.get("/api/disputes", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    res.json(storage.getDisputes(req.user!.id));
  });

  app.get("/api/disputes/:id", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const dispute = storage.getDispute(Number(req.params.id), req.user!.id);
    if (!dispute) return res.status(404).json({ error: "Not found" });
    res.json(dispute);
  });

  app.post("/api/disputes", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    if (!checkPlanLimits(req, res, 'disputes')) return;

    const { clientId, amount, description, defendantName, defendantEmail, defendantAddress,
            defendantBusinessName, contractId, dueDate, state } = req.body;

    if (!clientId || !amount) {
      return res.status(400).json({ error: "clientId and amount are required" });
    }

    // Build structured evidence JSON
    const deadlineDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const evidenceEnvelope = {
      story: description || "",
      notes: "",
      defendant: {
        name: defendantName || "",
        email: defendantEmail || "",
        address: defendantAddress || "",
        businessName: defendantBusinessName || "",
      },
      contractId: contractId ? Number(contractId) : null,
      originalDueDate: dueDate || null,
      state: state || null,
      evidenceFiles: [],
      escalations: [],
      closeReason: null,
      deadlineDate,
    };

    const data = {
      userId: req.user!.id,
      clientId: Number(clientId),
      amount: Number(amount),
      evidence: JSON.stringify(evidenceEnvelope),
    };
    const parsed = insertDisputeSchema.safeParse(data);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const dispute = storage.createDispute(parsed.data);
    res.status(201).json(dispute);
  });

  app.patch("/api/disputes/:id", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const updated = storage.updateDispute(Number(req.params.id), req.user!.id, req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  });

  // Helper: parse the evidence JSON envelope (or migrate old format)
  function parseEvidenceData(raw: string | null): {
    story: string; notes: string; defendant: { name: string; email: string; address: string; businessName: string };
    contractId: number | null; originalDueDate: string | null; state: string | null;
    evidenceFiles: any[]; escalations: any[]; closeReason: string | null; deadlineDate: string | null;
  } {
    const empty = {
      story: "", notes: "", defendant: { name: "", email: "", address: "", businessName: "" },
      contractId: null, originalDueDate: null, state: null,
      evidenceFiles: [], escalations: [], closeReason: null, deadlineDate: null,
    };
    if (!raw) return empty;
    try {
      const parsed = JSON.parse(raw);
      // New structured format with escalations
      if (parsed.escalations || parsed.story !== undefined || parsed.defendant) {
        return { ...empty, ...parsed };
      }
      // Old format: array of strings
      if (Array.isArray(parsed)) return { ...empty, notes: parsed.join("; ") };
    } catch {}
    return { ...empty, notes: raw };
  }

  // Generate stage-specific escalation text with defendant info and state data
  function generateEscalationText(
    stage: number,
    amount: number,
    clientName: string,
    evidenceData?: ReturnType<typeof parseEvidenceData>,
  ): { type: string; subject: string; body: string } {
    const amountStr = `$${(amount / 100).toFixed(2)}`;
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const defendant = evidenceData?.defendant;
    const defName = defendant?.name || clientName;
    const defEmail = defendant?.email || "[DEFENDANT EMAIL]";
    const defAddress = defendant?.address || "[DEFENDANT ADDRESS]";
    const defBusiness = defendant?.businessName || "";
    const dueDate = evidenceData?.originalDueDate
      ? new Date(evidenceData.originalDueDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : "[DUE DATE]";
    const stateCode = evidenceData?.state?.toUpperCase() || null;
    const courtInfo = stateCode ? COURT_INFO[stateCode] : null;
    const story = evidenceData?.story || "";

    // Calculate days overdue and late fees
    let daysOverdue = 0;
    if (evidenceData?.originalDueDate) {
      daysOverdue = Math.max(0, Math.floor((Date.now() - new Date(evidenceData.originalDueDate).getTime()) / (1000 * 60 * 60 * 24)));
    }
    const lateFeeRate = courtInfo?.lateFeeRate || "1.5% per month";
    const dailyRate = parseFloat(lateFeeRate) / 365;
    const lateFeeAmount = Math.round((amount * dailyRate * daysOverdue) / 100);
    const lateFeeStr = `$${(lateFeeAmount / 100).toFixed(2)}`;
    const totalWithFees = `$${((amount + lateFeeAmount) / 100).toFixed(2)}`;

    // Reference to contract if available
    const contractRef = evidenceData?.contractId ? `Contract #${evidenceData.contractId}` : "our agreement";

    // Evidence summary
    const evidenceFiles = evidenceData?.evidenceFiles || [];
    const evidenceSummary = evidenceFiles.length > 0
      ? "\n\nSUPPORTING EVIDENCE ON FILE:\n" + evidenceFiles.map((ef: any, i: number) => `  ${i + 1}. [${ef.type.toUpperCase()}] ${ef.description}`).join("\n")
      : "";

    if (stage === 2) {
      return {
        type: "email",
        subject: `Friendly Reminder: Outstanding Payment of ${amountStr}`,
        body: `Hi ${defName},

I hope you're doing well! I wanted to follow up regarding the outstanding balance of ${amountStr} for the work I completed${defBusiness ? ` for ${defBusiness}` : ""}.

${story ? `As a reminder, this payment relates to: ${story}\n\n` : ""}I understand things get busy, and this may have simply slipped through the cracks. If you've already sent the payment, please disregard this message.

If there are any issues with the invoice or if you'd like to discuss a payment arrangement, I'm happy to chat. I value our working relationship and want to make sure we're on the same page.

Could you let me know when I can expect the payment?

Best regards,
[YOUR NAME]

---
Amount Due: ${amountStr}
Original Due Date: ${dueDate}
Days Overdue: ${daysOverdue > 0 ? `${daysOverdue} days` : "N/A"}
Date of This Notice: ${today}
Reference: ${contractRef}`,
      };
    }

    if (stage === 3) {
      return {
        type: "email",
        subject: `Formal Notice: Payment of ${amountStr} Now ${daysOverdue} Days Overdue`,
        body: `Dear ${defName},${defBusiness ? `\n${defBusiness}` : ""}${defAddress && defAddress !== "[DEFENDANT ADDRESS]" ? `\n${defAddress}` : ""}

I am writing to formally notify you that payment of ${amountStr} remains outstanding and is now ${daysOverdue > 0 ? `${daysOverdue} days` : "significantly"} overdue.

Per the terms of ${contractRef}, this payment was due on ${dueDate}. Despite my previous reminder, I have not received payment or a response addressing this matter.

${story ? `BACKGROUND:\n${story}\n\n` : ""}Please be advised of the following:

1. The full amount of ${amountStr} is due immediately.
2. Per ${stateCode ? `${stateCode} state law` : "our contract terms"}, late payments are subject to interest at ${lateFeeRate}.${daysOverdue > 0 ? ` Accrued late fees to date: ${lateFeeStr}. Total now owed: ${totalWithFees}.` : ""}
3. I reserve the right to suspend any ongoing or future work until this balance is resolved.
4. I retain all intellectual property rights to the delivered work until full payment is received.

I strongly encourage you to resolve this matter within 5 business days. If there are circumstances affecting your ability to pay, please contact me to discuss a payment plan.

Failure to respond or remit payment will result in further escalation, including a formal demand letter with legal deadlines.${evidenceSummary}

Sincerely,
[YOUR NAME]

---
Amount Due: ${amountStr}
Late Fees Accrued: ${lateFeeStr}
Total Owed: ${totalWithFees}
Original Due Date: ${dueDate}
Days Overdue: ${daysOverdue}
Date of This Notice: ${today}
Reference: ${contractRef}`,
      };
    }

    if (stage === 4) {
      const courtName = courtInfo?.courtName || "Small Claims Court in [YOUR JURISDICTION]";
      const filingUrl = courtInfo?.filingUrl || "";
      const courtLimit = courtInfo?.limit || 10000;

      return {
        type: "demand_letter",
        subject: `FORMAL DEMAND FOR PAYMENT — ${totalWithFees}`,
        body: `FORMAL DEMAND LETTER

Date: ${today}

VIA CERTIFIED MAIL / EMAIL WITH READ RECEIPT

TO: ${defName}${defBusiness ? `\n    d/b/a ${defBusiness}` : ""}
    ${defAddress && defAddress !== "[DEFENDANT ADDRESS]" ? defAddress : "[DEFENDANT ADDRESS]"}
    ${defEmail && defEmail !== "[DEFENDANT EMAIL]" ? defEmail : ""}

FROM: [YOUR NAME]
      [YOUR ADDRESS]
      [YOUR EMAIL]

RE: FORMAL AND FINAL DEMAND FOR PAYMENT OF ${totalWithFees}

Dear ${defName},

This letter constitutes a formal and final demand for payment in connection with ${contractRef} for professional services rendered.

STATEMENT OF FACTS:
${story || "I performed the agreed-upon professional services in full and delivered all specified work product as required under our agreement."}

Payment of ${amountStr} was due on ${dueDate} and remains unpaid as of the date of this letter — now ${daysOverdue > 0 ? `${daysOverdue} days` : "significantly"} past due.

AMOUNT OWED:
  Principal Amount:        ${amountStr}
  Late Fees (${lateFeeRate}):  ${lateFeeStr}
  ─────────────────────────────
  TOTAL DUE:               ${totalWithFees}

Late fees continue to accrue at ${lateFeeRate} per ${stateCode ? `${stateCode} state law` : "the terms of our agreement"}.

DEMAND:
I hereby demand full payment of ${totalWithFees} within ten (10) calendar days of your receipt of this letter. Payment should be directed to [YOUR PAYMENT DETAILS].

CONSEQUENCES OF NON-PAYMENT:
If I do not receive full payment by the deadline stated above, I intend to pursue all available legal remedies without further notice, including but not limited to:

  1. Filing a claim in ${courtName}${amount / 100 <= courtLimit ? ` (your debt of ${amountStr} is within the ${stateCode || "state"} limit of $${courtLimit.toLocaleString()})` : ""}
  2. Reporting the outstanding debt to business credit bureaus (Dun & Bradstreet, Experian Business)
  3. Engaging a licensed collections agency
  4. Seeking recovery of the full amount plus court filing fees, service costs, interest, and any attorney's fees as permitted by law
  5. Pursuing a default judgment if you fail to appear

INTELLECTUAL PROPERTY:
Per ${contractRef}, all intellectual property rights to the delivered work product remain with me until full payment is received. Any continued use of my work product without payment constitutes unauthorized use and may give rise to additional claims.
${evidenceSummary}

I strongly urge you to treat this matter with the urgency it deserves. I remain open to discussing a reasonable payment arrangement if you contact me within five (5) business days.

This letter is written without prejudice to any and all rights and remedies available to me under ${stateCode ? `the laws of the State of ${stateCode}` : "applicable law"} and ${contractRef}, all of which are expressly reserved.

Govern yourself accordingly.

Sincerely,

____________________________
[YOUR NAME]
[YOUR EMAIL]
[YOUR PHONE]
${stateCode ? `\nJurisdiction: State of ${stateCode}` : ""}

---
IMPORTANT: Keep a copy of this letter for your records.
Send via certified mail or email with delivery/read receipt.
${filingUrl ? `Small claims filing info: ${filingUrl}` : ""}
This notice satisfies the pre-suit demand requirement in most jurisdictions.`,
      };
    }

    // Small Claims Prep (shown at stage 4 alongside demand letter)
    const courtName = courtInfo?.courtName || "your local Small Claims Court";
    const filingFee = courtInfo?.filingFee || "$30–$100";
    const serviceFee = courtInfo?.serviceFee || "$20–$75";
    const statute = courtInfo?.statute || "typically 2-6 years for contract claims";
    const courtLimit = courtInfo?.limit || 10000;
    const courtNotes = courtInfo?.notes || "";
    const filingUrl = courtInfo?.filingUrl || "[your local court website]";

    return {
      type: "checklist",
      subject: `Small Claims Court Preparation — ${stateCode || "Your State"}`,
      body: `SMALL CLAIMS COURT PREPARATION CHECKLIST
${"=".repeat(50)}

Plaintiff: [YOUR NAME]
Defendant: ${defName}${defBusiness ? ` (d/b/a ${defBusiness})` : ""}
Defendant Address: ${defAddress && defAddress !== "[DEFENDANT ADDRESS]" ? defAddress : "[VERIFY ADDRESS BEFORE FILING]"}
Dispute Amount: ${amountStr} (+ ${lateFeeStr} in late fees = ${totalWithFees})
${stateCode ? `Jurisdiction: State of ${stateCode}` : ""}
${stateCode ? `Court: ${courtName}` : ""}
Date Prepared: ${today}

${stateCode ? `STATE-SPECIFIC INFO (${stateCode}):\n${courtNotes}\n` : ""}
BEFORE YOU FILE:
[${amount / 100 <= courtLimit ? "x" : " "}] Amount (${amountStr}) is within ${stateCode || "your state"}'s small claims limit ($${courtLimit.toLocaleString()})
[ ] Verified the correct legal name and address of ${defName}${defBusiness ? ` / ${defBusiness}` : ""}
[ ] Confirmed statute of limitations has not expired (${stateCode || "your state"}: ${statute})
[ ] Sent formal demand letter with proof of delivery (required in most states)

DOCUMENTS TO GATHER:
[ ] Original signed contract or agreement${evidenceData?.contractId ? ` (Contract #${evidenceData.contractId})` : ""}
[ ] All invoices sent (with dates and amounts)
[ ] Proof of work delivered (screenshots, files, emails)
[ ] All email correspondence with ${defName}
[ ] Copy of Friendly Reminder sent (Stage 2 escalation)
[ ] Copy of Formal Notice sent (Stage 3 escalation)
[ ] Copy of Demand Letter sent (Stage 4 escalation) — WITH proof of delivery
[ ] Any responses from ${defName}
[ ] Bank/payment records showing no payment received
[ ] Complete timeline of events${evidenceFiles.length > 0 ? `\n[ ] Your ${evidenceFiles.length} evidence file(s) already on record` : ""}

HOW TO FILE:
1. Visit ${filingUrl}
2. Fill out the plaintiff's claim form ("Statement of Claim" or "Complaint")
3. Pay the filing fee (${filingFee} — recoverable if you win)
4. Have ${defName} served with court papers (${serviceFee} service fee)
   - Must use proper service method: sheriff, process server, or certified mail
5. Attend the hearing on the scheduled date

AT THE HEARING:
[ ] Bring 3 copies of ALL documents (you, judge, defendant)
[ ] Prepare a 2-3 minute factual summary:
    - What was agreed (${contractRef})
    - Work delivered and when
    - Payment of ${amountStr} was due ${dueDate}
    - ${daysOverdue > 0 ? `Payment is now ${daysOverdue} days overdue` : "Payment was never received"}
    - Escalation steps taken (friendly reminder → formal notice → demand letter)
[ ] Be professional and factual — judges appreciate brevity
[ ] Bring witnesses if applicable

ESTIMATED COSTS:
- Filing fee: ${filingFee}
- Service fee: ${serviceFee}
- Your time: 1-2 half days total
- Potential recovery: ${totalWithFees} + filing costs + service costs

NOTE: Klauza provides this checklist for informational purposes only. This is not legal advice. Consider consulting with a legal professional for specific guidance.`,
    };
  }

  // Escalate dispute to next stage
  app.post("/api/disputes/:id/escalate", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const dispute = storage.getDispute(Number(req.params.id), req.user!.id);
    if (!dispute) return res.status(404).json({ error: "Not found" });
    if (dispute.status === "resolved" || dispute.status === "closed") {
      return res.status(400).json({ error: "Cannot escalate a resolved or closed dispute" });
    }
    if ((dispute.stage || 1) >= 4) return res.status(400).json({ error: "Already at maximum escalation" });

    const stageNames = ["", "Friendly Reminder", "Formal Notice", "Demand Letter", "Small Claims Prep"];
    const currentStage = dispute.stage || 1;
    const nextStage = currentStage + 1;

    // Get client name for templates
    const client = storage.getClient(dispute.clientId, req.user!.id);
    const clientName = client?.name || "[CLIENT NAME]";

    // Build escalation history
    const evidenceData = parseEvidenceData(dispute.evidence);

    // Generate the escalation text with full context
    const escalation = generateEscalationText(nextStage, dispute.amount, clientName, evidenceData);
    evidenceData.escalations.push({
      stage: nextStage,
      type: escalation.type,
      subject: escalation.subject,
      body: escalation.body,
      generatedAt: new Date().toISOString(),
    });

    // Store the demand letter text for backwards compat
    let demandLetter = dispute.demandLetter;
    if (nextStage >= 3) {
      demandLetter = escalation.body;
    }

    const updated = storage.updateDispute(Number(req.params.id), req.user!.id, {
      stage: nextStage,
      status: nextStage >= 3 ? "escalated" : "open",
      demandLetter,
      evidence: JSON.stringify(evidenceData),
    });
    res.json({ ...updated, stageName: stageNames[nextStage], escalation });
  });

  // Resolve a dispute (client paid)
  app.post("/api/disputes/:id/resolve", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const dispute = storage.getDispute(Number(req.params.id), req.user!.id);
    if (!dispute) return res.status(404).json({ error: "Not found" });
    if (dispute.status === "resolved") return res.status(400).json({ error: "Already resolved" });
    if (dispute.status === "closed") return res.status(400).json({ error: "Dispute is closed" });

    const { resolvedAmount, notes } = req.body;
    if (resolvedAmount === undefined || resolvedAmount === null) {
      return res.status(400).json({ error: "resolvedAmount is required" });
    }

    const evidenceData = parseEvidenceData(dispute.evidence);
    if (notes) {
      evidenceData.notes = evidenceData.notes ? `${evidenceData.notes}\n\nResolution notes: ${notes}` : `Resolution notes: ${notes}`;
    }

    const updated = storage.updateDispute(Number(req.params.id), req.user!.id, {
      status: "resolved",
      resolvedAmount: Number(resolvedAmount),
      resolvedAt: new Date().toISOString(),
      evidence: JSON.stringify(evidenceData),
    });

    // Decrease client risk score (they paid)
    if (dispute.clientId) {
      const client = storage.getClient(dispute.clientId, req.user!.id);
      if (client) {
        const newRisk = Math.max(0, (client.riskScore || 50) - 10);
        storage.updateClient(dispute.clientId, req.user!.id, { riskScore: newRisk });
      }
    }

    res.json(updated);
  });

  // Close a dispute without resolution
  app.post("/api/disputes/:id/close", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const dispute = storage.getDispute(Number(req.params.id), req.user!.id);
    if (!dispute) return res.status(404).json({ error: "Not found" });
    if (dispute.status === "resolved") return res.status(400).json({ error: "Cannot close a resolved dispute" });
    if (dispute.status === "closed") return res.status(400).json({ error: "Already closed" });

    const { reason } = req.body;

    const evidenceData = parseEvidenceData(dispute.evidence);
    evidenceData.closeReason = reason || "Closed without resolution";

    const updated = storage.updateDispute(Number(req.params.id), req.user!.id, {
      status: "closed",
      evidence: JSON.stringify(evidenceData),
    });

    // Increase client risk score (they didn't pay)
    if (dispute.clientId) {
      const client = storage.getClient(dispute.clientId, req.user!.id);
      if (client) {
        const newRisk = Math.min(100, (client.riskScore || 50) + 15);
        storage.updateClient(dispute.clientId, req.user!.id, { riskScore: newRisk });
      }
    }

    res.json(updated);
  });

  // Get all escalation emails/letters for a dispute
  app.get("/api/disputes/:id/emails", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const dispute = storage.getDispute(Number(req.params.id), req.user!.id);
    if (!dispute) return res.status(404).json({ error: "Not found" });

    const evidenceData = parseEvidenceData(dispute.evidence);
    res.json(evidenceData.escalations || []);
  });

  // Add evidence to a dispute
  app.post("/api/disputes/:id/evidence", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const dispute = storage.getDispute(Number(req.params.id), req.user!.id);
    if (!dispute) return res.status(404).json({ error: "Not found" });

    const { type, description: desc, fileName } = req.body;
    if (!type || !desc) return res.status(400).json({ error: "type and description are required" });

    const evidenceData = parseEvidenceData(dispute.evidence);
    evidenceData.evidenceFiles.push({
      type, // e.g. "email", "contract", "screenshot", "invoice", "message"
      description: desc,
      fileName: fileName || null,
      addedAt: new Date().toISOString(),
    });

    const updated = storage.updateDispute(Number(req.params.id), req.user!.id, {
      evidence: JSON.stringify(evidenceData),
    });
    res.json(updated);
  });

  // Court info by state
  app.get("/api/court-info/:state", (req, res) => {
    const state = req.params.state.toUpperCase();
    const info = COURT_INFO[state];
    if (!info) return res.status(404).json({ error: "No court info available for this state" });
    res.json({ state, ...info });
  });

  // ==================== USAGE & UPGRADE ====================
  app.get("/api/usage", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const usage = storage.getUsageStats(req.user!.id);
    const limits = req.user!.plan === 'pro' || req.user!.plan === 'enterprise'
      ? { contracts: Infinity, invoices: Infinity, clients: Infinity, disputes: Infinity }
      : FREE_LIMITS;
    res.json({ usage, limits, plan: req.user!.plan });
  });

  app.post("/api/upgrade", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const updated = storage.updateUserPlan(req.user!.id, "pro");
    res.json(updated);
  });

  // ==================== ADMIN ====================
  app.get("/api/admin/users", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const allUsers = storage.getAllUsers();
    const safe = allUsers.map(u => ({ ...u, password: undefined }));
    res.json(safe);
  });

  app.get("/api/admin/stats", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const allUsers = storage.getAllUsers();
    const proUsers = allUsers.filter(u => u.plan === 'pro' || u.plan === 'enterprise');
    const freeUsers = allUsers.filter(u => !u.plan || u.plan === 'free');
    const paidMrr = allUsers.reduce((sum, u) => {
      if (u.plan === 'pro') return sum + 80;
      if (u.plan === 'enterprise') return sum + 350;
      return sum;
    }, 0);
    res.json({
      totalUsers: allUsers.length,
      proUsers: proUsers.length,
      freeUsers: freeUsers.length,
      mrr: paidMrr,
      recentSignups: allUsers.slice(0, 10).map(u => ({ ...u, password: undefined })),
    });
  });

  app.patch("/api/admin/users/:id/plan", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { plan } = req.body;
    if (!['free', 'pro', 'enterprise'].includes(plan)) return res.status(400).json({ error: "Invalid plan" });
    const updated = storage.updateUserPlan(Number(req.params.id), plan);
    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json({ ...updated, password: undefined });
  });

  app.patch("/api/admin/users/:id/role", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: "Invalid role" });
    const updated = storage.updateUserRole(Number(req.params.id), role);
    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json({ ...updated, password: undefined });
  });

  app.delete("/api/admin/users/:id", (req, res) => {
    if (!requireAdmin(req, res)) return;
    if (Number(req.params.id) === req.user!.id) return res.status(400).json({ error: "Cannot delete yourself" });
    storage.deleteUser(Number(req.params.id));
    res.json({ success: true });
  });

  // ==================== ONBOARDING ====================
  app.post("/api/onboarding", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const { businessName, estimatedArr, referralSource, plan } = req.body;

    if (!businessName || !estimatedArr || !referralSource || !plan) {
      return res.status(400).json({ error: "All fields required" });
    }

    const validPlans = ['free', 'pro', 'enterprise'];
    if (!validPlans.includes(plan)) return res.status(400).json({ error: "Invalid plan" });

    const updated = storage.updateUserProfile(req.user!.id, {
      businessName,
      estimatedArr,
      referralSource,
      plan,
      onboardingComplete: 1,
    });

    res.json(updated);
  });

  // ==================== BLOG (PUBLIC) ====================
  app.get("/api/blog", (_req, res) => {
    const posts = storage.getBlogPosts(true);
    res.json(posts);
  });

  app.get("/api/blog/:slug", (req, res) => {
    const post = storage.getBlogPost(req.params.slug);
    if (!post || !post.published) return res.status(404).json({ error: "Post not found" });
    res.json(post);
  });

  // ==================== ADMIN BLOG CRUD ====================
  app.get("/api/admin/blog", (req, res) => {
    if (!requireAdmin(req, res)) return;
    res.json(storage.getBlogPosts(false));
  });

  app.post("/api/admin/blog", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { title, content, excerpt, category, published } = req.body;
    if (!title || !content) return res.status(400).json({ error: "Title and content required" });
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const post = storage.createBlogPost({ title, slug, content, excerpt: excerpt || '', category: category || 'General', published: published ? 1 : 0, authorId: req.user!.id });
    res.status(201).json(post);
  });

  app.patch("/api/admin/blog/:id", (req, res) => {
    if (!requireAdmin(req, res)) return;
    const existing = storage.getBlogPostById(Number(req.params.id));
    if (!existing) return res.status(404).json({ error: "Not found" });
    const data: any = { ...req.body };
    if (data.title) {
      data.slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    const updated = storage.updateBlogPost(Number(req.params.id), data);
    res.json(updated);
  });

  app.delete("/api/admin/blog/:id", (req, res) => {
    if (!requireAdmin(req, res)) return;
    storage.deleteBlogPost(Number(req.params.id));
    res.json({ success: true });
  });

  // ==================== DASHBOARD STATS ====================
  app.get("/api/dashboard", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const userId = req.user!.id;

    const allContracts = storage.getContracts(userId);
    const allInvoices = storage.getInvoices(userId);
    const allDisputes = storage.getDisputes(userId);
    const allClients = storage.getClients(userId);

    const totalRevenue = allInvoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
    const pendingRevenue = allInvoices.filter(i => i.status === "sent" || i.status === "overdue").reduce((s, i) => s + i.amount, 0);
    const overdueInvoices = allInvoices.filter(i => i.status === "overdue").length;
    const activeContracts = allContracts.filter(c => c.status === "signed").length;
    const activeDisputes = allDisputes.filter(d => d.status === "open" || d.status === "escalated").length;
    const recoveredAmount = allDisputes.filter(d => d.status === "resolved").reduce((s, d) => s + (d.resolvedAmount || 0), 0);
    const avgStrength = allContracts.length > 0
      ? Math.round(allContracts.reduce((s, c) => s + (c.strengthScore || 0), 0) / allContracts.length)
      : 0;

    res.json({
      totalRevenue,
      pendingRevenue,
      overdueInvoices,
      activeContracts,
      totalContracts: allContracts.length,
      activeDisputes,
      recoveredAmount,
      avgStrength,
      totalClients: allClients.length,
      atRiskClients: allClients.filter(c => (c.riskScore || 50) >= 70).length,
    });
  });

  // ==================== SCAN RESULTS (save/retrieve) ====================
  app.post("/api/contracts/:id/scan-results", (req: any, res: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const contract = storage.getContract(Number(req.params.id), req.user!.id);
    if (!contract) return res.status(404).json({ error: "Contract not found" });
    const { scanResults } = req.body;
    if (!scanResults) return res.status(400).json({ error: "scanResults is required" });
    const updated = storage.updateContract(Number(req.params.id), req.user!.id, {
      content: JSON.stringify(scanResults),
    });
    res.json(updated);
  });

  app.get("/api/contracts/:id/scan-results", (req: any, res: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const contract = storage.getContract(Number(req.params.id), req.user!.id);
    if (!contract) return res.status(404).json({ error: "Contract not found" });
    let scanResults = null;
    if (contract.content) {
      try { scanResults = JSON.parse(contract.content); } catch (_) {}
    }
    res.json({ scanResults });
  });

  // Scan and save in one step: upload/paste -> scan -> create contract record
  app.post("/api/scan-and-save", upload.single("file"), async (req: any, res: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });

    try {
      let contractText = "";
      let fileName = "Scanned Contract";

      if (req.file) {
        const filePath = req.file.path;
        const ext = path.extname(req.file.originalname).toLowerCase();
        fileName = req.file.originalname || "Uploaded Contract";

        if (ext === ".pdf") {
          const pdfParse = await loadPdfParse();
          if (!pdfParse) {
            fs.unlinkSync(filePath);
            return res.status(500).json({ error: "PDF parsing is not available" });
          }
          const dataBuffer = fs.readFileSync(filePath);
          const pdfData = await pdfParse(dataBuffer);
          contractText = pdfData.text;
        } else {
          contractText = fs.readFileSync(filePath, "utf-8");
        }
        fs.unlinkSync(filePath);
      } else if (req.body.text) {
        contractText = req.body.text;
        fileName = req.body.title || "Pasted Contract";
      } else {
        return res.status(400).json({ error: "No contract text or file provided" });
      }

      if (contractText.trim().length < 50) {
        return res.status(400).json({ error: "Contract text is too short to analyze." });
      }

      const analysis = await scanContract(contractText);
      const contract = storage.createContract({
        userId: req.user!.id,
        title: fileName,
        type: "sow",
        status: "draft",
        strengthScore: analysis.overallScore || 0,
        content: JSON.stringify(analysis),
      });

      res.status(201).json({ analysis, contract });
    } catch (error: any) {
      console.error("Scan-and-save error:", error);
      res.status(500).json({ error: "Failed to scan and save: " + (error.message || "Unknown error") });
    }
  });

  // ==================== CONTRACT SCANNER ====================
  app.post("/api/scan-contract", upload.single("file"), async (req: any, res: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });

    try {
      let contractText = "";

      if (req.file) {
        // File uploaded — extract text
        const filePath = req.file.path;
        const ext = path.extname(req.file.originalname).toLowerCase();

        if (ext === ".pdf") {
          const pdfParse = await loadPdfParse();
          if (!pdfParse) {
            fs.unlinkSync(filePath);
            return res.status(500).json({ error: "PDF parsing is not available" });
          }
          const dataBuffer = fs.readFileSync(filePath);
          const pdfData = await pdfParse(dataBuffer);
          contractText = pdfData.text;
        } else if (ext === ".txt" || ext === ".md") {
          contractText = fs.readFileSync(filePath, "utf-8");
        } else {
          // Try reading as text
          contractText = fs.readFileSync(filePath, "utf-8");
        }

        // Clean up uploaded file
        fs.unlinkSync(filePath);
      } else if (req.body.text) {
        // Text pasted directly
        contractText = req.body.text;
      } else {
        return res.status(400).json({ error: "No contract text or file provided" });
      }

      if (contractText.trim().length < 50) {
        return res.status(400).json({ error: "Contract text is too short to analyze. Please upload a valid contract." });
      }

      const analysis = await scanContract(contractText);
      res.json({ analysis, textLength: contractText.length });
    } catch (error: any) {
      console.error("Contract scan error:", error);
      res.status(500).json({ error: "Failed to scan contract: " + (error.message || "Unknown error") });
    }
  });

  // Generate protective contract
  app.post("/api/generate-contract", async (req: any, res: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });

    try {
      const { projectDescription, clientName, projectValue, timeline } = req.body;
      if (!projectDescription) return res.status(400).json({ error: "Project description required" });

      const context = `Generate a complete freelance service agreement for:
- Freelancer: ${req.user!.fullName || req.user!.username}
- Client: ${clientName || "[Client Name]"}
- Project: ${projectDescription}
- Value: $${projectValue ? (Number(projectValue) / 100).toFixed(2) : "[TBD]"}
- Timeline: ${timeline || "[TBD]"}

Include all standard protections: kill fee, IP clause, payment terms (Net 30), revision limits, termination, liability cap, dispute resolution.`;

      const contract = await generateProtectiveContract(context);
      res.json({ contract });
    } catch (error: any) {
      console.error("Contract generation error:", error);
      res.status(500).json({ error: "Failed to generate contract" });
    }
  });

  // ==================== INVOICE PARSER ====================
  app.post("/api/parse-invoice", upload.single("file"), async (req: any, res: any) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });

    try {
      let invoiceText = "";

      if (req.file) {
        const filePath = req.file.path;
        const ext = path.extname(req.file.originalname).toLowerCase();

        if (ext === ".pdf") {
          const pdfParse = await loadPdfParse();
          if (!pdfParse) {
            fs.unlinkSync(filePath);
            return res.status(500).json({ error: "PDF parsing is not available" });
          }
          const dataBuffer = fs.readFileSync(filePath);
          const pdfData = await pdfParse(dataBuffer);
          invoiceText = pdfData.text;
        } else {
          invoiceText = fs.readFileSync(filePath, "utf-8");
        }

        fs.unlinkSync(filePath);
      } else if (req.body.text) {
        invoiceText = req.body.text;
      } else {
        return res.status(400).json({ error: "No invoice file or text provided" });
      }

      const parsed = await parseInvoice(invoiceText);
      res.json({ parsed, textLength: invoiceText.length });
    } catch (error: any) {
      console.error("Invoice parse error:", error);
      res.status(500).json({ error: "Failed to parse invoice" });
    }
  });

  // Create default admin account if no admin exists
  const existingAdmin = storage.getUserByUsername("admin");
  if (!existingAdmin) {
    const { scryptSync, randomBytes } = await import("crypto");
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync("klauza-admin-2026", salt, 64).toString("hex");
    const admin = storage.createUser({ username: "admin", password: `${hash}.${salt}`, fullName: "Klauza Admin" });
    db.update(users).set({ role: "admin", plan: "enterprise" }).where(eq(users.id, admin.id)).run();
    console.log("✅ Default admin created: username=admin password=klauza-admin-2026");
  }

  return httpServer;
}
