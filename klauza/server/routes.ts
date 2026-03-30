import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertClientSchema, insertContractSchema, insertInvoiceSchema, insertDisputeSchema } from "@shared/schema";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ==================== CLIENTS ====================
  app.get("/api/clients", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
    const list = storage.getClients(req.user!.id);
    res.json(list);
  });

  app.post("/api/clients", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Unauthorized" });
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

  return httpServer;
}
