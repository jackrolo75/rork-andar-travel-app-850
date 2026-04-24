// @ts-nocheck
import Stripe from 'stripe';

let _stripe: any = null;

function getStripeClient(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not configured. Set it in environment variables.');
    }
    _stripe = new Stripe(key, {
      apiVersion: '2024-12-18.acacia',
    });
    console.log('[StripeService] Stripe client initialized successfully');
  }
  return _stripe;
}

export type BookingType = 'transport' | 'accommodation' | 'ferry';

export interface CheckoutSessionParams {
  bookingId: string;
  bookingType: BookingType;
  basePrice: number;
  currency: string;
  passengerName: string;
  phoneNumber: string;
  routeId?: string;
  routeDetails?: {
    origin: string;
    destination: string;
    departureTime: string;
    operator: string;
  };
  successUrl: string;
  cancelUrl: string;
}

export interface PriceBreakdown {
  basePrice: number;
  serviceFee: number;
  stripeFee: number;
  total: number;
  currency: string;
  commission: number;
}

export class StripeService {
  private calculateCommission(bookingType: BookingType, basePrice: number): number {
    const commissionRates = {
      transport: 0.08,
      ferry: 0.10,
      accommodation: 0.12,
    };
    
    return basePrice * commissionRates[bookingType];
  }

  private calculateStripeFee(amount: number): number {
    return (amount * 0.05);
  }

  calculatePriceBreakdown(
    bookingType: BookingType,
    basePrice: number,
    currency: string
  ): PriceBreakdown {
    const commission = this.calculateCommission(bookingType, basePrice);
    const stripeFee = this.calculateStripeFee(basePrice);
    const serviceFee = commission + stripeFee;
    const total = basePrice + serviceFee;

    console.log('💰 Price Breakdown:', {
      bookingType,
      basePrice,
      commission: `${(bookingType === 'transport' ? 8 : bookingType === 'ferry' ? 10 : 12)}%`,
      stripeFee: '5%',
      serviceFee,
      total,
    });

    return {
      basePrice,
      serviceFee,
      stripeFee,
      total,
      currency,
      commission,
    };
  }

  private async withRetry<T>(fn: () => Promise<T>, maxRetries: number = 2): Promise<T> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        const isRetryable = error.type === 'StripeConnectionError' ||
          error.type === 'StripeAPIError' ||
          error.statusCode === 429 ||
          error.statusCode >= 500;
        if (!isRetryable || attempt === maxRetries) {
          throw error;
        }
        const delay = Math.min(1000 * Math.pow(2, attempt), 4000);
        console.warn(`[StripeService] Retry ${attempt + 1}/${maxRetries} after ${delay}ms:`, error.message);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw lastError;
  }

  async createCheckoutSession(params: CheckoutSessionParams): Promise<Stripe.Checkout.Session> {
    const stripe = getStripeClient();
    const priceBreakdown = this.calculatePriceBreakdown(
      params.bookingType,
      params.basePrice,
      params.currency
    );

    const amountInCents = Math.round(priceBreakdown.total * 100);

    console.log('🎫 Creating Stripe Checkout Session:', {
      bookingId: params.bookingId,
      bookingType: params.bookingType,
      amount: priceBreakdown.total,
      currency: params.currency,
    });

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: {
            name: this.getProductName(params),
            description: this.getProductDescription(params),
            metadata: {
              bookingType: params.bookingType,
              routeId: params.routeId || '',
            },
          },
          unit_amount: amountInCents,
        },
        quantity: 1,
      },
    ];

    return this.withRetry(async () => {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        customer_email: undefined,
        metadata: {
          bookingId: params.bookingId,
          bookingType: params.bookingType,
          passengerName: params.passengerName,
          phoneNumber: params.phoneNumber,
          routeId: params.routeId || '',
          basePrice: params.basePrice.toString(),
          serviceFee: priceBreakdown.serviceFee.toString(),
          commission: priceBreakdown.commission.toString(),
        },
        payment_intent_data: {
          metadata: {
            bookingId: params.bookingId,
            bookingType: params.bookingType,
          },
        },
      });

      console.log('✅ Checkout session created:', session.id);
      return session;
    });
  }

  private getProductName(params: CheckoutSessionParams): string {
    if (params.bookingType === 'transport' && params.routeDetails) {
      return `ANDAR - ${params.routeDetails.origin} → ${params.routeDetails.destination}`;
    }
    if (params.bookingType === 'ferry' && params.routeDetails) {
      return `Ferry - ${params.routeDetails.origin} → ${params.routeDetails.destination}`;
    }
    if (params.bookingType === 'accommodation') {
      return `Accommodation - ${params.passengerName}`;
    }
    return 'ANDAR Booking';
  }

  private getProductDescription(params: CheckoutSessionParams): string {
    if (params.routeDetails) {
      return `${params.routeDetails.operator} - Departure: ${params.routeDetails.departureTime}`;
    }
    return `Booking ID: ${params.bookingId}`;
  }

  async retrieveSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    const stripe = getStripeClient();
    return await stripe.checkout.sessions.retrieve(sessionId);
  }

  async verifyWebhookSignature(
    payload: string | Buffer,
    signature: string
  ): Promise<Stripe.Event> {
    const stripe = getStripeClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  async createRefund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    const stripe = getStripeClient();
    console.log('🔄 Creating refund for payment intent:', paymentIntentId);

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    console.log('✅ Refund created:', refund.id);

    return refund;
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const stripe = getStripeClient();
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }

  isConfigured(): boolean {
    return !!process.env.STRIPE_SECRET_KEY;
  }
}

export const stripeService = new StripeService();
