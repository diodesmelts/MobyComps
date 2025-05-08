import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16" as any, // Type assertion to avoid TypeScript error with API version
});

class StripeService {
  // Create a payment intent for checkout
  async createPaymentIntent(amount: number, metadata: Record<string, string> = {}): Promise<Stripe.PaymentIntent> {
    try {
      console.log(`🔄 Creating payment intent for £${amount} with metadata:`, metadata);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "gbp",
        payment_method_types: ["card"],
        metadata: {
          integration_check: "moby_comps_payment",
          ...metadata
        },
      });

      console.log(`✅ Payment intent created successfully with ID: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error: any) {
      console.error("❌ Stripe payment intent creation error:", error.message);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  // Retrieve payment intent
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error: any) {
      console.error("Stripe payment intent retrieval error:", error.message);
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  // Create a Stripe customer
  async createCustomer(email: string, name: string): Promise<Stripe.Customer> {
    try {
      return await stripe.customers.create({
        email,
        name,
      });
    } catch (error: any) {
      console.error("Stripe customer creation error:", error.message);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  // Process a refund
  async createRefund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };
      
      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Convert to cents
      }
      
      return await stripe.refunds.create(refundParams);
    } catch (error: any) {
      console.error("Stripe refund error:", error.message);
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }
}

export const stripeService = new StripeService();
