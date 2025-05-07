import { 
  User, InsertUser, Competition, InsertCompetition, 
  Ticket, InsertTicket, Entry, InsertEntry,
  CartItem, InsertCartItem, SiteConfig, InsertSiteConfig
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, gt, lt, desc, not, sql, gte, like } from "drizzle-orm";
import { 
  users, competitions, tickets, entries, cartItems, siteConfig,
  competitionStatusEnum, ticketStatusEnum, entryStatusEnum
} from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

// Export interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  listUsers(page?: number, limit?: number): Promise<{ users: User[], total: number }>;
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User>;
  
  // Competition operations
  getCompetition(id: number): Promise<Competition | undefined>;
  listCompetitions(options?: {
    status?: string,
    category?: string,
    featured?: boolean,
    page?: number,
    limit?: number,
    search?: string
  }): Promise<{ competitions: Competition[], total: number }>;
  createCompetition(competition: InsertCompetition): Promise<Competition>;
  updateCompetition(id: number, data: Partial<Competition>): Promise<Competition>;
  incrementTicketsSold(id: number, count: number): Promise<void>;
  
  // Ticket operations
  getTicket(competitionId: number, number: number): Promise<Ticket | undefined>;
  getTicketById(id: number): Promise<Ticket | undefined>;
  listTickets(competitionId: number, status?: string): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  reserveTickets(competitionId: number, numbers: number[], sessionId: string, expiryMinutes: number): Promise<Ticket[]>;
  releaseReservedTickets(sessionId: string): Promise<number>;
  releaseExpiredTickets(): Promise<number>;
  purchaseTickets(ticketIds: number[], userId: number): Promise<Ticket[]>;
  
  // Entry operations
  createEntry(entry: InsertEntry): Promise<Entry>;
  getUserEntries(userId: number): Promise<Entry[]>;
  getUserWinningEntries(userId: number): Promise<Entry[]>;
  
  // Cart operations
  getCartItems(sessionId: string): Promise<CartItem[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  removeFromCart(id: number): Promise<void>;
  clearCart(sessionId: string): Promise<void>;
  
  // Site configuration
  getSiteConfig(key: string): Promise<SiteConfig | undefined>;
  updateSiteConfig(key: string, value: string, userId: number): Promise<SiteConfig>;
  
  // Session store for auth
  sessionStore: session.SessionStore;
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  async listUsers(page = 1, limit = 20): Promise<{ users: User[], total: number }> {
    const offset = (page - 1) * limit;
    
    const result = await db.select().from(users).limit(limit).offset(offset);
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    
    return { users: result, total: count };
  }
  
  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }
  
  // Competition operations
  async getCompetition(id: number): Promise<Competition | undefined> {
    const [competition] = await db
      .select()
      .from(competitions)
      .where(eq(competitions.id, id));
    return competition;
  }
  
  async listCompetitions(options?: {
    status?: string,
    category?: string,
    featured?: boolean,
    page?: number,
    limit?: number,
    search?: string
  }): Promise<{ competitions: Competition[], total: number }> {
    const { 
      status = 'live', 
      category, 
      featured,
      page = 1, 
      limit = 20,
      search
    } = options || {};
    
    let query = db.select().from(competitions);
    
    // Apply filters
    if (status) {
      query = query.where(eq(competitions.status, status as any));
    }
    
    if (category) {
      query = query.where(eq(competitions.category, category as any));
    }
    
    if (featured !== undefined) {
      query = query.where(eq(competitions.featured, featured));
    }
    
    if (search) {
      query = query.where(
        sql`to_tsvector('english', ${competitions.title} || ' ' || ${competitions.description}) @@ to_tsquery('english', ${search.replace(/ /g, ' & ')})`
      );
    }
    
    // Calculate total before pagination
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(query.as('filtered_competitions'));
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset);
    
    // Order by created date (newest first)
    query = query.orderBy(desc(competitions.createdAt));
    
    const results = await query;
    
    return {
      competitions: results,
      total: count,
    };
  }
  
  async createCompetition(competition: InsertCompetition): Promise<Competition> {
    // The dates should already be Date objects thanks to Zod validation
    console.log("Creating competition with prepared data:", competition);
    
    const [result] = await db
      .insert(competitions)
      .values(competition)
      .returning();
    return result;
  }
  
  async updateCompetition(id: number, data: Partial<Competition>): Promise<Competition> {
    // Date conversion should be handled by the API route now
    console.log("Updating competition with data:", data);
    
    const [competition] = await db
      .update(competitions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(competitions.id, id))
      .returning();
    return competition;
  }
  
  async incrementTicketsSold(id: number, count: number): Promise<void> {
    await db
      .update(competitions)
      .set({
        ticketsSold: sql`${competitions.ticketsSold} + ${count}`,
        updatedAt: new Date(),
      })
      .where(eq(competitions.id, id));
  }
  
  // Ticket operations
  async getTicket(competitionId: number, number: number): Promise<Ticket | undefined> {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.competitionId, competitionId),
          eq(tickets.number, number)
        )
      );
    return ticket;
  }
  
  async getTicketById(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, id));
    return ticket;
  }
  
  async listTickets(competitionId: number, status?: string): Promise<Ticket[]> {
    let query = db
      .select()
      .from(tickets)
      .where(eq(tickets.competitionId, competitionId));
    
    if (status) {
      query = query.where(eq(tickets.status, status as any));
    }
    
    return await query;
  }
  
  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [result] = await db
      .insert(tickets)
      .values(ticket)
      .returning();
    return result;
  }
  
  async reserveTickets(
    competitionId: number, 
    numbers: number[], 
    sessionId: string,
    expiryMinutes: number = 10
  ): Promise<Ticket[]> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);
    
    // Filter out tickets that are not available
    const availableTickets = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.competitionId, competitionId),
          inArray(tickets.number, numbers),
          eq(tickets.status, 'available')
        )
      );
    
    const availableNumbers = availableTickets.map(t => t.number);
    
    if (availableNumbers.length === 0) {
      return [];
    }
    
    // Update the tickets to reserved
    const updatedTickets = await db
      .update(tickets)
      .set({
        status: 'reserved',
        sessionId,
        reservedAt: now,
        reservedUntil: expiresAt,
      })
      .where(
        and(
          eq(tickets.competitionId, competitionId),
          inArray(tickets.number, availableNumbers)
        )
      )
      .returning();
    
    return updatedTickets;
  }
  
  async releaseReservedTickets(sessionId: string): Promise<number> {
    const result = await db
      .update(tickets)
      .set({
        status: 'available',
        sessionId: null,
        reservedAt: null,
        reservedUntil: null,
      })
      .where(
        and(
          eq(tickets.status, 'reserved'),
          eq(tickets.sessionId, sessionId)
        )
      );
    
    return result.rowCount || 0;
  }
  
  async releaseExpiredTickets(): Promise<number> {
    const now = new Date();
    
    const result = await db
      .update(tickets)
      .set({
        status: 'available',
        sessionId: null,
        reservedAt: null,
        reservedUntil: null,
      })
      .where(
        and(
          eq(tickets.status, 'reserved'),
          lt(tickets.reservedUntil!, now)
        )
      );
    
    return result.rowCount || 0;
  }
  
  async purchaseTickets(ticketIds: number[], userId: number): Promise<Ticket[]> {
    const now = new Date();
    
    const purchasedTickets = await db
      .update(tickets)
      .set({
        status: 'purchased',
        userId,
        purchasedAt: now,
        reservedAt: null,
        reservedUntil: null,
        sessionId: null,
      })
      .where(inArray(tickets.id, ticketIds))
      .returning();
    
    return purchasedTickets;
  }
  
  // Entry operations
  async createEntry(entry: InsertEntry): Promise<Entry> {
    const [result] = await db
      .insert(entries)
      .values(entry)
      .returning();
    return result;
  }
  
  async getUserEntries(userId: number): Promise<Entry[]> {
    const userEntries = await db
      .select({
        entry: entries,
        competition: competitions,
      })
      .from(entries)
      .innerJoin(competitions, eq(entries.competitionId, competitions.id))
      .where(eq(entries.userId, userId))
      .orderBy(desc(entries.createdAt));
    
    return userEntries.map(({ entry }) => entry);
  }
  
  async getUserWinningEntries(userId: number): Promise<Entry[]> {
    const winningEntries = await db
      .select({
        entry: entries,
        competition: competitions,
      })
      .from(entries)
      .innerJoin(competitions, eq(entries.competitionId, competitions.id))
      .where(
        and(
          eq(entries.userId, userId),
          eq(entries.status, 'won')
        )
      )
      .orderBy(desc(entries.createdAt));
    
    return winningEntries.map(({ entry }) => entry);
  }
  
  // Cart operations
  async getCartItems(sessionId: string): Promise<CartItem[]> {
    const now = new Date();
    
    const items = await db
      .select({
        cartItem: cartItems,
        competition: competitions,
      })
      .from(cartItems)
      .innerJoin(competitions, eq(cartItems.competitionId, competitions.id))
      .where(
        and(
          eq(cartItems.sessionId, sessionId),
          gt(cartItems.expiresAt, now)
        )
      );
    
    return items.map(({ cartItem }) => cartItem);
  }
  
  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    const [item] = await db
      .insert(cartItems)
      .values(cartItem)
      .returning();
    return item;
  }
  
  async removeFromCart(id: number): Promise<void> {
    await db
      .delete(cartItems)
      .where(eq(cartItems.id, id));
  }
  
  async clearCart(sessionId: string): Promise<void> {
    await db
      .delete(cartItems)
      .where(eq(cartItems.sessionId, sessionId));
  }
  
  // Site configuration
  async getSiteConfig(key: string): Promise<SiteConfig | undefined> {
    const [config] = await db
      .select()
      .from(siteConfig)
      .where(eq(siteConfig.key, key));
    return config;
  }
  
  async updateSiteConfig(key: string, value: string | any, userId: number): Promise<SiteConfig> {
    // Ensure value is a string
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    try {
      // Try to update first
      let result = await db
        .update(siteConfig)
        .set({
          value: stringValue,
          updatedAt: new Date(),
          updatedBy: userId,
        })
        .where(eq(siteConfig.key, key))
        .returning();
      
      // If no rows updated, insert instead
      if (result.length === 0) {
        result = await db
          .insert(siteConfig)
          .values({
            key,
            value: stringValue,
            updatedBy: userId,
          })
          .returning();
      }
      
      return result[0];
    } catch (error) {
      console.error(`Error updating site config (${key}):`, error);
      throw error;
    }
  }
}

// Create and export storage instance
export const storage = new DatabaseStorage();
