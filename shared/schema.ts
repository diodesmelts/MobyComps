import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, primaryKey, uniqueIndex, real, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const competitionStatusEnum = pgEnum('competition_status', ['draft', 'live', 'completed', 'cancelled']);
export const categoryEnum = pgEnum('category', ['electronics', 'travel', 'beauty', 'household', 'cash_prizes', 'family']);
export const ticketStatusEnum = pgEnum('ticket_status', ['available', 'reserved', 'purchased']);
export const entryStatusEnum = pgEnum('entry_status', ['active', 'won', 'lost']);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  address: text('address'),
  city: text('city'),
  postcode: text('postcode'),
  country: text('country'),
  phoneNumber: text('phone_number'),
  role: userRoleEnum('role').notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id'),
});

// Competitions table
export const competitions = pgTable('competitions', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url').notNull(),
  maxTickets: integer('max_tickets').notNull(),
  ticketPrice: real('ticket_price').notNull(),
  ticketsSold: integer('tickets_sold').notNull().default(0),
  drawDate: timestamp('draw_date').notNull(),
  closeDate: timestamp('close_date'),
  status: competitionStatusEnum('status').notNull().default('draft'),
  category: categoryEnum('category').notNull(),
  featured: boolean('featured').notNull().default(false),
  cashAlternative: real('cash_alternative'),
  quizQuestion: text('quiz_question').notNull(),
  quizAnswer: text('quiz_answer').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: integer('created_by').references(() => users.id),
});

// Tickets table
export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  competitionId: integer('competition_id').notNull().references(() => competitions.id),
  number: integer('number').notNull(),
  status: ticketStatusEnum('status').notNull().default('available'),
  userId: integer('user_id').references(() => users.id),
  reservedAt: timestamp('reserved_at'),
  reservedUntil: timestamp('reserved_until'),
  purchasedAt: timestamp('purchased_at'),
  sessionId: text('session_id'),
}, (table) => {
  return {
    compNumberIdx: uniqueIndex('comp_number_idx').on(table.competitionId, table.number),
  };
});

// Entries table
export const entries = pgTable('entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  competitionId: integer('competition_id').notNull().references(() => competitions.id),
  ticketIds: text('ticket_ids').notNull(), // Comma-separated list of ticket IDs
  status: entryStatusEnum('status').notNull().default('active'),
  stripePaymentId: text('stripe_payment_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Cart items table
export const cartItems = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  userId: integer('user_id').references(() => users.id),
  competitionId: integer('competition_id').notNull().references(() => competitions.id),
  ticketNumbers: text('ticket_numbers').notNull(), // Comma-separated list of ticket numbers
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
});

// Site configuration
export const siteConfig = pgTable('site_config', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedBy: integer('updated_by').references(() => users.id),
});

// Insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    role: true,
    stripeCustomerId: true,
  });

export const insertCompetitionSchema = createInsertSchema(competitions)
  .omit({
    id: true,
    ticketsSold: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    // Override the date fields with string transformers
    drawDate: z.string().transform(val => new Date(val)),
    closeDate: z.string().optional().transform(val => val ? new Date(val) : null)
  });

// Create a schema for PATCH/PUT operations that can handle partial updates
export const updateCompetitionSchema = insertCompetitionSchema.partial().extend({
  // Ensure date fields are properly processed even in partial updates
  drawDate: z.string().transform(val => new Date(val)).optional(),
  closeDate: z.string().transform(val => new Date(val)).nullable().optional(),
});

export const insertTicketSchema = createInsertSchema(tickets)
  .omit({
    id: true,
    reservedAt: true,
    reservedUntil: true,
    purchasedAt: true,
  });

export const insertEntrySchema = createInsertSchema(entries)
  .omit({
    id: true,
    createdAt: true,
  });

export const insertCartItemSchema = createInsertSchema(cartItems)
  .omit({
    id: true,
    createdAt: true,
  });

export const insertSiteConfigSchema = createInsertSchema(siteConfig)
  .omit({
    id: true,
    updatedAt: true,
  });

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Competition = typeof competitions.$inferSelect;
export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Entry = typeof entries.$inferSelect;
export type InsertEntry = z.infer<typeof insertEntrySchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type SiteConfig = typeof siteConfig.$inferSelect;
export type InsertSiteConfig = z.infer<typeof insertSiteConfigSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
