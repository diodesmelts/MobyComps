import { storage } from "../storage";
import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { competitions, entries, tickets, users } from "@shared/schema";

class DrawService {
  // Execute the draw for a competition
  async executeDraw(competitionId: number): Promise<{
    success: boolean;
    message?: string;
    winner?: any;
    winningTicket?: number;
  }> {
    try {
      // Get the competition
      const competition = await storage.getCompetitionById(competitionId);
      
      if (!competition) {
        return {
          success: false,
          message: "Competition not found",
        };
      }
      
      // Check if the competition has already had a winner
      if (competition.winnerUserId) {
        return {
          success: false,
          message: "This competition already has a winner",
        };
      }
      
      // Get all purchased tickets for the competition
      const purchasedTickets = await storage.getTicketsByCompetitionIdAndStatus(competitionId, "purchased");
      
      if (purchasedTickets.length === 0) {
        return {
          success: false,
          message: "No tickets have been purchased for this competition",
        };
      }
      
      // Randomly select a winning ticket
      const randomIndex = Math.floor(Math.random() * purchasedTickets.length);
      const winningTicket = purchasedTickets[randomIndex];
      
      if (!winningTicket.userId) {
        return {
          success: false,
          message: "Winning ticket has no associated user",
        };
      }
      
      // Get the winning user
      const winner = await storage.getUser(winningTicket.userId);
      
      if (!winner) {
        return {
          success: false,
          message: "Winner user not found",
        };
      }
      
      // Find the entry that contains this ticket
      const userEntries = await storage.getUserEntries(winner.id);
      let winningEntry;
      
      for (const entry of userEntries) {
        if (entry.competitionId === competitionId && entry.ticketNumbers.includes(winningTicket.number)) {
          winningEntry = entry;
          break;
        }
      }
      
      if (!winningEntry) {
        return {
          success: false,
          message: "Could not find winner's entry",
        };
      }
      
      // Update the competition with the winner
      await storage.updateCompetition(competitionId, {
        winnerUserId: winner.id,
      });
      
      // Mark the entry as a winner
      await db
        .update(entries)
        .set({ isWinner: true })
        .where(eq(entries.id, winningEntry.id));
      
      // Create a win record
      const win = await storage.createWin({
        userId: winner.id,
        competitionId,
        entryId: winningEntry.id,
        status: "pending",
        cashoutSelected: false,
      });
      
      return {
        success: true,
        winner: {
          id: winner.id,
          username: winner.username,
          email: winner.email,
        },
        winningTicket: winningTicket.number,
      };
    } catch (error: any) {
      console.error("Draw execution error:", error.message);
      return {
        success: false,
        message: `Failed to execute draw: ${error.message}`,
      };
    }
  }

  // Get competitions ready for draw (past draw date)
  async getReadyForDrawCompetitions(): Promise<any[]> {
    const now = new Date();
    
    // Find competitions that are past their draw date and don't have a winner yet
    const readyCompetitions = await db
      .select()
      .from(competitions)
      .where(
        and(
          eq(competitions.isLive, true),
          lte(competitions.drawDate, now),
          eq(competitions.winnerUserId, null)
        )
      );
    
    return readyCompetitions;
  }
}

export const drawService = new DrawService();
