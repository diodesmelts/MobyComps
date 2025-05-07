import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, pgEnum, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const ticketStatusEnum = pgEnum('ticket_status', ['available', 'reserved', 'purchased']);
export const categoryEnum = pgEnum('category', ['Electronics', 'Household', 'Beauty', 'Travel', 'Cash', 'Family']);
export const winStatusEnum = pgEnum('win_status', ['pending', 'claimed', 'delivered']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  stripeCustomerId: text("stripe_customer_id"),
});

// User relations
export const usersRelations = relations(users, ({ many }) => ({
  entries: many(entries),
  cartItems: many(cartItems),
}));

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

// Categories relations
export const categoriesRelations = relations(categories, ({ many }) => ({
  competitions: many(competitions),
}));

// Competitions table
export const competitions = pgTable("competitions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),
  ticketPrice: doublePrecision("ticket_price").notNull(),
  maxTickets: integer("max_tickets").notNull(),
  soldTickets: integer("sold_tickets").default(0).notNull(),
  cashAlternative: doublePrecision("cash_alternative"),
  drawDate: timestamp("draw_date").notNull(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  quizQuestion: text("quiz_question").notNull(),
  quizAnswers: json("quiz_answers").notNull().$type<string[]>(),
  quizCorrectAnswer: text("quiz_correct_answer").notNull(),
  isLive: boolean("is_live").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  winnerUserId: integer("winner_user_id").references(() => users.id),
});

// Competition relations
export const competitionsRelations = relations(competitions, ({ one, many }) => ({
  category: one(categories, {
    fields: [competitions.categoryId],
    references: [categories.id],
  }),
  tickets: many(tickets),
  entries: many(entries),
  winner: one(users, {
    fields: [competitions.winnerUserId],
    references: [users.id],
  }),
}));

// Tickets table
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  competitionId: integer("competition_id").notNull().references(() => competitions.id),
  number: integer("number").notNull(),
  status: ticketStatusEnum("status").default("available").notNull(),
  userId: integer("user_id").references(() => users.id),
  reservedUntil: timestamp("reserved_until"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Index on competitionId and number for uniqueness
// This would be added as a migration

// Tickets relations
export const ticketsRelations = relations(tickets, ({ one }) => ({
  competition: one(competitions, {
    fields: [tickets.competitionId],
    references: [competitions.id],
  }),
  user: one(users, {
    fields: [tickets.userId],
    references: [users.id],
  }),
}));

// Cart items table
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  competitionId: integer("competition_id").notNull().references(() => competitions.id),
  ticketIds: json("ticket_ids").notNull().$type<number[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cart items relations
export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  competition: one(competitions, {
    fields: [cartItems.competitionId],
    references: [competitions.id],
  }),
}));

// Entries table
export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  competitionId: integer("competition_id").notNull().references(() => competitions.id),
  ticketNumbers: json("ticket_numbers").notNull().$type<number[]>(),
  isWinner: boolean("is_winner").default(false).notNull(),
  stripePaymentId: text("stripe_payment_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Entries relations
export const entriesRelations = relations(entries, ({ one }) => ({
  user: one(users, {
    fields: [entries.userId],
    references: [users.id],
  }),
  competition: one(competitions, {
    fields: [entries.competitionId],
    references: [competitions.id],
  }),
}));

// Wins table
export const wins = pgTable("wins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  competitionId: integer("competition_id").notNull().references(() => competitions.id),
  entryId: integer("entry_id").notNull().references(() => entries.id),
  status: winStatusEnum("status").default("pending").notNull(),
  cashoutSelected: boolean("cashout_selected").default(false),
  deliveryAddress: text("delivery_address"),
  trackingNumber: text("tracking_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Wins relations
export const winsRelations = relations(wins, ({ one }) => ({
  user: one(users, {
    fields: [wins.userId],
    references: [users.id],
  }),
  competition: one(competitions, {
    fields: [wins.competitionId],
    references: [competitions.id],
  }),
  entry: one(entries, {
    fields: [wins.entryId],
    references: [entries.id],
  }),
}));

// Site configuration table
export const siteConfig = pgTable("site_config", {
  id: serial("id").primaryKey(),
  heroBanner: text("hero_banner"),
  marketingBanner: text("marketing_banner"),
  footerText: text("footer_text"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, stripeCustomerId: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertCompetitionSchema = createInsertSchema(competitions).omit({ 
  id: true, 
  soldTickets: true, 
  createdAt: true, 
  updatedAt: true,
  winnerUserId: true 
});
export const insertTicketSchema = createInsertSchema(tickets).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertCartItemSchema = createInsertSchema(cartItems).omit({ 
  id: true, 
  createdAt: true 
});
export const insertEntrySchema = createInsertSchema(entries).omit({ 
  id: true, 
  createdAt: true 
});
export const insertWinSchema = createInsertSchema(wins).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertSiteConfigSchema = createInsertSchema(siteConfig).omit({ 
  id: true, 
  updatedAt: true 
});

// Types
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Competition = typeof competitions.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type Entry = typeof entries.$inferSelect;
export type Win = typeof wins.$inferSelect;
export type SiteConfig = typeof siteConfig.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertCompetition = z.infer<typeof insertCompetitionSchema>;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type InsertEntry = z.infer<typeof insertEntrySchema>;
export type InsertWin = z.infer<typeof insertWinSchema>;
export type InsertSiteConfig = z.infer<typeof insertSiteConfigSchema>;
