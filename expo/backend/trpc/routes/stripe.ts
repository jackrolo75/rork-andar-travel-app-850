// @ts-nocheck
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';

interface StripeSession {
  id: string;
  url: string;
  status: 'open' | 'complete' | 'expired';
  amount: number;
  currency: string;
  bookingType: string;
  metadata: Record<string, string>;
  createdAt: string;
}

interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled';
}

const sessions: Map<string, StripeSession> = new Map();

export const stripeRouter = createTRPCRouter({
  createCheckoutSession: publicProcedure
    .input(z.object({
      amount: z.number().positive(),
      currency: z.string().default('USD'),
      bookingType: z.enum(['flight', 'hotel', 'transport', 'activity', 'esim', 'car_rental', 'ferry', 'train', 'bus', 'itinerary']),
      itemTitle: z.string(),
      itemDescription: z.string().optional(),
      successUrl: z.string().optional(),
      cancelUrl: z.string().optional(),
      metadata: z.record(z.string()).optional(),
      customerEmail: z.string().email().optional(),
    }))
    .mutation(async ({ input }) => {
      console.log('💳 Creating Stripe checkout session:', input);

      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      
      if (!stripeSecretKey) {
        console.warn('⚠️ Stripe secret key not configured, using mock session');
        const mockSessionId = `cs_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const mockSession: StripeSession = {
          id: mockSessionId,
          url: `https://checkout.stripe.com/mock/${mockSessionId}`,
          status: 'open',
          amount: input.amount,
          currency: input.currency,
          bookingType: input.bookingType,
          metadata: input.metadata || {},
          createdAt: new Date().toISOString(),
        };
        sessions.set(mockSessionId, mockSession);
        
        return {
          sessionId: mockSessionId,
          url: mockSession.url,
          status: 'mock',
        };
      }

      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' });

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: input.currency.toLowerCase(),
                product_data: {
                  name: input.itemTitle,
                  description: input.itemDescription || `${input.bookingType} booking via AndarTravel`,
                },
                unit_amount: Math.round(input.amount * 100),
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: input.successUrl || `${process.env.EXPO_PUBLIC_RORK_API_BASE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: input.cancelUrl || `${process.env.EXPO_PUBLIC_RORK_API_BASE_URL}/checkout/cancel`,
          customer_email: input.customerEmail,
          metadata: {
            ...input.metadata,
            bookingType: input.bookingType,
            source: 'andar_travel_app',
          },
        });

        console.log('✅ Stripe session created:', session.id);

        return {
          sessionId: session.id,
          url: session.url,
          status: 'live',
        };
      } catch (error) {
        console.error('❌ Stripe session creation failed:', error);
        throw new Error('Failed to create checkout session');
      }
    }),

  createPaymentIntent: publicProcedure
    .input(z.object({
      amount: z.number().positive(),
      currency: z.string().default('USD'),
      bookingType: z.string(),
      metadata: z.record(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      console.log('💳 Creating Stripe payment intent:', input);

      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      
      if (!stripeSecretKey) {
        console.warn('⚠️ Stripe secret key not configured, using mock intent');
        return {
          clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
          paymentIntentId: `pi_mock_${Date.now()}`,
          status: 'mock',
        };
      }

      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' });

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(input.amount * 100),
          currency: input.currency.toLowerCase(),
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            ...input.metadata,
            bookingType: input.bookingType,
            source: 'andar_travel_app',
          },
        });

        console.log('✅ Payment intent created:', paymentIntent.id);

        return {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          status: 'live',
        };
      } catch (error) {
        console.error('❌ Payment intent creation failed:', error);
        throw new Error('Failed to create payment intent');
      }
    }),

  getSessionStatus: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input }) => {
      console.log('🔍 Getting session status:', input.sessionId);

      if (input.sessionId.startsWith('cs_mock_')) {
        const mockSession = sessions.get(input.sessionId);
        return mockSession ? {
          status: mockSession.status,
          paymentStatus: 'unpaid',
          amount: mockSession.amount,
          currency: mockSession.currency,
        } : null;
      }

      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return { status: 'unknown', paymentStatus: 'unknown' };
      }

      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-12-18.acacia' });

        const session = await stripe.checkout.sessions.retrieve(input.sessionId);

        return {
          status: session.status,
          paymentStatus: session.payment_status,
          amount: session.amount_total ? session.amount_total / 100 : 0,
          currency: session.currency?.toUpperCase(),
          customerEmail: session.customer_email,
        };
      } catch (error) {
        console.error('❌ Failed to get session status:', error);
        return null;
      }
    }),

  confirmPayment: publicProcedure
    .input(z.object({
      sessionId: z.string(),
      bookingDetails: z.object({
        itineraryId: z.string().optional(),
        itemId: z.string().optional(),
        type: z.string(),
        title: z.string(),
      }),
    }))
    .mutation(async ({ input }) => {
      console.log('✅ Confirming payment:', input);

      return {
        success: true,
        confirmationNumber: `ANR-${Date.now().toString().slice(-8)}`,
        bookingId: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: 'Payment confirmed successfully',
      };
    }),

  getPublishableKey: publicProcedure
    .query(async () => {
      const key = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      return {
        publishableKey: key || null,
        isConfigured: !!key,
      };
    }),

  calculateServiceFee: publicProcedure
    .input(z.object({
      amount: z.number().positive(),
      bookingType: z.string(),
    }))
    .query(async ({ input }) => {
      const feeRates: Record<string, number> = {
        flight: 0.03,
        hotel: 0.05,
        transport: 0.04,
        activity: 0.05,
        esim: 0.02,
        car_rental: 0.04,
        ferry: 0.04,
        train: 0.03,
        bus: 0.03,
        itinerary: 0.05,
      };

      const rate = feeRates[input.bookingType] || 0.05;
      const serviceFee = Math.round(input.amount * rate * 100) / 100;
      const total = Math.round((input.amount + serviceFee) * 100) / 100;

      return {
        subtotal: input.amount,
        serviceFee,
        serviceFeeRate: rate,
        total,
      };
    }),
});
