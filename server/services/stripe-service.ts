import Stripe from 'stripe';
import { storage } from '../storage';
import { ticketService } from './ticket-service';
import { Competition, CartItem } from '@shared/schema';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required environment variable: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' as any, // Type casting to avoid version mismatch
});

export class StripeService {
  /**
   * Create a payment intent for cart checkout
   * @param userId User ID making the purchase
   * @param sessionId Session ID for identifying cart items
   * @param cartItems Cart items to checkout
   * @param competitions All competitions data needed for pricing
   * @returns Stripe checkout session URL and session ID
   */
  async createCheckoutSession(
    userId: number | undefined,
    sessionId: string,
    cartItems: CartItem[],
    competitions: Competition[]
  ) {
    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }
    
    // Calculate total and prepare line items
    const lineItems = cartItems.map(item => {
      const competition = competitions.find(c => c.id === item.competitionId);
      if (!competition) {
        throw new Error(`Competition not found for cart item: ${item.id}`);
      }
      
      const ticketNumbers = item.ticketNumbers.split(',');
      
      return {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: competition.title,
            description: `${ticketNumbers.length} ticket${ticketNumbers.length > 1 ? 's' : ''} - Numbers: ${item.ticketNumbers}`,
          },
          unit_amount: Math.round(competition.ticketPrice * 100), // Convert to cents
        },
        quantity: ticketNumbers.length,
      };
    });
    
    // Prepare metadata for webhook processing
    const metadata = {
      sessionId,
      userId: userId?.toString() || '',
      cartItemIds: cartItems.map(item => item.id.toString()).join(','),
    };
    
    // Use direct URLs for success and cancel redirects rather than route patterns
    const baseUrl = process.env.NODE_ENV === 'production'
      ? process.env.RENDER_EXTERNAL_URL 
        ? `https://${process.env.RENDER_EXTERNAL_URL}`
        : ''
      : 'http://localhost:5000';
      
    const success_url = `${baseUrl}/my-entries?success=true`;
    const cancel_url = `${baseUrl}/cart?canceled=true`;
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url,
      cancel_url,
      metadata,
    });
    
    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }
  
  /**
   * Process successful payment
   * @param stripeSessionId Stripe checkout session ID
   * @returns Purchased tickets
   */
  async processPayment(stripeSessionId: string) {
    // Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
    
    if (session.payment_status !== 'paid') {
      throw new Error('Payment not completed');
    }
    
    // Extract metadata
    const { userId, sessionId, cartItemIds } = session.metadata || {};
    
    if (!userId || !sessionId || !cartItemIds) {
      throw new Error('Invalid metadata in Stripe session');
    }
    
    // Get cart items
    const cartItems = await storage.getCartItems(sessionId);
    
    if (cartItems.length === 0) {
      throw new Error('No cart items found');
    }
    
    // Get all ticket IDs from cart items
    const ticketIds: number[] = [];
    for (const item of cartItems) {
      // Get actual ticket objects for each ticket number
      const ticketNumbers = item.ticketNumbers.split(',').map(Number);
      
      for (const number of ticketNumbers) {
        const ticket = await storage.getTicket(item.competitionId, number);
        if (ticket) {
          ticketIds.push(ticket.id);
        }
      }
    }
    
    if (ticketIds.length === 0) {
      throw new Error('No valid tickets found for purchase');
    }
    
    // Convert reserved tickets to purchased
    const purchasedTickets = await ticketService.purchaseTickets(
      ticketIds, 
      parseInt(userId)
    );
    
    // Clear cart
    await storage.clearCart(sessionId);
    
    return purchasedTickets;
  }
  
  /**
   * Handle Stripe webhook events
   * @param payload Webhook request body
   * @param signature Stripe signature header
   * @returns Processing result
   */
  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      // For development, just log the event
      console.log('Webhook signature verification skipped (no secret)');
      const event = JSON.parse(payload.toString());
      return this.processWebhookEvent(event);
    }
    
    // Verify webhook signature
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret
      );
      return this.processWebhookEvent(event);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw new Error('Invalid webhook signature');
    }
  }
  
  /**
   * Process Stripe webhook event
   * @param event Stripe event
   * @returns Processing result
   */
  private async processWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // Process the successful payment
        if (session.payment_status === 'paid') {
          await this.processPayment(session.id);
          return { success: true, message: 'Payment processed successfully' };
        }
        break;
      }
      // Add other event handlers as needed
    }
    
    return { success: true, message: 'Event received' };
  }
}

export const stripeService = new StripeService();
