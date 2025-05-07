import { storage } from "../storage";
import { Competition } from "@shared/schema";

export class DrawService {
  /**
   * Perform a draw for a competition
   * @param competitionId The competition ID to draw
   * @returns The winning entry ID and ticket number
   */
  async performDraw(competitionId: number) {
    // Get the competition
    const competition = await storage.getCompetition(competitionId);
    
    if (!competition) {
      throw new Error('Competition not found');
    }
    
    if (competition.status !== 'live') {
      throw new Error('Competition is not live');
    }
    
    const now = new Date();
    const drawDate = new Date(competition.drawDate);
    
    // Ensure draw date has passed
    if (drawDate > now) {
      throw new Error('Draw date has not yet been reached');
    }
    
    // Get all purchased tickets for the competition
    const tickets = await storage.listTickets(competitionId, 'purchased');
    
    if (tickets.length === 0) {
      throw new Error('No tickets have been purchased for this competition');
    }
    
    // Select a random ticket
    const winningTicket = tickets[Math.floor(Math.random() * tickets.length)];
    
    if (!winningTicket.userId) {
      throw new Error('Winning ticket has no user associated with it');
    }
    
    // Mark the competition as completed
    await storage.updateCompetition(competitionId, {
      status: 'completed'
    });
    
    // Find the entry associated with this ticket
    const allEntries = await storage.getUserEntries(winningTicket.userId);
    const winningEntry = allEntries.find(entry => {
      const ticketIds = entry.ticketIds.split(',').map(Number);
      return entry.competitionId === competitionId && ticketIds.includes(winningTicket.id);
    });
    
    if (!winningEntry) {
      throw new Error('Could not find entry for winning ticket');
    }
    
    // Mark the entry as won
    await storage.updateEntry(winningEntry.id, {
      status: 'won'
    });
    
    // Mark all other entries for this competition as lost
    const otherEntries = allEntries.filter(entry => 
      entry.competitionId === competitionId && entry.id !== winningEntry.id
    );
    
    for (const entry of otherEntries) {
      await storage.updateEntry(entry.id, {
        status: 'lost'
      });
    }
    
    return {
      competition,
      winningTicket,
      winningEntry,
      winningUser: await storage.getUser(winningTicket.userId)
    };
  }
  
  /**
   * Check for competitions that are ready to be drawn
   * @returns Number of competitions drawn
   */
  async checkAndPerformDraws() {
    const now = new Date();
    
    // Find competitions where draw date has passed but status is still live
    const competitions = await storage.listCompetitions({
      status: 'live'
    });
    
    const competitionsToDrawIds = competitions.competitions.filter(comp => 
      new Date(comp.drawDate) <= now || 
      (comp.ticketsSold >= comp.maxTickets)
    ).map(comp => comp.id);
    
    // Perform draws for each competition
    let drawsPerformed = 0;
    for (const competitionId of competitionsToDrawIds) {
      try {
        await this.performDraw(competitionId);
        drawsPerformed++;
      } catch (error) {
        console.error(`Error performing draw for competition ${competitionId}:`, error);
      }
    }
    
    return drawsPerformed;
  }
  
  /**
   * Schedule upcoming draws
   * This method sets up scheduled tasks for drawings
   */
  scheduleDraws() {
    // Check for draws every hour
    setInterval(async () => {
      try {
        const drawsPerformed = await this.checkAndPerformDraws();
        if (drawsPerformed > 0) {
          console.log(`Performed ${drawsPerformed} competition draws`);
        }
      } catch (error) {
        console.error('Error checking for draws:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
    
    // Also check for expired tickets every 5 minutes
    setInterval(async () => {
      try {
        const ticketsReleased = await storage.releaseExpiredTickets();
        if (ticketsReleased > 0) {
          console.log(`Released ${ticketsReleased} expired ticket reservations`);
        }
      } catch (error) {
        console.error('Error releasing expired tickets:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes
  }
}

export const drawService = new DrawService();
