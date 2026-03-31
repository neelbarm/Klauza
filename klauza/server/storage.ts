import {
  type User, type InsertUser, users,
  type Client, type InsertClient, clients,
  type Contract, type InsertContract, contracts,
  type Invoice, type InsertInvoice, invoices,
  type Dispute, type InsertDispute, disputes,
  type BlogPost, type InsertBlogPost, blogPosts,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

// Auto-create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT,
    plan TEXT DEFAULT 'free',
    role TEXT DEFAULT 'user',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    email TEXT,
    business_name TEXT,
    estimated_arr TEXT,
    referral_source TEXT,
    onboarding_complete INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    published INTEGER DEFAULT 0,
    author_id INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT
  );
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    company TEXT,
    risk_score INTEGER DEFAULT 50,
    total_revenue INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    client_id INTEGER,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    strength_score INTEGER DEFAULT 0,
    content TEXT,
    clauses TEXT,
    total_value INTEGER DEFAULT 0,
    kill_fee_percent INTEGER DEFAULT 25,
    payment_terms TEXT DEFAULT 'net30',
    signed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    contract_id INTEGER,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'draft',
    due_date TEXT,
    paid_at TEXT,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS disputes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    client_id INTEGER NOT NULL,
    invoice_id INTEGER,
    amount INTEGER NOT NULL,
    status TEXT DEFAULT 'open',
    stage INTEGER DEFAULT 1,
    demand_letter TEXT,
    evidence TEXT,
    resolved_amount INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT
  );
