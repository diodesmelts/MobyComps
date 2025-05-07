import { storage } from "../storage";
import { Ticket } from "@shared/schema";

export class TicketService {
  /**
   * Reserve tickets for a user session
   * @param competitionId The competition ID
   * @param ticketNumbers Array of ticket numbers to reserve
   * @param sessionId The user's session ID
   * @param expiryMinutes How long to reserve the tickets for (in minutes)
   * @returns Array of reserved tickets or empty array if tickets couldn't be reserved
   */
  async reserveTickets(
    competitionId: number,
    ticketNumbers: number[],
    sessionId: string,
    expiryMinutes: number = 10
  ): Promise<Ticket[]> {
    // First check if the competition exists and is live
    const competition = await storage.getCompetition(competitionId);
    if (!competition || competition.status !== 'live') {
      throw new Error('Competition not found or not active');
    }
    
    // Then check if the ticket numbers are valid (within range)
    const invalidTickets = ticketNumbers.filter(num => num <= 0 || num > competition.maxTickets);
    if (invalidTickets.length > 0) {
      throw new Error(`Invalid ticket numbers: ${invalidTickets.join(', ')}`);
    }
    
    // Reserve the tickets
    const reservedTickets = await storage.reserveTickets(
      competitionId,
      ticketNumbers,
      sessionId,
      expiryMinutes
    );
    
    return reservedTickets;
  }
  
  /**
   * Get ticket status for a competition
   * @param competitionId The competition ID
   * @returns Object containing ticket status information
   */
  async getTicketStatus(competitionId: number, sessionId: string) {
    // Check if the competition exists
    const competition = await storage.getCompetition(competitionId);
    if (!competition) {
      throw new Error('Competition not found');
    }
    
    // Get all tickets for the competition
    const tickets = await storage.listTickets(competitionId);
    
    return {
      competition,
      tickets,
      sessionId
    };
  }
  
  /**
   * Release reserved tickets for a session
   * @param sessionId The user's session ID
   * @returns Number of tickets released
   */
  async releaseReservedTickets(sessionId: string): Promise<number> {
    return await storage.releaseReservedTickets(sessionId);
  }
  
  /**
   * Release expired ticket reservations across all sessions
   * @returns Number of tickets released
   */
  async releaseExpiredTickets(): Promise<number> {
    return await storage.releaseExpiredTickets();
  }
  
  /**
   * Purchase tickets - convert reserved tickets to purchased
   * @param ticketIds Array of ticket IDs to purchase
   * @param userId The user ID making the purchase
   * @returns Array of purchased tickets
   */
  async purchaseTickets(ticketIds: number[], userId: number): Promise<Ticket[]> {
    // First, ensure all tickets exist and are reserved
    const ticketPromises = ticketIds.map(id => storage.getTicketById(id));
    const tickets = await Promise.all(ticketPromises);
    
    // Check if any tickets are missing or not reserved
    const invalidTickets = tickets.filter(t => !t || t.status !== 'reserved');
    if (invalidTickets.length > 0) {
      throw new Error('Some tickets are no longer available');
    }
    
    // Group tickets by competition for creating entries
    const competitionTickets: Record<number, number[]> = {};
    tickets.forEach(ticket => {
      if (!ticket) return;
      
      if (!competitionTickets[ticket.competitionId]) {
        competitionTickets[ticket.competitionId] = [];
      }
      competitionTickets[ticket.competitionId].push(ticket.id);
    });
    
    // Purchase the tickets
    const purchasedTickets = await storage.purchaseTickets(ticketIds, userId);
    
    // Create entries for each competition
    for (const [competitionId, ticketIds] of Object.entries(competitionTickets)) {
      await storage.createEntry({
        userId,
        competitionId: parseInt(competitionId),
        ticketIds: ticketIds.join(','),
        status: 'active',
      });
      
      // Update competition ticket count
      await storage.incrementTicketsSold(parseInt(competitionId), ticketIds.length);
    }
    
    return purchasedTickets;
  }
  
  /**
   * Initialize tickets for a new competition
   * @param competitionId The competition ID
   * @param maxTickets The maximum number of tickets
   * @returns Number of tickets created
   */
  async initializeTickets(competitionId: number, maxTickets: number): Promise<number> {
    let count = 0;
    // Create tickets in batches to avoid memory issues with large competitions
    const batchSize = 1000;
    
    for (let i = 1; i <= maxTickets; i += batchSize) {
      const end = Math.min(i + batchSize - 1, maxTickets);
      const tickets = [];
      
      for (let num = i; num <= end; num++) {
        tickets.push({
          competitionId,
          number: num,
          status: 'available' as const,
        });
      }
      
      // Batch create tickets
      for (const ticket of tickets) {
        await storage.createTicket(ticket);
        count++;
      }
    }
    
    return count;
  }
}

export const ticketService = new TicketService();
