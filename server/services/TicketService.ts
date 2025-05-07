import { db } from "../db";
import { storage } from "../storage";
import { eq, and, lte, gt } from "drizzle-orm";
import { tickets } from "@shared/schema";
import { lockTickets, unlockTickets } from "../utils/ticket-locker";
import { TicketReservationResponse } from "@shared/types";

class TicketService {
  private RESERVATION_DURATION_MINUTES = 10; // 10 minutes reservation time

  // Create tickets for a new competition
  async createCompetitionTickets(competitionId: number, maxTickets: number): Promise<void> {
    // Create tickets in batches of 100 to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < maxTickets; i += batchSize) {
      const batch = [];
      const end = Math.min(i + batchSize, maxTickets);
      
      for (let j = i; j < end; j++) {
        batch.push({
          competitionId,
          number: j + 1, // Ticket numbers start at 1
          status: "available",
        });
      }
      
      await db.insert(tickets).values(batch);
    }
  }

  // Create additional tickets if the max tickets is increased
  async createAdditionalTickets(competitionId: number, currentMax: number, additional: number): Promise<void> {
    // Create tickets in batches of 100 to avoid memory issues
    const batchSize = 100;
    for (let i = 0; i < additional; i += batchSize) {
      const batch = [];
      const end = Math.min(i + batchSize, additional);
      
      for (let j = i; j < end; j++) {
        batch.push({
          competitionId,
          number: currentMax + j + 1,
          status: "available",
        });
      }
      
      await db.insert(tickets).values(batch);
    }
  }

  // Get all available tickets for a competition
  async getAvailableTickets(competitionId: number): Promise<number[]> {
    const availableTickets = await storage.getTicketsByCompetitionIdAndStatus(competitionId, "available");
    return availableTickets.map(ticket => ticket.number);
  }

  // Reserve tickets for a user
  async reserveTickets(competitionId: number, userId: number, ticketNumbers: number[]): Promise<TicketReservationResponse> {
    // Lock tickets to prevent race conditions
    await lockTickets(competitionId, ticketNumbers);

    try {
      // Check if tickets are available
      for (const number of ticketNumbers) {
        const ticket = await storage.getTicketByCompetitionAndNumber(competitionId, number);
        
        if (!ticket || ticket.status !== "available") {
          await unlockTickets(competitionId, ticketNumbers);
          throw new Error(`Ticket #${number} is not available`);
        }
      }

      // Calculate reservation expiry time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.RESERVATION_DURATION_MINUTES);

      // Update tickets to reserved status
      for (const number of ticketNumbers) {
        const ticket = await storage.getTicketByCompetitionAndNumber(competitionId, number);
        if (ticket) {
          await storage.updateTicket(ticket.id, {
            status: "reserved",
            userId,
            reservedUntil: expiresAt,
          });
        }
      }

      // Release the lock
      await unlockTickets(competitionId, ticketNumbers);

      return {
        success: true,
        tickets: ticketNumbers,
        expiresAt: expiresAt.toISOString(),
        timeLeftSeconds: this.RESERVATION_DURATION_MINUTES * 60,
      };
    } catch (error) {
      // Make sure to release the lock even in case of error
      await unlockTickets(competitionId, ticketNumbers);
      throw error;
    }
  }

  // Release reserved tickets
  async releaseTickets(competitionId: number, userId: number, ticketNumbers: number[]): Promise<void> {
    // Lock tickets to prevent race conditions
    await lockTickets(competitionId, ticketNumbers);

    try {
      // Release each ticket if it's reserved by this user
      for (const number of ticketNumbers) {
        const ticket = await storage.getTicketByCompetitionAndNumber(competitionId, number);
        
        if (ticket && ticket.status === "reserved" && ticket.userId === userId) {
          await storage.updateTicket(ticket.id, {
            status: "available",
            userId: null,
            reservedUntil: null,
          });
        }
      }

      // Release the lock
      await unlockTickets(competitionId, ticketNumbers);
    } catch (error) {
      // Make sure to release the lock even in case of error
      await unlockTickets(competitionId, ticketNumbers);
      throw error;
    }
  }

  // Update ticket status (e.g., from reserved to purchased)
  async updateTicketsStatus(
    competitionId: number,
    ticketNumbers: number[],
    userId: number,
    status: 'reserved' | 'purchased'
  ): Promise<void> {
    // Lock tickets to prevent race conditions
    await lockTickets(competitionId, ticketNumbers);

    try {
      // Update each ticket
      for (const number of ticketNumbers) {
        const ticket = await storage.getTicketByCompetitionAndNumber(competitionId, number);
        
        if (ticket) {
          // Only update if the ticket is owned by the user or available (for reserving)
          if (status === 'reserved' && ticket.status === 'available') {
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + this.RESERVATION_DURATION_MINUTES);
            
            await storage.updateTicket(ticket.id, {
              status: 'reserved',
              userId,
              reservedUntil: expiresAt,
            });
          } else if (status === 'purchased' && ticket.status === 'reserved' && ticket.userId === userId) {
            await storage.updateTicket(ticket.id, {
              status: 'purchased',
              reservedUntil: null,
            });
          }
        }
      }

      // Release the lock
      await unlockTickets(competitionId, ticketNumbers);
    } catch (error) {
      // Make sure to release the lock even in case of error
      await unlockTickets(competitionId, ticketNumbers);
      throw error;
    }
  }

  // Clean up expired reservations (to be called by a cron job)
  async cleanupExpiredReservations(): Promise<void> {
    const now = new Date();
    
    // Find all tickets with expired reservations
    const expiredTickets = await db
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.status, "reserved"),
          lte(tickets.reservedUntil, now)
        )
      );
    
    // Release each expired ticket
    for (const ticket of expiredTickets) {
      await storage.updateTicket(ticket.id, {
        status: "available",
        userId: null,
        reservedUntil: null,
      });
    }
  }
}

export const ticketService = new TicketService();