`);

// Migrate existing databases to add new columns
try { sqlite.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'"); } catch(e) {}
try { sqlite.exec("ALTER TABLE users ADD COLUMN stripe_customer_id TEXT"); } catch(e) {}
try { sqlite.exec("ALTER TABLE users ADD COLUMN stripe_subscription_id TEXT"); } catch(e) {}
try { sqlite.exec("ALTER TABLE users ADD COLUMN email TEXT"); } catch(e) {}
try { sqlite.exec("ALTER TABLE users ADD COLUMN business_name TEXT"); } catch(e) {}
try { sqlite.exec("ALTER TABLE users ADD COLUMN estimated_arr TEXT"); } catch(e) {}
try { sqlite.exec("ALTER TABLE users ADD COLUMN referral_source TEXT"); } catch(e) {}
try { sqlite.exec("ALTER TABLE users ADD COLUMN onboarding_complete INTEGER DEFAULT 0"); } catch(e) {}
try { sqlite.exec("ALTER TABLE users ADD COLUMN jurisdiction TEXT DEFAULT 'US'"); } catch(e) {}
try { sqlite.exec("ALTER TABLE users ADD COLUMN scans_used INTEGER DEFAULT 0"); } catch(e) {}
try { sqlite.exec("ALTER TABLE users ADD COLUMN scans_reset_date TEXT"); } catch(e) {}

export const db = drizzle(sqlite);

export interface IStorage {
  // Users
  getUser(id: number): User | undefined;
  getUserByUsername(username: string): User | undefined;
  createUser(user: InsertUser): User;
  // Admin methods
  getAllUsers(): User[];
  updateUserPlan(userId: number, plan: string): User | undefined;
  updateUserRole(userId: number, role: string): User | undefined;
  deleteUser(userId: number): void;
  getUserCount(): number;
  getUsageStats(userId: number): { contracts: number; invoices: number; clients: number; disputes: number };
  // Clients
  getClients(userId: number): Client[];
  getClient(id: number, userId: number): Client | undefined;
  createClient(client: InsertClient): Client;
  updateClient(id: number, userId: number, data: Partial<InsertClient>): Client | undefined;
  // Contracts
  getContracts(userId: number): Contract[];
  getContract(id: number, userId: number): Contract | undefined;
  createContract(contract: InsertContract): Contract;
  updateContract(id: number, userId: number, data: Partial<InsertContract>): Contract | undefined;
  // Invoices
  getInvoices(userId: number): Invoice[];
  createInvoice(invoice: InsertInvoice): Invoice;
  updateInvoice(id: number, userId: number, data: Partial<InsertInvoice>): Invoice | undefined;
  // Disputes
  getDisputes(userId: number): Dispute[];
  getDispute(id: number, userId: number): Dispute | undefined;
  createDispute(dispute: InsertDispute): Dispute;
  updateDispute(id: number, userId: number, data: Partial<InsertDispute>): Dispute | undefined;
  // User profile update
  updateUserProfile(userId: number, data: Record<string, any>): User | undefined;
  // Scan usage
  getScanUsage(userId: number): { scansUsed: number; scansLimit: number; plan: string; resetDate: string | null };
  incrementScanUsage(userId: number): void;
  resetScanUsage(userId: number): void;
  // Blog
  getBlogPosts(publishedOnly?: boolean): BlogPost[];
  getBlogPost(slug: string): BlogPost | undefined;
  getBlogPostById(id: number): BlogPost | undefined;
  createBlogPost(post: InsertBlogPost): BlogPost;
  updateBlogPost(id: number, data: Partial<InsertBlogPost>): BlogPost | undefined;
  deleteBlogPost(id: number): void;
}

export class DatabaseStorage implements IStorage {
  // === USERS ===
  getUser(id: number) {
    return db.select().from(users).where(eq(users.id, id)).get();
  }
  getUserByUsername(username: string) {
    return db.select().from(users).where(eq(users.username, username)).get();
  }
  createUser(insertUser: InsertUser) {
    return db.insert(users).values({ ...insertUser, createdAt: new Date().toISOString() }).returning().get();
  }

  // === ADMIN METHODS ===
  getAllUsers() {
    return db.select().from(users).orderBy(desc(users.id)).all();
  }
  updateUserPlan(userId: number, plan: string) {
    return db.update(users).set({ plan }).where(eq(users.id, userId)).returning().get();
  }
  updateUserRole(userId: number, role: string) {
    return db.update(users).set({ role }).where(eq(users.id, userId)).returning().get();
  }
  deleteUser(userId: number) {
    db.delete(users).where(eq(users.id, userId)).run();
  }
  getUserCount() {
    return db.select().from(users).all().length;
  }
  getUsageStats(userId: number) {
    return {
      contracts: db.select().from(contracts).where(eq(contracts.userId, userId)).all().length,
      invoices: db.select().from(invoices).where(eq(invoices.userId, userId)).all().length,
      clients: db.select().from(clients).where(eq(clients.userId, userId)).all().length,
      disputes: db.select().from(disputes).where(eq(disputes.userId, userId)).all().length,
    };
  }

  // === CLIENTS ===
  getClients(userId: number) {
    return db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.id)).all();
  }
  getClient(id: number, userId: number) {
    return db.select().from(clients).where(and(eq(clients.id, id), eq(clients.userId, userId))).get();
  }
  createClient(client: InsertClient) {
    return db.insert(clients).values({ ...client, createdAt: new Date().toISOString() }).returning().get();
  }
  updateClient(id: number, userId: number, data: Partial<InsertClient>) {
    return db.update(clients).set(data).where(and(eq(clients.id, id), eq(clients.userId, userId))).returning().get();
  }

  // === CONTRACTS ===
  getContracts(userId: number) {
    return db.select().from(contracts).where(eq(contracts.userId, userId)).orderBy(desc(contracts.id)).all();
  }
  getContract(id: number, userId: number) {
    return db.select().from(contracts).where(and(eq(contracts.id, id), eq(contracts.userId, userId))).get();
  }
  createContract(contract: InsertContract) {
    return db.insert(contracts).values({ ...contract, createdAt: new Date().toISOString() }).returning().get();
  }
  updateContract(id: number, userId: number, data: Partial<InsertContract>) {
    return db.update(contracts).set(data).where(and(eq(contracts.id, id), eq(contracts.userId, userId))).returning().get();
  }

  // === INVOICES ===
  getInvoices(userId: number) {
    return db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.id)).all();
  }
  createInvoice(invoice: InsertInvoice) {
    return db.insert(invoices).values({ ...invoice, createdAt: new Date().toISOString() }).returning().get();
  }
  updateInvoice(id: number, userId: number, data: Partial<InsertInvoice>) {
    return db.update(invoices).set(data).where(and(eq(invoices.id, id), eq(invoices.userId, userId))).returning().get();
  }

  // === DISPUTES ===
  getDisputes(userId: number) {
    return db.select().from(disputes).where(eq(disputes.userId, userId)).orderBy(desc(disputes.id)).all();
  }
  getDispute(id: number, userId: number) {
    return db.select().from(disputes).where(and(eq(disputes.id, id), eq(disputes.userId, userId))).get();
  }
  createDispute(dispute: InsertDispute) {
    return db.insert(disputes).values({ ...dispute, createdAt: new Date().toISOString() }).returning().get();
  }
  updateDispute(id: number, userId: number, data: Partial<InsertDispute>) {
    return db.update(disputes).set(data).where(and(eq(disputes.id, id), eq(disputes.userId, userId))).returning().get();
  }

  // === USER PROFILE ===
  updateUserProfile(userId: number, data: Record<string, any>) {
    return db.update(users).set(data).where(eq(users.id, userId)).returning().get();
  }

  // === SCAN USAGE ===
  getScanUsage(userId: number) {
    const user = db.select().from(users).where(eq(users.id, userId)).get();
    const plan = (user as any)?.plan || "free";
    const scansUsed = (user as any)?.scansUsed || 0;
    const resetDate = (user as any)?.scansResetDate || null;
    const limitMap: Record<string, number> = { free: 0, pro: 10, enterprise: 50 };
    return { scansUsed, scansLimit: limitMap[plan] ?? 0, plan, resetDate };
  }
  incrementScanUsage(userId: number) {
    sqlite.exec(`UPDATE users SET scans_used = COALESCE(scans_used, 0) + 1 WHERE id = ${userId}`);
  }
  resetScanUsage(userId: number) {
    const newDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    sqlite.exec(`UPDATE users SET scans_used = 0, scans_reset_date = '${newDate}' WHERE id = ${userId}`);
  }

  // === BLOG ===
  getBlogPosts(publishedOnly = false) {
    if (publishedOnly) {
      return db.select().from(blogPosts).where(eq(blogPosts.published, 1)).orderBy(desc(blogPosts.id)).all();
    }
    return db.select().from(blogPosts).orderBy(desc(blogPosts.id)).all();
  }
  getBlogPost(slug: string) {
    return db.select().from(blogPosts).where(eq(blogPosts.slug, slug)).get();
  }
  getBlogPostById(id: number) {
    return db.select().from(blogPosts).where(eq(blogPosts.id, id)).get();
  }
  createBlogPost(post: InsertBlogPost) {
    return db.insert(blogPosts).values({ ...post, createdAt: new Date().toISOString() }).returning().get();
  }
  updateBlogPost(id: number, data: Partial<InsertBlogPost>) {
    return db.update(blogPosts).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(blogPosts.id, id)).returning().get();
  }
  deleteBlogPost(id: number) {
    db.delete(blogPosts).where(eq(blogPosts.id, id)).run();
  }
}

export const storage = new DatabaseStorage();
