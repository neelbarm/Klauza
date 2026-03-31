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
    const data = { ...req.body, userId: req.user!.id };
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
  function parseEvidenceData(raw: string | null): { notes: string; escalations: any[]; closeReason: string | null } {
    if (!raw) return { notes: "", escalations: [], closeReason: null };
    try {
      const parsed = JSON.parse(raw);
      // New structured format
      if (parsed.escalations) return parsed;
      // Old format: array of strings
      if (Array.isArray(parsed)) return { notes: parsed.join("; "), escalations: [], closeReason: null };
    } catch {}
    return { notes: raw, escalations: [], closeReason: null };
  }

  // Generate stage-specific escalation text
  function generateEscalationText(stage: number, amount: number, clientName: string): { type: string; subject: string; body: string } {
    const amountStr = `$${(amount / 100).toFixed(2)}`;
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    if (stage === 2) {
      return {
        type: "email",
        subject: `Friendly Reminder: Outstanding Payment of ${amountStr}`,
        body: `Hi [CLIENT NAME],

I hope you're doing well! I wanted to follow up regarding the outstanding balance of ${amountStr} for the work I completed.

I understand things get busy, and this may have simply slipped through the cracks. If you've already sent the payment, please disregard this message.

If there are any issues with the invoice or if you'd like to discuss a payment arrangement, I'm happy to chat. I value our working relationship and want to make sure we're on the same page.

Could you let me know when I can expect the payment?

Best regards,
[YOUR NAME]

---
Amount Due: ${amountStr}
Original Due Date: [DUE DATE]
Date of This Notice: ${today}`,
      };
    }

    if (stage === 3) {
      return {
        type: "email",
        subject: `Formal Notice: Payment of ${amountStr} Now Overdue`,
        body: `Dear [CLIENT NAME],

I am writing to formally notify you that payment of ${amountStr} remains outstanding and is now significantly overdue.

Per the terms of our agreement, this payment was due on [DUE DATE]. Despite my previous reminder, I have not received payment or a response addressing this matter.

Please be advised of the following:

1. The full amount of ${amountStr} is due immediately.
2. Per our contract terms, late payments may be subject to interest charges of 1.5% per month.
3. I reserve the right to suspend any ongoing or future work until this balance is resolved.
4. I retain all intellectual property rights to the delivered work until full payment is received.

I strongly encourage you to resolve this matter promptly. If there are circumstances affecting your ability to pay, please contact me within 5 business days to discuss a payment plan.

Failure to respond or remit payment will result in further escalation, which may include formal demand proceedings.

Sincerely,
[YOUR NAME]

---
Amount Due: ${amountStr}
Original Due Date: [DUE DATE]
Days Overdue: [DAYS OVERDUE]
Date of This Notice: ${today}
Reference: Formal Notice #1`,
      };
    }

    if (stage === 4) {
      return {
        type: "demand_letter",
        subject: `FORMAL DEMAND FOR PAYMENT — ${amountStr}`,
        body: `FORMAL DEMAND LETTER

Date: ${today}

TO: [CLIENT NAME]
    [CLIENT ADDRESS]

FROM: [YOUR NAME]
      [YOUR ADDRESS]

RE: DEMAND FOR PAYMENT OF ${amountStr}

Dear [CLIENT NAME],

This letter constitutes a formal and final demand for payment of ${amountStr}, which represents compensation owed to me for professional services rendered pursuant to our agreement dated [CONTRACT DATE].

BACKGROUND:
I performed the agreed-upon services in full and delivered all specified work product. Payment of ${amountStr} was due on [DUE DATE] and remains unpaid despite my prior friendly reminder on [REMINDER DATE] and formal notice on [NOTICE DATE].

DEMAND:
I hereby demand full payment of ${amountStr}, plus any accrued late fees per our agreement, within ten (10) business days of your receipt of this letter.

CONSEQUENCES OF NON-PAYMENT:
Please be advised that if I do not receive full payment within the stated timeframe, I intend to pursue all available legal remedies, which may include but are not limited to:

  1. Filing a claim in small claims court in [YOUR JURISDICTION]
  2. Reporting the debt to relevant credit bureaus
  3. Engaging a collections agency to recover the debt
  4. Seeking recovery of the outstanding amount plus court filing fees, interest, and any attorney's fees permitted by law

INTELLECTUAL PROPERTY:
Per our agreement, all intellectual property rights remain with me until full payment is received. Any continued use of my work product without payment constitutes unauthorized use.

I strongly urge you to treat this matter with the urgency it deserves. I remain open to discussing a reasonable payment arrangement if you contact me within 5 business days.

This letter is written without prejudice to any and all rights and remedies available to me, all of which are expressly reserved.

Sincerely,

____________________________
[YOUR NAME]
[YOUR EMAIL]
[YOUR PHONE]

---
IMPORTANT: Keep a copy of this letter for your records. Send via certified mail or email with read receipt for documentation.`,
      };
    }

    // Stage 4 → Small Claims Prep (stage would be 5 but we cap at 4, this is shown at stage 4)
    return {
      type: "checklist",
      subject: "Small Claims Court Preparation Checklist",
      body: `SMALL CLAIMS COURT PREPARATION CHECKLIST
=========================================

Dispute Amount: ${amountStr}
Date Prepared: ${today}

BEFORE YOU FILE:
[ ] Confirm the amount is within your state's small claims limit (typically $5,000–$10,000)
[ ] Verify the correct legal name and address of [CLIENT NAME]
[ ] Confirm the statute of limitations has not expired (typically 2-6 years for contract claims)

DOCUMENTS TO GATHER:
[ ] Original signed contract or agreement
[ ] All invoices sent (with dates and amounts)
[ ] Proof of work delivered (screenshots, files, emails)
[ ] All email correspondence with the client
[ ] Copy of the Friendly Reminder sent (Stage 1)
[ ] Copy of the Formal Notice sent (Stage 2)
[ ] Copy of the Demand Letter sent (Stage 3) — with proof of delivery
[ ] Any responses or communications from the client
[ ] Bank/payment records showing no payment received
[ ] Timeline of events (dates of work, delivery, invoicing, follow-ups)

HOW TO FILE:
1. Visit your local small claims court website or courthouse
2. Fill out the plaintiff's claim form (sometimes called "Statement of Claim")
3. Pay the filing fee (typically $30–$100, recoverable if you win)
4. Serve the defendant (the client) with the court papers — follow your court's service rules
5. Attend the hearing on the scheduled date

AT THE HEARING:
[ ] Bring 3 copies of ALL documents (one for you, one for the judge, one for the defendant)
[ ] Prepare a brief, clear summary of your case (2-3 minutes)
[ ] Stick to the facts: what was agreed, what you delivered, what was owed, what happened
[ ] Be professional and respectful to the judge
[ ] Bring any witnesses if applicable

ESTIMATED COSTS:
- Filing fee: $30–$100
- Service fee: $20–$75
- Your time: 1-2 days total
- Potential recovery: ${amountStr} + filing costs

NOTE: Klauza provides this checklist for informational purposes only. This is not legal advice. Consider consulting with a legal professional for specific guidance about your situation.`,
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

    // Generate the escalation text
    const escalation = generateEscalationText(nextStage, dispute.amount, clientName);

    // Build escalation history
    const evidenceData = parseEvidenceData(dispute.evidence);
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
