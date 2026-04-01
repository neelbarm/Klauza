import { pgTable, text, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================================================
// USERS — Authentication and profile
// ============================================================================
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  plan: text("plan").default("free"), // free | pro | enterprise
  role: text("role").default("user"), // user | admin
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  email: text("email"),
  businessName: text("business_name"),
  estimatedArr: text("estimated_arr"),
  referralSource: text("referral_source"),
  onboardingComplete: integer("onboarding_complete").default(0),
  createdAt: text("created_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// ============================================================================
// CLIENTS — Freelancer's clients
// ============================================================================
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  company: text("company"),
  riskScore: integer("risk_score").default(50), // 0-100
  totalRevenue: integer("total_revenue").default(0), // cents
  status: text("status").default("active"), // active | inactive | flagged
  createdAt: text("created_at"),
});

export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;

// ============================================================================
// CONTRACTS — Templates engine (PREVENT)
// ============================================================================
export const contracts = pgTable("contracts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  clientId: integer("client_id"),
  title: text("title").notNull(),
  type: text("type").notNull(), // fixed | hourly | retainer | sow | nda
  status: text("status").default("draft"), // draft | sent | signed | expired
  strengthScore: integer("strength_score").default(0), // 0-100
  content: text("content"), // full contract text (JSON)
  clauses: text("clauses"), // JSON array of clause objects
  totalValue: integer("total_value").default(0), // cents
  killFeePercent: integer("kill_fee_percent").default(25),
  paymentTerms: text("payment_terms").default("net30"),
  signedAt: text("signed_at"),
  createdAt: text("created_at"),
});

export const insertContractSchema = createInsertSchema(contracts).omit({ id: true, createdAt: true });
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

// ============================================================================
// INVOICES — Payment tracking
// ============================================================================
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  clientId: integer("client_id").notNull(),
  contractId: integer("contract_id"),
  amount: integer("amount").notNull(), // cents
  status: text("status").default("draft"), // draft | sent | paid | overdue | disputed
  dueDate: text("due_date"),
  paidAt: text("paid_at"),
  description: text("description"),
  createdAt: text("created_at"),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// ============================================================================
// DISPUTES — Chase engine (ENFORCE)
// ============================================================================
export const disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  clientId: integer("client_id").notNull(),
  invoiceId: integer("invoice_id"),
  amount: integer("amount").notNull(), // cents
  status: text("status").default("open"), // open | escalated | resolved | closed
  stage: integer("stage").default(1), // 1=reminder, 2=formal, 3=demand, 4=small_claims
  demandLetter: text("demand_letter"), // AI-generated text
  evidence: text("evidence"), // JSON array of evidence descriptions
  resolvedAmount: integer("resolved_amount").default(0), // cents recovered
  createdAt: text("created_at"),
  resolvedAt: text("resolved_at"),
});

export const insertDisputeSchema = createInsertSchema(disputes).omit({ id: true, createdAt: true });
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type Dispute = typeof disputes.$inferSelect;

// ============================================================================
// BLOG POSTS — CMS
// ============================================================================
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  category: text("category").default("General"),
  published: integer("published").default(0), // 0=draft, 1=published
  authorId: integer("author_id"),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
