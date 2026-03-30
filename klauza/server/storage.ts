import {
  type User, type InsertUser, users,
  type Client, type InsertClient, clients,
  type Contract, type InsertContract, contracts,
  type Invoice, type InsertInvoice, invoices,
  type Dispute, type InsertDispute, disputes,
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
    created_at TEXT DEFAULT (datetime('now'))
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

export const db = drizzle(sqlite);

export interface IStorage {
  // Users
  getUser(id: number): User | undefined;
  getUserByUsername(username: string): User | undefined;
  createUser(user: InsertUser): User;
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
    return db.insert(users).values(insertUser).returning().get();
  }

  // === CLIENTS ===
  getClients(userId: number) {
    return db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.id)).all();
  }
  getClient(id: number, userId: number) {
    return db.select().from(clients).where(and(eq(clients.id, id), eq(clients.userId, userId))).get();
  }
  createClient(client: InsertClient) {
    return db.insert(clients).values(client).returning().get();
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
    return db.insert(contracts).values(contract).returning().get();
  }
  updateContract(id: number, userId: number, data: Partial<InsertContract>) {
    return db.update(contracts).set(data).where(and(eq(contracts.id, id), eq(contracts.userId, userId))).returning().get();
  }

  // === INVOICES ===
  getInvoices(userId: number) {
    return db.select().from(invoices).where(eq(invoices.userId, userId)).orderBy(desc(invoices.id)).all();
  }
  createInvoice(invoice: InsertInvoice) {
    return db.insert(invoices).values(invoice).returning().get();
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
    return db.insert(disputes).values(dispute).returning().get();
  }
  updateDispute(id: number, userId: number, data: Partial<InsertDispute>) {
    return db.update(disputes).set(data).where(and(eq(disputes.id, id), eq(disputes.userId, userId))).returning().get();
  }
}

export const storage = new DatabaseStorage();
