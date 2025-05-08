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
  getTicketsByNumbers(competitionId: number, numbers: number[]): Promise<Ticket[]>;
  listTickets(competitionId: number, status?: string): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  reserveTickets(competitionId: number, numbers: number[], sessionId: string, expiryMinutes: number): Promise<Ticket[]>;
  releaseReservedTickets(sessionId: string): Promise<number>;
  releaseExpiredTickets(): Promise<number>;
  purchaseTickets(ticketIds: number[], userId: number): Promise<Ticket[]>;
  
  // Entry operations
  createEntry(entry: InsertEntry): Promise<Entry>;
  getEntry(id: number): Promise<Entry | undefined>;
  updateEntry(id: number, data: Partial<Entry>): Promise<Entry>;
  getUserEntries(userId: number): Promise<Entry[]>;
  getUserWinningEntries(userId: number): Promise<Entry[]>;
  getCompetitionEntries(competitionId: number): Promise<Entry[]>;
  
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
  
  async getTicketsByNumbers(competitionId: number, numbers: number[]): Promise<Ticket[]> {
    console.log(`🎯 getTicketsByNumbers - Looking for tickets with numbers ${JSON.stringify(numbers)} in competition ${competitionId}`);
    
    try {
      // First check if the tickets even exist
      const allTickets = await db
        .select()
        .from(tickets)
        .where(eq(tickets.competitionId, competitionId));
      
      console.log(`🎯 getTicketsByNumbers - Competition has ${allTickets.length} total tickets`);
      console.log(`🎯 getTicketsByNumbers - Sample of ticket numbers in db:`, allTickets.slice(0, 5).map(t => t.number));
      
      // Get the tickets with the specified numbers
      const result = await db
        .select()
        .from(tickets)
        .where(
          and(
            eq(tickets.competitionId, competitionId),
            inArray(tickets.number, numbers)
          )
        );
      
      console.log(`🎯 getTicketsByNumbers - Found ${result.length} tickets out of ${numbers.length} requested`);
      
      if (result.length < numbers.length) {
        console.warn(`⚠️ getTicketsByNumbers - Missing tickets!`, {
          requested: numbers,
          found: result.map(t => t.number)
        });
      }
      
      // Log the tickets and their status
      result.forEach(ticket => {
        console.log(`🎫 Ticket #${ticket.number} - status: ${ticket.status}, ID: ${ticket.id}`);
      });
      
      return result;
    } catch (error) {
      console.error(`❌ getTicketsByNumbers - Error:`, error);
      throw error;
    }
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
    console.log(`🎫 purchaseTickets - Processing tickets ${JSON.stringify(ticketIds)} for user ${userId}`);
    
    // First, verify the tickets we're trying to purchase
    const ticketsToUpdate = await db
      .select()
      .from(tickets)
      .where(inArray(tickets.id, ticketIds));
    
    console.log(`🎫 purchaseTickets - Found ${ticketsToUpdate.length} tickets to update`);
    console.log(`🎫 purchaseTickets - Ticket details:`, ticketsToUpdate);
    
    if (ticketsToUpdate.length === 0) {
      console.warn(`❌ purchaseTickets - No tickets found with IDs: ${ticketIds}`);
      return [];
    }
    
    if (ticketsToUpdate.length !== ticketIds.length) {
      console.warn(`⚠️ purchaseTickets - Not all tickets were found. Expected ${ticketIds.length}, found ${ticketsToUpdate.length}`);
    }
    
    // Check if any tickets are already purchased
    const alreadyPurchased = ticketsToUpdate.filter(t => t.status === 'purchased');
    if (alreadyPurchased.length > 0) {
      console.warn(`⚠️ purchaseTickets - ${alreadyPurchased.length} tickets are already purchased:`, 
        alreadyPurchased.map(t => `ID: ${t.id}, Number: ${t.number}`));
    }
    
    const now = new Date();
    
    try {
      console.log(`🎫 purchaseTickets - Updating tickets to purchased status...`);
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
      
      console.log(`✅ purchaseTickets - Successfully updated ${purchasedTickets.length} tickets to purchased status`);
      console.log(`🎫 purchaseTickets - Updated ticket details:`, purchasedTickets);
      
      return purchasedTickets;
    } catch (error) {
      console.error(`❌ purchaseTickets - Error updating tickets:`, error);
      throw error;
    }
  }
  
  // Entry operations
  async createEntry(entry: InsertEntry): Promise<Entry> {
    console.log(`📝 STEP 4 - createEntry - Creating entry with data:`, entry);
    
    try {
      // First check if this competition exists
      const competition = await this.getCompetition(entry.competitionId);
      if (!competition) {
        console.error(`❌ STEP 4 - createEntry - Error: Competition with ID ${entry.competitionId} not found`);
        throw new Error(`Competition with ID ${entry.competitionId} not found`);
      }
      console.log(`📝 STEP 4 - createEntry - Validated competition exists:`, competition.title);
      
      // Validate user exists
      const user = await this.getUser(entry.userId);
      if (!user) {
        console.error(`❌ STEP 4 - createEntry - Error: User with ID ${entry.userId} not found`);
        throw new Error(`User with ID ${entry.userId} not found`);
      }
      console.log(`📝 STEP 4 - createEntry - Validated user exists:`, user.username);
      
      // Verify the ticketIds string format
      if (!entry.ticketIds || !entry.ticketIds.match(/^(\d+)(,\d+)*$/)) {
        console.error(`❌ STEP 4 - createEntry - Error: Invalid ticket IDs format: ${entry.ticketIds}`);
        throw new Error(`Invalid ticket IDs format: ${entry.ticketIds}`);
      }
      
      // Try to insert with direct SQL first for debugging
      console.log(`📝 STEP 4 - createEntry - Executing direct SQL insert...`);
      try {
        const directQuery = `
          INSERT INTO entries (user_id, competition_id, ticket_ids, status, stripe_payment_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        const now = new Date();
        const sqlResult = await db.execute(directQuery, [
          entry.userId, 
          entry.competitionId, 
          entry.ticketIds, 
          entry.status, 
          entry.stripePaymentId || null,
          now
        ]);
        
        console.log(`✅ STEP 4 - createEntry - Direct SQL insert successful:`, sqlResult.rows[0]);
        
        // Convert to proper Entry type with correct type conversions
        const row = sqlResult.rows[0];
        return {
          id: parseInt(row.id, 10),
          userId: parseInt(row.user_id, 10),
          competitionId: parseInt(row.competition_id, 10),
          ticketIds: row.ticket_ids,
          status: row.status,
          stripePaymentId: row.stripe_payment_id,
          createdAt: new Date(row.created_at)
        };
      } catch (sqlError) {
        console.error(`❌ STEP 4 - createEntry - Direct SQL insert failed:`, sqlError);
        
        // Fall back to Drizzle ORM
        console.log(`📝 STEP 4 - createEntry - Falling back to Drizzle ORM...`);
        const [result] = await db
          .insert(entries)
          .values(entry)
          .returning();
        
        console.log(`✅ STEP 4 - createEntry - Drizzle ORM insert successful:`, result);
        return result;
      }
    } catch (error) {
      console.error(`❌ STEP 4 - createEntry - Error creating entry:`, error);
      throw error;
    }
  }
  
  async getEntry(id: number): Promise<Entry | undefined> {
    const [entry] = await db
      .select()
      .from(entries)
      .where(eq(entries.id, id));
    return entry;
  }
  
  async updateEntry(id: number, data: Partial<Entry>): Promise<Entry> {
    const [entry] = await db
      .update(entries)
      .set(data)
      .where(eq(entries.id, id))
      .returning();
    return entry;
  }
  
  async getCompetitionEntries(competitionId: number): Promise<Entry[]> {
    const competitionEntries = await db
      .select()
      .from(entries)
      .where(eq(entries.competitionId, competitionId))
      .orderBy(desc(entries.createdAt));
    
    return competitionEntries;
  }
  
  async getUserEntries(userId: number): Promise<Entry[]> {
    console.log(`🔍 STEP 5 - getUserEntries - Fetching entries for user ID: ${userId}`);
    
    // Verify the userId parameter is valid
    if (!userId || isNaN(userId) || userId <= 0) {
      console.error(`❌ STEP 5 - getUserEntries - Invalid userId parameter: ${userId}`);
      return []; // Return empty array instead of throwing an error
    }
    
    try {
      console.log(`🔍 STEP 5 - getUserEntries - Using Drizzle ORM to fetch entries`);
      
      // Log directly to see the structure of entries
      try {
        console.log(`🔍 STEP 5 - Database table info check`);
        
        // Log out the schema for reference
        const entriesSchema = await db.execute(
          `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'entries'`
        );
        console.log(`🔍 Table structure (entries):`, entriesSchema.rows);
        
        const usersSchema = await db.execute(
          `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'`
        );
        console.log(`🔍 Table structure (users):`, usersSchema.rows);
        
        // Check if the user exists
        const userCheckResult = await db.execute(
          `SELECT id, username, email FROM users WHERE id = $1`, 
          [userId]
        );
        console.log(`🔍 User check results:`, userCheckResult.rows);
        
        if (userCheckResult.rows.length === 0) {
          console.warn(`⚠️ STEP 5 - getUserEntries - User with ID ${userId} not found`);
          return []; // Exit early if user doesn't exist
        }
        
        // First check how many entries exist for this user
        const countQueryResult = await db.execute(
          `SELECT COUNT(*) FROM entries WHERE user_id = $1`,
          [userId]
        );
        console.log(`🔍 Count result:`, countQueryResult.rows[0]);
        
        // If no entries, return empty array
        if (parseInt(countQueryResult.rows[0].count) === 0) {
          console.log(`ℹ️ STEP 5 - getUserEntries - No entries found for user ID ${userId}`);
          return [];
        }
        
        // Safely fetch the entries using a simple SQL query
        const entriesResult = await db.execute(
          `SELECT e.*, c.title as competition_title, c.image_url as competition_image_url 
           FROM entries e 
           JOIN competitions c ON e.competition_id = c.id 
           WHERE e.user_id = $1 
           ORDER BY e.created_at DESC`,
          [userId]
        );
        
        console.log(`✅ STEP 5 - Found ${entriesResult.rows.length} entries:`, entriesResult.rows);
        
        // Convert the raw SQL result to Entry objects - with proper type casting
        return entriesResult.rows.map(row => ({
          id: parseInt(row.id, 10),
          userId: parseInt(row.user_id, 10),
          competitionId: parseInt(row.competition_id, 10),
          ticketIds: row.ticket_ids,
          status: row.status,
          stripePaymentId: row.stripe_payment_id,
          createdAt: new Date(row.created_at),
          // Add competition details
          competition: {
            title: row.competition_title,
            imageUrl: row.competition_image_url
          }
        }));
        
      } catch (sqlError) {
        console.error(`❌ STEP 5 - SQL diagnostic error:`, sqlError);
        // Try to continue with Drizzle if SQL fails
      }
      
      // Fallback to using Drizzle ORM if the SQL approach fails
      const userEntries = await db
        .select({
          entry: entries,
          competition: competitions,
        })
        .from(entries)
        .innerJoin(competitions, eq(entries.competitionId, competitions.id))
        .where(eq(entries.userId, userId))
        .orderBy(desc(entries.createdAt));
      
      console.log(`✅ STEP 5 - getUserEntries - Retrieved ${userEntries.length} entries with Drizzle`);
      
      // Convert the Drizzle results to have the same structure as the SQL results
      return userEntries.map(row => ({
        ...row.entry,
        competition: {
          title: row.competition.title,
          imageUrl: row.competition.imageUrl
        }
      }));
      
    } catch (error) {
      console.error(`❌ STEP 5 - getUserEntries - Error fetching entries:`, error);
      // Return empty array instead of throwing to prevent disrupting the frontend
      return []; 
    }
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
    
    return winningEntries.map(row => ({
      ...row.entry,
      competition: {
        title: row.competition.title,
        imageUrl: row.competition.imageUrl
      }
    }));
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
