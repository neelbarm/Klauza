import {
  type User, type InsertUser, users,
  type Client, type InsertClient, clients,
  type Contract, type InsertContract, contracts,
  type Invoice, type InsertInvoice, invoices,
  type Dispute, type InsertDispute, disputes,
  type BlogPost, type InsertBlogPost, blogPosts,
} from "@shared/schema";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, desc } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/klauza",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool);

// Initialize database tables and run migrations
export async function initDatabase() {
  // Create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
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
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS blog_posts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      published INTEGER DEFAULT 0,
      author_id INTEGER,
      created_at TEXT,
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      company TEXT,
      risk_score INTEGER DEFAULT 50,
      total_revenue INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS contracts (
      id SERIAL PRIMARY KEY,
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
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      contract_id INTEGER,
      amount INTEGER NOT NULL,
      status TEXT DEFAULT 'draft',
      due_date TEXT,
      paid_at TEXT,
      description TEXT,
      created_at TEXT
    );
    CREATE TABLE IF NOT EXISTS disputes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      client_id INTEGER NOT NULL,
      invoice_id INTEGER,
      amount INTEGER NOT NULL,
      status TEXT DEFAULT 'open',
      stage INTEGER DEFAULT 1,
      demand_letter TEXT,
      evidence TEXT,
      resolved_amount INTEGER DEFAULT 0,
      created_at TEXT,
      resolved_at TEXT
    );
  `);

  // Migrate existing databases to add new columns
  const migrations = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS business_name TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS estimated_arr TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_source TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_complete INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS jurisdiction TEXT DEFAULT 'US'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_used INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS scans_reset_date TEXT",
  ];
  for (const sql of migrations) {
    try { await pool.query(sql); } catch(e) {}
  }
}

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  // Admin methods
  getAllUsers(): Promise<User[]>;
  updateUserPlan(userId: number, plan: string): Promise<User | undefined>;
  updateUserRole(userId: number, role: string): Promise<User | undefined>;
  deleteUser(userId: number): Promise<void>;
  getUserCount(): Promise<number>;
  getUsageStats(userId: number): Promise<{ contracts: number; invoices: number; clients: number; disputes: number }>;
  // Clients
  getClients(userId: number): Promise<Client[]>;
  getClient(id: number, userId: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, userId: number, data: Partial<InsertClient>): Promise<Client | undefined>;
  // Contracts
  getContracts(userId: number): Promise<Contract[]>;
  getContract(id: number, userId: number): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: number, userId: number, data: Partial<InsertContract>): Promise<Contract | undefined>;
  // Invoices
  getInvoices(userId: number): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, userId: number, data: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  // Disputes
  getDisputes(userId: number): Promise<Dispute[]>;
  getDispute(id: number, userId: number): Promise<Dispute | undefined>;
  createDispute(dispute: InsertDispute): Promise<Dispute>;
  updateDispute(id: number, userId: number, data: Partial<InsertDispute>): Promise<Dispute | undefined>;
  // User profile update
  updateUserProfile(userId: number, data: Record<string, any>): Promise<User | undefined>;
  // Scan usage
  getScanUsage(userId: number): Promise<{ scansUsed: number; scansLimit: number; plan: string; resetDate: string | null }>;
  incrementScanUsage(userId: number): Promise<void>;
  resetScanUsage(userId: number): Promise<void>;
  // Blog
  getBlogPosts(publishedOnly?: boolean): Promise<BlogPost[]>;
  getBlogPost(slug: string): Promise<BlogPost | undefined>;
  getBlogPostById(id: number): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // === USERS ===
  async getUser(id: number) {
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows[0] as User | undefined;
  }
  async getUserByUsername(username: string) {
    const rows = await db.select().from(users).where(eq(users.username, username));
    return rows[0] as User | undefined;
  }
  async createUser(insertUser: InsertUser) {
    const rows = await db.insert(users).values({ ...insertUser, createdAt: new Date().toISOString() }).returning();
    return rows[0] as User;
  }

  // === ADMIN METHODS ===
  async getAllUsers() {
    return await db.select().from(users).orderBy(desc(users.id));
  }
  async updateUserPlan(userId: number, plan: string) {
    const rows = await db.update(users).set({ plan }).where(eq(users.id, userId)).returning();
    return rows[0] as User | undefined;
  }
  async updateUserRole(userId: number, role: string) {
    const rows = await db.update(users).set({ role }).where(eq(users.id, userId)).returning();
    return rows[0] as User | undefined;
  }
  async deleteUser(userId: number) {
    await db.delete(users).where(eq(users.id, userId));
  }
  async getUserCount() {
    const rows = await db.select().from(users);
    return rows.length;
  }
  async getUsageStats(userId: number) {
    const [c, i, cl, d] = await Promise.all([
      db.select().from(contracts).where(eq(contracts.userId, userId)),
      db.select().from(invoices).where(eq(invoices.userId, userId)),
      db.select().from(clients).where(eq(clients.userId, userId)),
      db.select().from(disputes).where(eq(disputes.userId, userId)),
    ]);
    return { contracts: c.length, invoices: i.length, clients: cl.length, disputes: d.length };
  }

  // === CLIENTS ===
  async getClients(userId: number) {
    return await db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.id));
  }
  async getClient(id: number, userId: number) {
    const rows = await db.select().from(clients).where(and(eq(clients.id, id), eq(clients.userId, userId)));
    return rows[0] as Client | undefined;
  }
  async createClient(client: InsertClient) {
    const rows = await db.insert(clients).values({ ...client, createdAt: new Date().toISOString() }).returning();
    return rows[0] as Client;
  }
  async updateClient(id: number, userId: number, data: Partial<InsertClient>) {
    const rows = await db.update(clients).set(data).where(and(eq(clients.id, id), eq(clients.userId, userId))).returning();
    return rows[0] as Client | undefined;
  }

  // === CONTRACTS ===
  async getContracts(userId: number) {
    return await db.select().from(contracts).where(eq(contracts.userId, userId)).orderBy(desc(contracts.id));
  }
  async getContract(id: number, userId: number) {
    const rows = await db.select().from(contracts).where(and(eq(contracts.id, id), eq(contracts.userId, userId)));
    return rows[0] as Contract | undefined;
  }
  async createContract(contract: InsertContract) {
    const rows = await db.insert(contracts).values({ ...contract, createdAt: new Date().toISOString() }).returning();
    return rows[0] as Contract;
  }
  async updateContract(id: number, userId: number, data: Partial<InsertContract>) {
    const rows = await db.update(contracts).set(data).where(and(eq(contracts.id, id), eq(contracts.userId, userId))).returning();
    return rows[0] as Contract | undefined;
  }

  // === INVOICES ===
  async getInvoices(userId: number) {
    return await db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.id));
  }
  async createInvoice(invoice: InsertInvoice) {
    const rows = await db.insert(invoices).values({ ...invoice, createdAt: new Date().toISOString() }).returning();
    return rows[0] as Invoice;
  }
  async updateInvoice(id: number, userId: number, data: Partial<InsertInvoice>) {
    const rows = await db.update(invoices).set(data).where(and(eq(invoices.id, id), eq(invoices.userId, userId))).returning();
    return rows[0] as Invoice | undefined;
  }

  // === DISPUTES ===
  async getDisputes(userId: number) {
    return await db.select().from(disputes).where(eq(disputes.userId, userId)).orderBy(desc(disputes.id));
  }
  async getDispute(id: number, userId: number) {
    const rows = await db.select().from(disputes).where(and(eq(disputes.id, id), eq(disputes.userId, userId)));
    return rows[0] as Dispute | undefined;
  }
  async createDispute(dispute: InsertDispute) {
    const rows = await db.insert(disputes).values({ ...dispute, createdAt: new Date().toISOString() }).returning();
    return rows[0] as Dispute;
  }
  async updateDispute(id: number, userId: number, data: Partial<InsertDispute>) {
    const rows = await db.update(disputes).set(data).where(and(eq(disputes.id, id), eq(disputes.userId, userId))).returning();
    return rows[0] as Dispute | undefined;
  }

  // === USER PROFILE ===
  async updateUserProfile(userId: number, data: Record<string, any>) {
    const rows = await db.update(users).set(data).where(eq(users.id, userId)).returning();
    return rows[0] as User | undefined;
  }

  // === SCAN USAGE ===
  async getScanUsage(userId: number) {
    const rows = await db.select().from(users).where(eq(users.id, userId));
    const user = rows[0];
    const plan = (user as any)?.plan || "free";
    const scansUsed = (user as any)?.scansUsed || 0;
    const resetDate = (user as any)?.scansResetDate || null;
    const limitMap: Record<string, number> = { free: 0, pro: 10, enterprise: 50 };
    return { scansUsed, scansLimit: limitMap[plan] ?? 0, plan, resetDate };
  }
  async incrementScanUsage(userId: number) {
    await pool.query(`UPDATE users SET scans_used = COALESCE(scans_used, 0) + 1 WHERE id = $1`, [userId]);
  }
  async resetScanUsage(userId: number) {
    const newDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    await pool.query(`UPDATE users SET scans_used = 0, scans_reset_date = $1 WHERE id = $2`, [newDate, userId]);
  }

  // === BLOG ===
  async getBlogPosts(publishedOnly = false) {
    if (publishedOnly) {
      return await db.select().from(blogPosts).where(eq(blogPosts.published, 1)).orderBy(desc(blogPosts.id));
    }
    return await db.select().from(blogPosts).orderBy(desc(blogPosts.id));
  }
  async getBlogPost(slug: string) {
    const rows = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return rows[0] as BlogPost | undefined;
  }
  async getBlogPostById(id: number) {
    const rows = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return rows[0] as BlogPost | undefined;
  }
  async createBlogPost(post: InsertBlogPost) {
    const rows = await db.insert(blogPosts).values({ ...post, createdAt: new Date().toISOString() }).returning();
    return rows[0] as BlogPost;
  }
  async updateBlogPost(id: number, data: Partial<InsertBlogPost>) {
    const rows = await db.update(blogPosts).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(blogPosts.id, id)).returning();
    return rows[0] as BlogPost | undefined;
  }
  async deleteBlogPost(id: number) {
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }
}

export const storage = new DatabaseStorage();
