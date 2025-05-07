import { eq, and, ilike, desc, sql, asc } from "drizzle-orm";
import { db } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";
import {
  users,
  categories,
  competitions,
  tickets,
  cartItems,
  entries,
  wins,
  siteConfig,
  User,
  Category,
  Competition,
  Ticket,
  CartItem,
  Entry,
  Win,
  SiteConfig,
  InsertUser,
  InsertCompetition,
  InsertTicket,
  InsertCartItem,
  InsertEntry,
  InsertWin,
} from "@shared/schema";
import { DashboardStats, SiteConfigResponse } from "@shared/types";

const PostgresStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  getUsers(page: number, limit: number, search: string): Promise<{ users: User[], total: number, totalPages: number }>;
  
  // Category methods
  getAllCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  
  // Competition methods
  getAllCompetitions(): Promise<Competition[]>;
  getAllLiveCompetitions(): Promise<Competition[]>;
  getCompetitionById(id: number): Promise<Competition | undefined>;
  getCompetitionsByCategory(category: string): Promise<Competition[]>;
  createCompetition(competition: InsertCompetition): Promise<Competition>;
  updateCompetition(id: number, data: Partial<Competition>): Promise<Competition>;
  deleteCompetition(id: number): Promise<void>;
  incrementCompetitionSoldTickets(id: number, count: number): Promise<void>;
  
  // Ticket methods
  getTicket(id: number): Promise<Ticket | undefined>;
  getTicketByCompetitionAndNumber(competitionId: number, number: number): Promise<Ticket | undefined>;
  getTicketsByCompetitionId(competitionId: number): Promise<Ticket[]>;
  getTicketsByCompetitionIdAndStatus(competitionId: number, status: 'available' | 'reserved' | 'purchased'): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, data: Partial<Ticket>): Promise<Ticket>;
  
  // Cart methods
  getUserCart(userId: number): Promise<{ items: any[], total: number }>;
  getCartItemById(id: number): Promise<CartItem | undefined>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  removeFromCart(cartItemId: number, userId: number): Promise<void>;
  clearCart(userId: number): Promise<void>;
  
  // Entry methods
  getUserEntries(userId: number): Promise<any[]>;
  createEntry(entry: InsertEntry): Promise<Entry>;
  
  // Win methods
  getUserWins(userId: number): Promise<any[]>;
  createWin(win: InsertWin): Promise<Win>;
  updateWinStatus(id: number, status: 'pending' | 'claimed' | 'delivered'): Promise<Win>;
  
  // Site config methods
  getSiteConfig(): Promise<SiteConfigResponse>;
  updateSiteConfig(config: Partial<SiteConfig>): Promise<SiteConfigResponse>;
  
  // Admin methods
  getAdminStats(): Promise<DashboardStats>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getUsers(page: number, limit: number, search: string): Promise<{ users: User[], total: number, totalPages: number }> {
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Build the query
    let query = db.select().from(users);
    
    // Add search condition if search term provided
    if (search) {
      query = query.where(
        ilike(users.username, `%${search}%`)
      );
    }
    
    // Get total count
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const total = countResult[0]?.count || 0;
    
    // Get paginated results
    const results = await query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(users.createdAt));
    
    return {
      users: results,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Category methods
  async getAllCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(asc(categories.name));
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug));
    return category;
  }

  // Competition methods
  async getAllCompetitions(): Promise<Competition[]> {
    return db.select().from(competitions).orderBy(desc(competitions.createdAt));
  }

  async getAllLiveCompetitions(): Promise<Competition[]> {
    return db
      .select()
      .from(competitions)
      .where(eq(competitions.isLive, true))
      .orderBy(desc(competitions.createdAt));
  }

  async getCompetitionById(id: number): Promise<Competition | undefined> {
    const [competition] = await db
      .select()
      .from(competitions)
      .where(eq(competitions.id, id));
    
    if (competition) {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, competition.categoryId));
      
      return { ...competition, category };
    }
    
    return competition;
  }

  async getCompetitionsByCategory(category: string): Promise<Competition[]> {
    // Get category by name or slug
    const [categoryRecord] = await db
      .select()
      .from(categories)
      .where(
        or(
          eq(categories.name, category),
          eq(categories.slug, category.toLowerCase())
        )
      );
    
    if (!categoryRecord) {
      return [];
    }
    
    return db
      .select()
      .from(competitions)
      .where(
        and(
          eq(competitions.categoryId, categoryRecord.id),
          eq(competitions.isLive, true)
        )
      )
      .orderBy(desc(competitions.createdAt));
  }

  async createCompetition(competitionData: InsertCompetition): Promise<Competition> {
    const [competition] = await db
      .insert(competitions)
      .values(competitionData)
      .returning();
    return competition;
  }

  async updateCompetition(id: number, data: Partial<Competition>): Promise<Competition> {
    const [competition] = await db
      .update(competitions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(competitions.id, id))
      .returning();
    return competition;
  }

  async deleteCompetition(id: number): Promise<void> {
    await db.delete(competitions).where(eq(competitions.id, id));
  }

  async incrementCompetitionSoldTickets(id: number, count: number): Promise<void> {
    await db
      .update(competitions)
      .set({
        soldTickets: sql`${competitions.soldTickets} + ${count}`,
      })
      .where(eq(competitions.id, id));
  }

  // Ticket methods
  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, id));
    return ticket;
  }

  async getTicketByCompetitionAndNumber(competitionId: number, number: number): Promise<Ticket | undefined> {
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

  async getTicketsByCompetitionId(competitionId: number): Promise<Ticket[]> {
    return db
      .select()
      .from(tickets)
      .where(eq(tickets.competitionId, competitionId))
      .orderBy(asc(tickets.number));
  }

  async getTicketsByCompetitionIdAndStatus(
    competitionId: number,
    status: 'available' | 'reserved' | 'purchased'
  ): Promise<Ticket[]> {
    return db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.competitionId, competitionId),
          eq(tickets.status, status)
        )
      )
      .orderBy(asc(tickets.number));
  }

  async createTicket(ticketData: InsertTicket): Promise<Ticket> {
    const [ticket] = await db
      .insert(tickets)
      .values(ticketData)
      .returning();
    return ticket;
  }

  async updateTicket(id: number, data: Partial<Ticket>): Promise<Ticket> {
    const [ticket] = await db
      .update(tickets)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return ticket;
  }

  // Cart methods
  async getUserCart(userId: number): Promise<{ items: any[], total: number }> {
    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId));

    const itemsWithDetails = [];
    let total = 0;

    for (const item of items) {
      const [competition] = await db
        .select()
        .from(competitions)
        .where(eq(competitions.id, item.competitionId));

      if (competition) {
        const ticketCount = item.ticketIds.length;
        const totalPrice = ticketCount * competition.ticketPrice;
        total += totalPrice;

        itemsWithDetails.push({
          ...item,
          competitionTitle: competition.title,
          imageUrl: competition.imageUrl,
          ticketPrice: competition.ticketPrice,
          ticketCount,
          totalPrice,
          drawDate: competition.drawDate,
        });
      }
    }

    return {
      items: itemsWithDetails,
      total,
    };
  }

  async getCartItemById(id: number): Promise<CartItem | undefined> {
    const [cartItem] = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.id, id));
    return cartItem;
  }

  async addToCart(itemData: InsertCartItem): Promise<CartItem> {
    // Check if the competition exists
    const [competition] = await db
      .select()
      .from(competitions)
      .where(eq(competitions.id, itemData.competitionId));

    if (!competition) {
      throw new Error("Competition not found");
    }

    // Check if the tickets are valid
    for (const ticketId of itemData.ticketIds) {
      const ticket = await this.getTicketByCompetitionAndNumber(itemData.competitionId, ticketId);
      if (!ticket || (ticket.status !== "available" && ticket.status !== "reserved") || (ticket.status === "reserved" && ticket.userId !== itemData.userId)) {
        throw new Error(`Ticket #${ticketId} is not available`);
      }
    }

    // Add to cart
    const [cartItem] = await db
      .insert(cartItems)
      .values(itemData)
      .returning();
    return cartItem;
  }

  async removeFromCart(cartItemId: number, userId: number): Promise<void> {
    await db
      .delete(cartItems)
      .where(
        and(
          eq(cartItems.id, cartItemId),
          eq(cartItems.userId, userId)
        )
      );
  }

  async clearCart(userId: number): Promise<void> {
    await db
      .delete(cartItems)
      .where(eq(cartItems.userId, userId));
  }

  // Entry methods
  async getUserEntries(userId: number): Promise<any[]> {
    const userEntries = await db
      .select()
      .from(entries)
      .where(eq(entries.userId, userId))
      .orderBy(desc(entries.createdAt));

    const entriesWithDetails = [];

    for (const entry of userEntries) {
      const [competition] = await db
        .select()
        .from(competitions)
        .where(eq(competitions.id, entry.competitionId));

      if (competition) {
        entriesWithDetails.push({
          ...entry,
          competition,
        });
      }
    }

    return entriesWithDetails;
  }

  async createEntry(entryData: InsertEntry): Promise<Entry> {
    const [entry] = await db
      .insert(entries)
      .values(entryData)
      .returning();
    return entry;
  }

  // Win methods
  async getUserWins(userId: number): Promise<any[]> {
    const userWins = await db
      .select()
      .from(wins)
      .where(eq(wins.userId, userId))
      .orderBy(desc(wins.createdAt));

    const winsWithDetails = [];

    for (const win of userWins) {
      const [competition] = await db
        .select()
        .from(competitions)
        .where(eq(competitions.id, win.competitionId));

      const [entry] = await db
        .select()
        .from(entries)
        .where(eq(entries.id, win.entryId));

      if (competition && entry) {
        winsWithDetails.push({
          ...win,
          competition,
          entry,
        });
      }
    }

    return winsWithDetails;
  }

  async createWin(winData: InsertWin): Promise<Win> {
    const [win] = await db
      .insert(wins)
      .values(winData)
      .returning();
    return win;
  }

  async updateWinStatus(id: number, status: 'pending' | 'claimed' | 'delivered'): Promise<Win> {
    const [win] = await db
      .update(wins)
      .set({ status, updatedAt: new Date() })
      .where(eq(wins.id, id))
      .returning();
    return win;
  }

  // Site config methods
  async getSiteConfig(): Promise<SiteConfigResponse> {
    const [config] = await db.select().from(siteConfig);

    if (!config) {
      // Create default config if it doesn't exist
      const [newConfig] = await db
        .insert(siteConfig)
        .values({})
        .returning();
      
      return {
        heroBanner: null,
        marketingBanner: {
          text: "Sign up before 20th May and get £10.00 site credit!",
          enabled: true,
        },
        footerText: null,
      };
    }

    // Parse JSON values
    return {
      heroBanner: config.heroBanner ? JSON.parse(config.heroBanner) : null,
      marketingBanner: config.marketingBanner ? JSON.parse(config.marketingBanner) : {
        text: "Sign up before 20th May and get £10.00 site credit!",
        enabled: true,
      },
      footerText: config.footerText,
    };
  }

  async updateSiteConfig(configData: Partial<SiteConfig>): Promise<SiteConfigResponse> {
    // Format the data correctly
    const dataToUpdate: Partial<SiteConfig> = {};
    
    if (configData.heroBanner !== undefined) {
      if (typeof configData.heroBanner === 'string') {
        dataToUpdate.heroBanner = configData.heroBanner;
      } else {
        dataToUpdate.heroBanner = JSON.stringify(configData.heroBanner);
      }
    }
    
    if (configData.marketingBanner !== undefined) {
      if (typeof configData.marketingBanner === 'string') {
        dataToUpdate.marketingBanner = configData.marketingBanner;
      } else {
        dataToUpdate.marketingBanner = JSON.stringify(configData.marketingBanner);
      }
    }
    
    if (configData.footerText !== undefined) {
      dataToUpdate.footerText = configData.footerText;
    }
    
    // Check if config exists
    const [existingConfig] = await db.select().from(siteConfig);
    
    if (existingConfig) {
      // Update existing config
      const [config] = await db
        .update(siteConfig)
        .set({ ...dataToUpdate, updatedAt: new Date() })
        .where(eq(siteConfig.id, existingConfig.id))
        .returning();
      
      return this.getSiteConfig();
    } else {
      // Create new config
      await db
        .insert(siteConfig)
        .values(dataToUpdate);
      
      return this.getSiteConfig();
    }
  }

  // Admin methods
  async getAdminStats(): Promise<DashboardStats> {
    // In a real implementation, this would query the database
    // for actual statistics. For now, we'll return mock data.
    
    // Total revenue
    const totalRevenue = 8721.50;
    const revenueChangePercent = 12.5;
    
    // Users
    const activeUsers = 1243;
    const newUsersThisWeek = 34;
    
    // Competitions
    const activeCompetitions = 15;
    const completedCompetitions = 8;
    
    // Tickets
    const ticketsSold = 7862;
    const ticketSoldToday = 134;
    
    // Revenue by category
    const revenueByCategory = [
      { name: "Electronics", value: 3245.80 },
      { name: "Household", value: 1897.30 },
      { name: "Beauty", value: 853.25 },
      { name: "Travel", value: 1562.15 },
      { name: "Cash", value: 986.50 },
      { name: "Family", value: 176.50 },
    ];
    
    // Sales trend (last 30 days)
    const salesTrend = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (30 - i - 1));
      return {
        date: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        tickets: Math.floor(Math.random() * 100) + 50, // Random value between 50-150
      };
    });
    
    // Recent activity
    const recentActivity = [
      {
        title: "New competition created",
        description: "Nintendo Switch OLED competition added",
        time: "2 hours ago",
      },
      {
        title: "Draw completed",
        description: "Ninja Air Fryer competition - Winner: john_doe",
        time: "4 hours ago",
      },
      {
        title: "Prize delivered",
        description: "PlayStation 5 delivered to winner",
        time: "Yesterday",
      },
      {
        title: "New user registered",
        description: "User sarah_j has joined the platform",
        time: "2 days ago",
      },
      {
        title: "Competition sold out",
        description: "£500 Cash Prize competition is now sold out",
        time: "3 days ago",
      },
    ];
    
    return {
      totalRevenue,
      revenueChangePercent,
      activeUsers,
      newUsersThisWeek,
      activeCompetitions,
      completedCompetitions,
      ticketsSold,
      ticketSoldToday,
      revenueByCategory,
      salesTrend,
      recentActivity,
    };
  }
}

export const storage = new DatabaseStorage();
