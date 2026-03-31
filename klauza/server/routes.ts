import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, db } from "./storage";
import { users, insertClientSchema, insertContractSchema, insertInvoiceSchema, insertDisputeSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import multer from "multer";
import pdfParse from "pdf-parse";
import path from "path";
import fs from "fs";
import { scanContract, generateProtectiveContract, parseInvoice } from "./ai-scanner";

const FREE_LIMITS = { contracts: 1, invoices: 1, clients: 2, disputes: 1 };

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

  // Escalate dispute to next stage
  app.post("/api/disputes/:id/escalate", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const dispute = storage.getDispute(Number(req.params.id), req.user!.id);
    if (!dispute) return res.status(404).json({ error: "Not found" });
    if (dispute.stage >= 4) return res.status(400).json({ error: "Already at maximum escalation" });

    const stageNames = ["", "Friendly Reminder", "Formal Notice", "Demand Letter", "Small Claims Prep"];
    const nextStage = dispute.stage + 1;

    // Generate demand letter content for stage 3+
    let demandLetter = dispute.demandLetter;
    if (nextStage >= 3 && !demandLetter) {
      demandLetter = `FORMAL DEMAND LETTER\n\nDate: ${new Date().toLocaleDateString()}\n\nRe: Outstanding Payment of $${(dispute.amount / 100).toFixed(2)}\n\nDear Client,\n\nThis letter serves as formal demand for payment of $${(dispute.amount / 100).toFixed(2)} which is past due per our agreement.\n\nIf payment is not received within 10 business days, we will pursue all available legal remedies including filing in small claims court.\n\nPlease remit payment immediately to avoid further action.\n\nSincerely,\nKlauza on behalf of the Contractor`;
    }

    const updated = storage.updateDispute(Number(req.params.id), req.user!.id, {
      stage: nextStage,
      status: nextStage >= 3 ? "escalated" : "open",
      demandLetter,
    });
    res.json({ ...updated, stageName: stageNames[nextStage] });
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
    const proUsers = allUsers.filter(u => u.plan === 'pro');
    const freeUsers = allUsers.filter(u => u.plan === 'free');
    res.json({
      totalUsers: allUsers.length,
      proUsers: proUsers.length,
      freeUsers: freeUsers.length,
      mrr: proUsers.length * 80,
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
