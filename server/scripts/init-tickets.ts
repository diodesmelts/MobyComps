import { storage } from "../storage";
import { ticketService } from "../services/ticket-service";

/**
 * Initialize tickets for existing competitions
 * This script ensures all competitions have the correct number of tickets
 */
async function initializeTickets() {
  console.log("Starting ticket initialization for existing competitions...");
  
  try {
    // Get all competitions
    const { competitions } = await storage.listCompetitions();
    console.log(`Found ${competitions.length} competitions`);
    
    for (const competition of competitions) {
      console.log(`Processing competition ID ${competition.id}: ${competition.title}`);
      
      // Check existing tickets
      const existingTickets = await storage.listTickets(competition.id);
      console.log(`Competition has ${existingTickets.length} tickets out of ${competition.maxTickets} required`);
      
      if (existingTickets.length < competition.maxTickets) {
        const ticketsToCreate = competition.maxTickets - existingTickets.length;
        console.log(`Creating ${ticketsToCreate} missing tickets...`);
        
        // Find the highest ticket number already created
        const highestNumber = existingTickets.length > 0 
          ? Math.max(...existingTickets.map(t => t.number)) 
          : 0;
        
        // Create missing tickets - but only add new ones starting from the highest number
        const startNumber = highestNumber + 1;
        const count = competition.maxTickets - existingTickets.length;
        
        // Create tickets in batches directly via SQL for better performance
        const batchSize = 100;
        for (let i = 0; i < count; i += batchSize) {
          const batchCount = Math.min(batchSize, count - i);
          console.log(`Creating batch ${i / batchSize + 1}: ${batchCount} tickets (${startNumber + i} to ${startNumber + i + batchCount - 1})`);
          
          // Create a batch of tickets
          const promises = [];
          for (let j = 0; j < batchCount; j++) {
            const ticketNumber = startNumber + i + j;
            promises.push(storage.createTicket({
              competitionId: competition.id,
              number: ticketNumber,
              status: 'available',
              reservedUntil: null,
              sessionId: null
            }));
          }
          
          // Wait for the batch to complete before moving to the next one
          await Promise.all(promises);
        }
        
        console.log(`Successfully created tickets for competition ID ${competition.id}`);
      } else {
        console.log(`Competition ID ${competition.id} already has the correct number of tickets`);
      }
    }
    
    console.log("Ticket initialization completed successfully!");
  } catch (error) {
    console.error("Error initializing tickets:", error);
  }
}

// Run the initialization
initializeTickets().then(() => {
  console.log("Ticket initialization script completed");
  process.exit(0);
}).catch(error => {
  console.error("Fatal error during ticket initialization:", error);
  process.exit(1);
});