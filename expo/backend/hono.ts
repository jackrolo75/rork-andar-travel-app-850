// @ts-nocheck
import { trpcServer } from '@hono/trpc-server';
import { Hono } from 'hono';
import type { Context } from 'hono';
import { cors } from 'hono/cors';
import { compress } from 'hono/compress';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import Redis from 'ioredis';
import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';

import { appRouter } from './trpc/app-router';
import { createContext } from './trpc/create-context';

import { CurrencyConverter } from './services/currency-converter';
import { gpsMomentum } from './services/gps-momentum';
import type { StripePaymentRecord } from './types';
import { flutterflowBridge } from './flutterflow-bridge';
import { stripeService, type CheckoutSessionParams } from './services/stripe-service';
import { EmailService } from './services/email-service';
import { paymentStore } from './services/payment-store';
import { NotificationService } from './services/notification-service';
import { activitiesStore } from './services/activities-store';
import { buildTrackedRedirectUrl, resolvePartnerUrl, generateClickId, GYG_PARTNER_ID } from './services/redirect-builder';
import { selectPartner, getAllMetrics, getPartnerRegistryInfo } from './services/partner-selector';
import { enqueueSearch, getJobStatus, getQueueStats } from './services/activities-worker';
import { getFlag, getFeatureFlags } from './services/feature-flags';
import { bookingStore } from './services/booking-store';
import { runReconciliation, getReconciliationSummary } from './services/payment-reconciliation';

function escapeHtml(unsafe: string | undefined | null): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeJs(unsafe: string | undefined | null): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'") 
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/<\//g, '<\\/');
}

const currencyConverter = new CurrencyConverter();
const emailService = new EmailService();
const notificationService = new NotificationService(emailService);

const CALLBACK_SECRET = process.env.PAYMENT_CALLBACK_SECRET || 'andar_internal_callback_2026';

const processedWebhookEvents = new Set<string>();
const WEBHOOK_EVENT_TTL = 24 * 60 * 60 * 1000;
let lastWebhookCleanup = Date.now();

function isWebhookEventProcessed(eventId: string): boolean {
  if (Date.now() - lastWebhookCleanup > WEBHOOK_EVENT_TTL) {
    processedWebhookEvents.clear();
    lastWebhookCleanup = Date.now();
    console.log('[Webhook] Cleaned up processed events set');
  }
  if (processedWebhookEvents.has(eventId)) {
    return true;
  }
  processedWebhookEvents.add(eventId);
  return false;
}

let rateLimiter: RateLimiterRedis | RateLimiterMemory;

if (process.env.REDIS_URL) {
  const redisClient = new Redis(process.env.REDIS_URL);
  
  redisClient.on('connect', () => {
    console.log('🔗 Redis connected for rate limiting');
  });
  
  redisClient.on('error', (err) => {
    console.error('❌ Redis error:', err);
  });
  
  rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl_checkout',
    points: 10,
    duration: 60,
    blockDuration: 300,
  });
  
  console.log('🛡️ Rate limiter initialized with Redis');
} else {
  rateLimiter = new RateLimiterMemory({
    keyPrefix: 'rl_checkout',
    points: 10,
    duration: 60,
    blockDuration: 300,
  });
  
  console.log('🛡️ Rate limiter initialized with in-memory store (no REDIS_URL)');
}

const app = new Hono();

let io: SocketIOServer | null = null;

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  const httpServer = createServer();
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);

    socket.on('merchant:join', ({ merchantId }: { merchantId: string }) => {
      console.log(`🏪 Merchant ${merchantId} joined room`);
      socket.join(`merchant:${merchantId}`);
    });

    socket.on('disconnect', () => {
      console.log('👋 Client disconnected:', socket.id);
    });
  });

  const WS_PORT = process.env.WS_PORT || 3001;
  httpServer.listen(WS_PORT, () => {
    console.log(`🔌 WebSocket server running on port ${WS_PORT}`);
  });
}

export const emitPointsConfirmation = (merchantId: string, data: { transactionId: string; userId: string; points: number }) => {
  if (io) {
    io.to(`merchant:${merchantId}`).emit('points:confirmed', data);
    console.log(`📡 Emitted points confirmation to merchant:${merchantId}`, data);
  }
};

app.use('*', cors({
  origin: (origin) => {
    const allowedOrigins = [
      'https://rork.app',
      'https://andartravel.com',
      'https://www.andartravel.com',
      'http://localhost:8081',
      'http://localhost:19006',
      'http://localhost:8082',
      'exp://',
    ];
    
    if (!origin) return 'https://andartravel.com';
    
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return origin;
    }

    if (origin.includes('rork.app') || origin.includes('rork-app') || origin.includes('expo.dev')) {
      return origin;
    }
    
    if (process.env.NODE_ENV === 'development') {
      return origin;
    }
    
    console.warn(`[CORS] Rejected origin: ${origin}`);
    return 'https://andartravel.com';
  },
  credentials: true,
  maxAge: 86400,
  allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

app.use('*', compress({
  encoding: 'gzip',
  threshold: 1024,
}));

app.use(
  '/trpc/*',
  trpcServer({
    endpoint: '/api/trpc',
    router: appRouter,
    createContext,
  })
);

app.get('/', (c) => {
  return c.json({ 
    status: 'ok', 
    message: 'ANDAR API is running',
    services: [
      'Pricing Engine',
      'Payment Waterfall',
      'Email Notifications',
      'Loyalty Ledger'
    ]
  });
});

app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.post('/stripe/create-checkout', async (c) => {
  const clientIp = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  const requestId = c.req.header('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  try {
    await rateLimiter.consume(clientIp);
  } catch (rateLimitError: any) {
    const retryAfter = Math.ceil((rateLimitError.msBeforeNext || 60000) / 1000);
    console.warn(`⚠️ [${requestId}] Rate limit exceeded for ${clientIp}`);
    return c.json(
      {
        success: false,
        error: 'Too Many Requests',
        retryAfter,
        request_id: requestId,
      },
      429
    );
  }

  try {
    if (!stripeService.isConfigured()) {
      console.error(`❌ [${requestId}] STRIPE_SECRET_KEY not configured`);
      return c.json(
        {
          success: false,
          error: 'Payment service is not configured. Please contact support.',
          request_id: requestId,
        },
        503
      );
    }

    const body = await c.req.json();
    const { bookingId, bookingType, basePrice, currency, passengerName, phoneNumber, routeId, routeDetails } = body;

    if (!bookingId || !basePrice || !currency) {
      return c.json(
        {
          success: false,
          error: 'Missing required fields: bookingId, basePrice, currency',
          request_id: requestId,
        },
        400
      );
    }

    console.log(`💳 [${requestId}] Creating Stripe Checkout:`, { bookingId, bookingType, basePrice, currency });

    const baseUrl = c.req.header('origin') || process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
    
    const params: CheckoutSessionParams = {
      bookingId,
      bookingType: bookingType || 'transport',
      basePrice,
      currency,
      passengerName: passengerName || 'Guest',
      phoneNumber: phoneNumber || '',
      routeId,
      routeDetails,
      successUrl: `${baseUrl}/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/stripe/cancel`,
    };

    const session = await stripeService.createCheckoutSession(params);
    const priceBreakdown = stripeService.calculatePriceBreakdown(bookingType || 'transport', basePrice, currency);

    const paymentRecord: StripePaymentRecord = {
      id: `PAY_${Date.now()}`,
      bookingId,
      bookingType: bookingType || 'transport',
      stripeSessionId: session.id,
      basePrice,
      serviceFee: priceBreakdown.serviceFee,
      commission: priceBreakdown.commission,
      total: priceBreakdown.total,
      currency,
      status: 'pending',
      passengerName: passengerName || 'Guest',
      phoneNumber: phoneNumber || '',
      routeId,
      createdAt: new Date().toISOString(),
    };

    try {
      await paymentStore.set(session.id, paymentRecord);
    } catch (storeError) {
      console.warn(`⚠️ [${requestId}] Failed to persist payment record, continuing:`, storeError);
    }

    console.log(`✅ [${requestId}] Checkout session created:`, session.id);

    return c.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      priceBreakdown,
      request_id: requestId,
    });
  } catch (error: any) {
    console.error(`❌ [${requestId}] Stripe checkout error:`, error?.message, error?.type, error?.statusCode);

    const statusCode = error?.statusCode === 401 ? 502 :
      error?.statusCode === 429 ? 503 :
      error?.statusCode >= 500 ? 502 : 500;

    const userMessage = error?.type === 'StripeAuthenticationError'
      ? 'Payment service configuration error. Please contact support.'
      : error?.type === 'StripeConnectionError'
      ? 'Payment service temporarily unavailable. Please try again.'
      : error?.message || 'Failed to create checkout session';

    return c.json(
      {
        success: false,
        error: userMessage,
        request_id: requestId,
      },
      statusCode
    );
  }
});

app.post('/stripe/webhook', async (c) => {
  const signature = c.req.header('stripe-signature');
  
  if (!signature) {
    console.error('❌ Missing Stripe signature');
    return c.json({ error: 'Missing signature' }, 400);
  }

  try {
    const rawBody = await c.req.text();
    const event = await stripeService.verifyWebhookSignature(rawBody, signature);

    console.log('📨 Stripe Webhook Event:', event.type, event.id);

    if (isWebhookEventProcessed(event.id)) {
      console.log('⚠️ Duplicate webhook event, skipping:', event.id);
      return c.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        console.log('✅ Payment successful:', session.id);

        const paymentRecord = await paymentStore.get(session.id);
        
        if (paymentRecord) {
          await paymentStore.updateStatus(session.id, 'completed', {
            stripePaymentIntentId: session.payment_intent,
            paidAt: new Date().toISOString(),
          });

          const dualCurrency = currencyConverter.createDualCurrencyDisplay(
            paymentRecord.basePrice,
            paymentRecord.currency,
            'USD'
          );

          const qrCode = `ANDAR-${paymentRecord.bookingId}-${Date.now()}`;
          const seatNumber = `${Math.floor(Math.random() * 40) + 1}`;

          console.log('🔔 Sending ticket via NotificationService (email)...');
          const notificationResult = await notificationService.sendBookingConfirmation({
            bookingId: paymentRecord.bookingId,
            passengerName: paymentRecord.passengerName,
            passengerEmail: session.metadata?.passengerEmail || session.customer_details?.email,
            phoneNumber: paymentRecord.phoneNumber,
            route: {
              origin: session.metadata?.origin || 'Origin',
              destination: session.metadata?.destination || 'Destination',
              departureTime: session.metadata?.departureTime || 'TBD',
              arrivalTime: session.metadata?.arrivalTime || 'TBD',
            },
            price: paymentRecord.basePrice,
            currency: paymentRecord.currency,
            dualCurrency,
            seatNumber,
            qrCode,
          });

          console.log('🔔 Notification result:', {
            success: notificationResult.success,
            channel: notificationResult.channel,
            emailSuccess: notificationResult.emailResult?.success,
          });
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any;
        console.log('✅ Payment intent succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any;
        console.error('❌ Payment failed:', paymentIntent.id);
        
        const failedRecord = await paymentStore.findByPaymentIntentId(paymentIntent.id);
        if (failedRecord) {
          await paymentStore.updateStatus(failedRecord.sessionId, 'failed');
        }
        break;
      }

      default:
        console.log('⚠️ Unhandled event type:', event.type);
    }

    return c.json({ received: true });
  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return c.json({ error: error.message }, 400);
  }
});

app.get('/stripe/success', async (c) => {
  const sessionId = c.req.query('session_id');
  
  if (!sessionId) {
    return c.html(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
          }
          .container {
            background: white;
            border-radius: 16px;
            padding: 40px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Error</h1>
          <p>Session ID not found</p>
        </div>
      </body>
      </html>
    `);
  }

  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pago Exitoso</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #2D5A27 0%, #E2725B 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          margin: 0;
        }
        .container {
          background: white;
          border-radius: 24px;
          padding: 48px 32px;
          max-width: 400px;
          width: 100%;
          text-align: center;
          animation: slideUp 0.5s ease-out;
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .icon { font-size: 64px; margin-bottom: 24px; }
        h1 { color: #2D5A27; margin-bottom: 16px; font-size: 28px; }
        p { color: #666; line-height: 1.6; margin-bottom: 24px; }
        .close-btn {
          background: #E2725B;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
      </style>
      <script>
        window.onload = function() {
          setTimeout(function() {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAYMENT_SUCCESS' }));
            }
          }, 1000);
        };
      </script>
    </head>
    <body>
      <div class="container">
        <div class="icon">✅</div>
        <h1>¡Pago Exitoso!</h1>
        <p>Tu reserva ha sido confirmada.<br>Recibirás tu boleto por correo electrónico en unos momentos.</p>
        <button class="close-btn" onclick="window.close()">Cerrar</button>
      </div>
    </body>
    </html>
  `);
});

app.get('/stripe/cancel', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pago Cancelado</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #E2725B 0%, #2D5A27 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          margin: 0;
        }
        .container {
          background: white;
          border-radius: 24px;
          padding: 48px 32px;
          max-width: 400px;
          width: 100%;
          text-align: center;
        }
        .icon { font-size: 64px; margin-bottom: 24px; }
        h1 { color: #666; margin-bottom: 16px; font-size: 28px; }
        p { color: #999; line-height: 1.6; margin-bottom: 24px; }
        .close-btn {
          background: #E2725B;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
      </style>
      <script>
        window.onload = function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PAYMENT_CANCELLED' }));
          }
        };
      </script>
    </head>
    <body>
      <div class="container">
        <div class="icon">⚠️</div>
        <h1>Pago Cancelado</h1>
        <p>Has cancelado el pago. Puedes intentarlo nuevamente cuando quieras.</p>
        <button class="close-btn" onclick="window.close()">Cerrar</button>
      </div>
    </body>
    </html>
  `);
});

app.get('/payment/gateway', async (c) => {
  const { routeId, amount, currency, country, paymentMethod, passengerName, phoneNumber } = c.req.query();
  
  console.log('🌐 Payment Gateway: Rendering checkout page', {
    routeId,
    amount,
    currency,
    country,
    paymentMethod,
  });

  c.header('Content-Security-Policy', "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none';");
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');

  const bookingId = `BK${Date.now()}`;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ANDAR - Pago Seguro</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #E2725B 0%, #2D5A27 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 24px;
          padding: 32px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        .logo {
          text-align: center;
          font-size: 32px;
          font-weight: 800;
          color: #E2725B;
          margin-bottom: 24px;
        }
        .amount {
          text-align: center;
          font-size: 48px;
          font-weight: 700;
          color: #2D5A27;
          margin-bottom: 8px;
        }
        .method {
          text-align: center;
          font-size: 14px;
          color: #666;
          margin-bottom: 32px;
        }
        .btn {
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          margin-bottom: 12px;
          transition: transform 0.2s;
        }
        .btn:active { transform: scale(0.98); }
        .btn-primary {
          background: #E2725B;
          color: white;
        }
        .btn-secondary {
          background: #f5f5f5;
          color: #333;
        }
        .info {
          text-align: center;
          font-size: 12px;
          color: #999;
          margin-top: 24px;
        }
        .processing {
          display: none;
          text-align: center;
          padding: 40px;
        }
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #E2725B;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div id="checkout">
          <div class="logo">ANDAR</div>
          <div class="amount">${escapeHtml(currency)} ${escapeHtml(amount)}</div>
          <div class="method">Método: ${escapeHtml((paymentMethod || '').toUpperCase())}</div>
          <button class="btn btn-primary" onclick="processPayment(true)">✅ Confirmar Pago</button>
          <button class="btn btn-secondary" onclick="processPayment(false)">❌ Cancelar</button>
          <div class="info">🔒 Pago seguro y encriptado</div>
        </div>
        <div id="processing" class="processing">
          <div class="spinner"></div>
          <div>Procesando pago...</div>
        </div>
      </div>
      <script>
        const bookingId = '${escapeJs(bookingId)}';
        const routeId = '${escapeJs(routeId)}';
        const amount = ${parseFloat(amount) || 0};
        const currency = '${escapeJs(currency)}';
        const country = '${escapeJs(country)}';
        const paymentMethod = '${escapeJs(paymentMethod)}';
        const passengerName = '${escapeJs(passengerName)}';
        const phoneNumber = '${escapeJs(phoneNumber)}';

        async function processPayment(confirm) {
          if (!confirm) {
            window.location.href = '/payment/cancel';
            return;
          }

          document.getElementById('checkout').style.display = 'none';
          document.getElementById('processing').style.display = 'block';

          try {
            const response = await fetch('/payment/callback', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Callback-Secret': '${escapeJs(CALLBACK_SECRET)}'
              },
              body: JSON.stringify({
                bookingId,
                routeId,
                amount,
                currency,
                country,
                paymentMethod,
                passengerName,
                phoneNumber,
                status: 'success'
              })
            });

            const result = await response.json();

            if (result.success) {
              window.location.href = '/payment/success';
            } else {
              window.location.href = '/payment/failure';
            }
          } catch (error) {
            console.error('Payment error:', error);
            window.location.href = '/payment/failure';
          }
        }
      </script>
    </body>
    </html>
  `;

  return c.html(html);
});

app.post('/payment/callback', async (c) => {
  const clientIp = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
  const callbackSecret = c.req.header('x-callback-secret');

  if (callbackSecret !== CALLBACK_SECRET) {
    console.warn(`⚠️ [PaymentCallback] Unauthorized attempt from ${clientIp}`);
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    await rateLimiter.consume(clientIp);
  } catch (rateLimitError: any) {
    const retryAfter = Math.ceil((rateLimitError.msBeforeNext || 60000) / 1000);
    console.warn(`⚠️ Rate limit exceeded for ${clientIp}`);
    return c.json(
      {
        success: false,
        error: 'Too Many Requests',
        retryAfter,
      },
      429
    );
  }

  const payload = await c.req.json();
  
  console.log('💳 Payment Callback:', payload);

  const { bookingId, amount, currency, passengerName, phoneNumber, status } = payload;

  if (status === 'success') {
    console.log('✅ Payment successful, updating booking status to PAID');

    const dualCurrency = currencyConverter.createDualCurrencyDisplay(
      amount,
      currency,
      'USD'
    );

    const qrCode = `ANDAR-${bookingId}-${Date.now()}`;
    const seatNumber = `${Math.floor(Math.random() * 40) + 1}`;

    console.log('🔔 Triggering e-ticket generation via NotificationService (email)...');
    const notificationResult = await notificationService.sendBookingConfirmation({
      bookingId,
      passengerName,
      passengerEmail: payload.passengerEmail,
      phoneNumber,
      route: {
        origin: 'Lima',
        destination: 'Cusco',
        departureTime: '08:00 AM',
        arrivalTime: '08:00 PM',
      },
      price: amount,
      currency,
      dualCurrency,
      seatNumber,
      qrCode,
    });

    console.log('🔔 Notification result:', {
      success: notificationResult.success,
      channel: notificationResult.channel,
    });

    if (notificationResult.success) {
      console.log(`✅ E-ticket sent successfully via ${notificationResult.channel}`);
    } else {
      console.error('❌ Failed to send e-ticket via all channels');
    }

    return c.json({
      success: true,
      bookingId,
      ticketUrl: notificationResult.ticketUrl,
      deliveryChannel: notificationResult.channel,
      message: 'Pago confirmado. Recibirás tu boleto por email.',
    });
  } else {
    console.log('❌ Payment failed');
    return c.json({
      success: false,
      message: 'El pago no pudo ser procesado.',
    });
  }
});

app.get('/payment/success', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pago Exitoso</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #2D5A27 0%, #E2725B 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 24px;
          padding: 48px 32px;
          max-width: 400px;
          width: 100%;
          text-align: center;
        }
        .icon { font-size: 64px; margin-bottom: 24px; }
        h1 { color: #2D5A27; margin-bottom: 16px; }
        p { color: #666; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">✅</div>
        <h1>¡Pago Exitoso!</h1>
        <p>Tu reserva ha sido confirmada.<br>Recibirás tu boleto por correo electrónico.</p>
      </div>
    </body>
    </html>
  `);
});

app.get('/payment/failure', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pago Fallido</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #E2725B 0%, #2D5A27 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 24px;
          padding: 48px 32px;
          max-width: 400px;
          width: 100%;
          text-align: center;
        }
        .icon { font-size: 64px; margin-bottom: 24px; }
        h1 { color: #E2725B; margin-bottom: 16px; }
        p { color: #666; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">❌</div>
        <h1>Pago Fallido</h1>
        <p>No se pudo procesar el pago.<br>Por favor intenta nuevamente.</p>
      </div>
    </body>
    </html>
  `);
});

app.get('/payment/cancel', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pago Cancelado</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #2D5A27 0%, #E2725B 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 24px;
          padding: 48px 32px;
          max-width: 400px;
          width: 100%;
          text-align: center;
        }
        .icon { font-size: 64px; margin-bottom: 24px; }
        h1 { color: #666; margin-bottom: 16px; }
        p { color: #999; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">⚠️</div>
        <h1>Pago Cancelado</h1>
        <p>Has cancelado el pago.</p>
      </div>
    </body>
    </html>
  `);
});



app.get('/ws/health', (c: Context) => {
  return c.json({ 
    websocket: io ? 'active' : 'inactive',
    connections: io ? (io as any).engine?.clientsCount ?? 0 : 0,
  });
});

app.post('/operator/gps', async (c: Context) => {
  const payload = await c.req.json() as Record<string, any>;
  
  console.log('📍 Operator GPS Update:', payload);

  const { routeId, location } = payload;
  
  if (!routeId || !location) {
    return c.json({ success: false, error: 'Route ID and location required' });
  }

  gpsMomentum.updateLocation(routeId, location);

  console.log('✅ GPS location stored and momentum calculated for route:', routeId);

  return c.json({
    success: true,
    routeId,
    timestamp: new Date().toISOString(),
  });
});

app.post('/merchant/payout', async (c: Context) => {
  const payload = await c.req.json() as Record<string, any>;
  
  console.log('💰 Merchant Payout Request:', payload);

  const { merchantId, amount, currency, paymentMethod, accountNumber } = payload;
  
  if (!merchantId || !amount || !paymentMethod) {
    return c.json({ success: false, error: 'Missing required fields' });
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const payoutId = `PAYOUT_${Date.now()}`;

  console.log('✅ Payout initiated via dLocal to', paymentMethod, accountNumber);

  return c.json({
    success: true,
    payoutId,
    amount,
    currency,
    paymentMethod,
    status: 'processing',
    estimatedArrival: '1-3 business days',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/ff', (c: Context) => flutterflowBridge.getAPIStatus(c));
app.post('/api/ff/pricing', (c: Context) => flutterflowBridge.getPricing(c));
app.post('/api/ff/yield', (c: Context) => flutterflowBridge.getYieldPrice(c));
app.post('/api/ff/payment/initiate', (c: Context) => flutterflowBridge.initiatePayment(c));
app.post('/api/ff/loyalty/calculate', (c: Context) => flutterflowBridge.calculatePoints(c));
app.post('/api/ff/loyalty/issue', (c: Context) => flutterflowBridge.issuePoints(c));
app.post('/api/ff/loyalty/redeem', (c: Context) => flutterflowBridge.redeemPoints(c));
app.get('/api/ff/loyalty/balance', (c: Context) => flutterflowBridge.getPointsBalance(c));

app.get('/api/ff/bus/location', (c: Context) => flutterflowBridge.getBusLocation(c));
app.post('/api/ff/gps/update', (c: Context) => flutterflowBridge.updateGPS(c));
app.get('/api/ff/currency/convert', (c: Context) => flutterflowBridge.convertCurrency(c));
app.post('/api/ff/conflicts/detect', (c: Context) => flutterflowBridge.detectConflicts(c));
app.get('/api/ff/inflation', (c: Context) => flutterflowBridge.getInflationData(c));
app.get('/api/ff/cooloff', (c: Context) => flutterflowBridge.getCooloffStatus(c));
app.get('/api/ff/merchant/stats', (c: Context) => flutterflowBridge.getMerchantStats(c));

app.post('/contact', async (c: Context) => {
  try {
    const body = await c.req.json() as Record<string, any>;
    const { name, email, subject, message, bookingId } = body;

    console.log('📧 Contact form submission:', { name, email, subject });

    if (!name || !email || !subject || !message) {
      return c.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        400
      );
    }

    const result = await emailService.handleContactForm({
      name,
      email,
      subject,
      message,
      bookingId,
    });

    if (result.success) {
      return c.json({
        success: true,
        message: 'We have received your message. We will respond soon.',
      });
    } else {
      return c.json(
        {
          success: false,
          error: result.error || 'Failed to send message',
        },
        500
      );
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ Contact form error:', err);
    return c.json(
      {
        success: false,
        error: err.message || 'Failed to process contact form',
      },
      500
    );
  }
});

app.get('/contact/info', (c: Context) => {
  const contactInfo = emailService.getContactEmails();
  return c.json({
    success: true,
    contact: {
      support: contactInfo.support,
      admin: contactInfo.admin,
      domain: contactInfo.domain,
    },
  });
});

app.post('/api/test/notification', async (c: Context) => {
  try {
    const { userId, phoneNumber, email, forceFailure } = await c.req.json();

    console.log('🧪 Test notification endpoint called', { userId, phoneNumber, email, forceFailure });

    const testBooking = {
      id: 'TEST-' + Date.now(),
      checkIn: '2024-12-25',
      checkOut: '2024-12-31',
      total: 499.99,
    };

    const serviceStatus = {
      email: true,
      timestamp: new Date().toISOString(),
    };

    const testNotificationData = {
      bookingId: testBooking.id,
      passengerName: 'Test User',
      passengerEmail: email || 'test@example.com',
      phoneNumber: phoneNumber || '+1234567890',
      route: {
        origin: 'Lima',
        destination: 'Cusco',
        departureTime: '08:00 AM',
        arrivalTime: '08:00 PM',
      },
      price: testBooking.total,
      currency: 'USD',
      dualCurrency: {
        localAmount: testBooking.total * 3.7,
        localCurrency: 'PEN',
        homeAmount: testBooking.total,
        homeCurrency: 'USD',
        exchangeRate: 3.7,
      },
      seatNumber: '15A',
      qrCode: `ANDAR-${testBooking.id}-${Date.now()}`,
    };

    let result;
    if (forceFailure) {
      console.log('🧪 Forcing failure to test fallback mechanism');
      result = {
        success: false,
        channel: 'none' as const,
        emailResult: { success: false, error: 'Forced failure for testing' },
      };
    } else {
      result = await notificationService.sendBookingConfirmation(testNotificationData);
    }

    console.log('🧪 Test notification result:', result);

    return c.json({
      success: true,
      serviceStatus,
      testResult: result,
      testBooking,
      message: forceFailure ? 'Testing fallback mechanism (forced failure)' : 'Testing normal flow',
    });
  } catch (error: any) {
    console.error('❌ Test notification error:', error);
    return c.json(
      {
        success: false,
        error: error.message || 'Test notification failed',
      },
      500
    );
  }
});

// ========================
// ACTIVITIES MODULE ENDPOINTS
// ========================



function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

app.get('/api/activities/flags', (c: Context) => {
  return c.json({ success: true, flags: getFeatureFlags() });
});

app.post('/api/activities/select-partner', async (c) => {
  try {
    if (!getFlag('partner_selector_enabled')) {
      return c.json({ success: false, error: 'Partner selector is disabled' }, 503);
    }

    const body = await c.req.json();
    const { activity_id, offers, user_context, source } = body;

    if (!activity_id) {
      return c.json({ success: false, error: 'activity_id is required' }, 400);
    }

    console.log('[SelectPartner] Request:', { activity_id, source, hasOffers: !!offers?.length });

    const result = await selectPartner({
      activityId: activity_id,
      offers,
      userContext: user_context,
      source,
    });

    return c.json({
      success: true,
      partner_url: result.partnerUrl,
      partner_id: result.partnerId,
      partner_name: result.partnerName,
      reason: result.reason,
      click_id: result.clickId,
      score: result.score,
      top_candidates: result.topCandidates,
    });
  } catch (error: any) {
    console.error('[SelectPartner] Error:', error);
    return c.json({ success: false, error: error.message || 'Partner selection failed' }, 500);
  }
});

app.get('/api/activities/partner-metrics', (c: Context) => {
  return c.json({
    success: true,
    metrics: getAllMetrics(),
    partners: getPartnerRegistryInfo(),
    flags: {
      partner_selector_enabled: getFlag('partner_selector_enabled'),
    },
  });
});

app.get('/api/activities/worker/stats', (c: Context) => {
  return c.json({ success: true, stats: getQueueStats() });
});

app.post('/api/activities/reconcile', async (c) => {
  try {
    console.log('[Reconciliation] Manual reconciliation triggered');
    const report = await runReconciliation();
    return c.json({
      success: true,
      runId: report.runId,
      summary: report.summary,
      totalClicks: report.totalClicks,
      totalReconciled: report.totalReconciled,
      totalDiscrepancies: report.totalDiscrepancies,
      discrepancies: report.discrepancies.map(d => ({
        clickId: d.clickId,
        activityId: d.activityId,
        discrepancy: d.discrepancy,
      })),
      humanReadable: getReconciliationSummary(report),
    });
  } catch (error) {
    const err = error as Error;
    console.error('❌ Reconciliation error:', err);
    return c.json({ success: false, error: err.message || 'Reconciliation failed' }, 500);
  }
});

app.post('/api/activities/search', async (c) => {
  try {
    if (!getFlag('activities_enabled')) {
      return c.json({ success: false, error: 'Activities feature is disabled' }, 503);
    }

    const body = await c.req.json();
    const { destination, date, endDate, guests, category, timeSlot, sortBy, placeId, strictLocation, radiusKm } = body;

    if (!destination && !placeId) {
      return c.json({ success: false, error: 'location or place_id is required' }, 400);
    }

    const strict = strictLocation !== false;
    const radius = typeof radiusKm === 'number' ? radiusKm : 50;
    const requestId = generateId('search');

    const searchRecord = {
      requestId,
      destination: destination || '',
      placeId: placeId || null,
      placeName: null as string | null,
      centroidLat: null as number | null,
      centroidLon: null as number | null,
      bboxNorth: null as number | null,
      bboxSouth: null as number | null,
      bboxEast: null as number | null,
      bboxWest: null as number | null,
      date: date || new Date().toISOString().split('T')[0],
      endDate: endDate || null,
      guests: guests || 1,
      category: category || null,
      timeSlot: timeSlot || null,
      sortBy: sortBy || 'relevance',
      strictLocation: strict,
      radiusKm: radius,
      status: 'queued' as const,
      resultCount: 0,
      partnerResults: {} as Record<string, number>,
      createdAt: new Date().toISOString(),
      completedAt: null as string | null,
    };

    await activitiesStore.persistSearch(searchRecord);

    if (getFlag('activities_worker_enabled')) {
      enqueueSearch(searchRecord);
    }

    console.log('🎯 Activities Search:', { requestId, destination, date, guests, category, placeId, strict, radius });

    return c.json({
      success: true,
      request_id: requestId,
      cached_results: [],
      status: 'queued',
      params: { destination, date, endDate, guests, category, timeSlot, sortBy, placeId, strictLocation: strict, radiusKm: radius },
    });
  } catch (error: any) {
    console.error('❌ Activities search error:', error);
    return c.json({ success: false, error: error.message || 'Search failed' }, 500);
  }
});

app.get('/api/activities/search/status', async (c) => {
  try {
    const requestId = c.req.query('request_id');

    if (!requestId) {
      return c.json({ success: false, error: 'request_id is required' }, 400);
    }

    const record = await activitiesStore.getSearch(requestId);

    if (!record) {
      const job = getJobStatus(requestId);
      if (job) {
        return c.json({
          success: true,
          request_id: requestId,
          status: job.status,
          cached_results: [],
          partnerResults: job.partnerResults,
          totalResults: job.totalResults,
        });
      }
      return c.json({ success: false, error: 'Search not found' }, 404);
    }

    console.log('📊 Activities Search Status:', { requestId, status: record.status });

    return c.json({
      success: true,
      request_id: record.requestId,
      status: record.status,
      cached_results: [],
      resultCount: record.resultCount,
      partnerResults: record.partnerResults,
      params: {
        destination: record.destination,
        placeId: record.placeId,
        date: record.date,
        endDate: record.endDate,
        guests: record.guests,
        category: record.category,
        strictLocation: record.strictLocation,
        radiusKm: record.radiusKm,
      },
      createdAt: record.createdAt,
      completedAt: record.completedAt,
    });
  } catch (error: any) {
    console.error('❌ Activities search status error:', error);
    return c.json({ success: false, error: error.message || 'Status check failed' }, 500);
  }
});

app.post('/api/activities/quote', async (c) => {
  try {
    const body = await c.req.json();
    const { activityId, partnerId, date, timeSlot, guests } = body;

    console.log('📋 Activities Quote:', { activityId, partnerId, date, guests });

    const quoteId = generateId('qt');
    const price = 20 + Math.floor(Math.random() * 180);

    const quote = {
      quoteId,
      activityId,
      partnerId,
      price,
      currency: 'USD',
      guests: guests || 1,
      date,
      timeSlot,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      bookingFlow: 'affiliate_redirect',
    };

    return c.json({ success: true, quote });
  } catch (error: any) {
    console.error('❌ Activities quote error:', error);
    return c.json({ success: false, error: error.message || 'Quote failed' }, 500);
  }
});

app.post('/api/activities/book', async (c) => {
  try {
    const body = await c.req.json();
    const { quoteId, activityId, partnerId, customerName, customerEmail, customerPhone } = body;

    console.log('📦 Activities Book:', { quoteId, activityId, partnerId });

    const bookingId = generateId('bk');
    const clickId = generateId('clk');

    const booking = {
      bookingId,
      activityId,
      partnerId,
      quoteId,
      clickId,
      status: 'pending',
      paymentStatus: 'pending',
      customerName,
      customerEmail,
      customerPhone,
      createdAt: new Date().toISOString(),
    };

    await bookingStore.persist(booking);
    console.log('✅ Activity booking created:', bookingId);

    return c.json({ success: true, booking });
  } catch (error: any) {
    console.error('❌ Activities book error:', error);
    return c.json({ success: false, error: error.message || 'Booking failed' }, 500);
  }
});

app.post('/api/activities/create-payment-intent', async (c) => {
  const clientIp = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

  try {
    await rateLimiter.consume(clientIp);
  } catch (rateLimitError: any) {
    const retryAfter = Math.ceil((rateLimitError.msBeforeNext || 60000) / 1000);
    return c.json({ success: false, error: 'Too Many Requests', retryAfter }, 429);
  }

  try {
    const body = await c.req.json();
    const { activityId, partnerId, clickId, quoteId, amount, currency, customerEmail } = body;

    console.log('💳 Activities PaymentIntent:', { activityId, amount, currency });

    if (!process.env.STRIPE_SECRET_KEY) {
      return c.json({ success: false, error: 'Stripe not configured' }, 500);
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' as any });

    const idempotencyKey = `activities_pi_${activityId}_${clickId}`;

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: Math.round(amount * 100),
        currency: (currency || 'usd').toLowerCase(),
        metadata: {
          activity_id: activityId,
          partner_id: partnerId,
          click_id: clickId,
          quote_id: quoteId,
          source: 'andartravel_activities',
        },
        receipt_email: customerEmail,
      },
      { idempotencyKey }
    );

    console.log('✅ Activities PaymentIntent created:', paymentIntent.id);

    return c.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
    });
  } catch (error: any) {
    console.error('❌ Activities PaymentIntent error:', error?.message, error?.type);
    const userMessage = error?.type === 'StripeAuthenticationError'
      ? 'Payment service configuration error. Please contact support.'
      : error?.message || 'Payment intent creation failed';
    return c.json({ success: false, error: userMessage }, 500);
  }
});

app.get('/api/activities/redirect-book', async (c) => {
  const startMs = Date.now();
  const reqId = `rdr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  try {
    const activityId = c.req.query('activity_id');
    const partnerUrl = c.req.query('partner_url');
    const quoteId = c.req.query('quote_id');
    const userHash = c.req.query('user_hash');
    const requestId = c.req.query('request_id');

    console.log(`[RedirectGET][${reqId}] Incoming:`, { activityId, partnerUrl, quoteId, userHash, requestId });

    if (!activityId) {
      return c.json({ success: false, error: 'activity_id is required' }, 400);
    }

    if (!partnerUrl && getFlag('partner_selector_enabled')) {
      console.log(`[RedirectGET][${reqId}] No partner_url, using partner selector`);
      const selected = await selectPartner({
        activityId,
        userContext: { sessionId: userHash || undefined },
        source: 'redirect_get',
      });
      const elapsed = Date.now() - startMs;
      console.log(`[RedirectGET][${reqId}] Partner selected in ${elapsed}ms: ${selected.partnerId} -> 302 ${selected.partnerUrl}`);
      return c.redirect(selected.partnerUrl, 302);
    }

    if (!partnerUrl) {
      return c.json({ success: false, error: 'activity_id and partner_url are required' }, 400);
    }

    const resolved = resolvePartnerUrl(undefined, partnerUrl);
    if (!resolved) {
      return c.json({ success: false, error: 'Invalid partner_url' }, 400);
    }

    const clickId = generateClickId();

    const trackedUrl = buildTrackedRedirectUrl({
      activityId,
      partnerUrl: resolved,
      clickId,
      quoteId: quoteId || undefined,
      userHash: userHash || undefined,
      requestId: requestId || undefined,
    });

    const clickRecord = {
      clickId,
      activityId,
      partnerId: null,
      quoteId: quoteId || null,
      userHash: userHash || null,
      requestId: requestId || null,
      utmSource: 'andartravel',
      utmMedium: 'app',
      utmCampaign: null,
      redirectUrl: trackedUrl,
      partnerUrl: resolved,
      status: 'clicked' as const,
      timestamp: new Date().toISOString(),
      convertedAt: null,
    };

    await activitiesStore.persistClick(clickRecord);
    const elapsed = Date.now() - startMs;
    console.log(`[RedirectGET][${reqId}] Click persisted in ${elapsed}ms: ${clickId} -> 302 ${trackedUrl}`);

    return c.redirect(trackedUrl, 302);
  } catch (error: any) {
    const elapsed = Date.now() - startMs;
    console.error(`[RedirectGET][${reqId}] Error after ${elapsed}ms:`, error);
    return c.json({ success: false, error: error.message || 'Redirect failed' }, 500);
  }
});

app.post('/api/activities/redirect-book', async (c) => {
  const startMs = Date.now();
  const reqId = `rdr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  try {
    const body = await c.req.json();
    const { activity_id, activityId: activityIdLegacy, partner_url, partnerBaseUrl, quote_id, quoteId: quoteIdLegacy, user_hash, userHash: userHashLegacy, request_id, requestId: requestIdLegacy, partnerId } = body;

    const finalActivityId = activity_id || activityIdLegacy;
    const finalPartnerUrl = partner_url || partnerBaseUrl;
    const finalQuoteId = quote_id || quoteIdLegacy;
    const finalUserHash = user_hash || userHashLegacy;
    const finalRequestId = request_id || requestIdLegacy;

    console.log(`[RedirectPOST][${reqId}] Incoming:`, { finalActivityId, finalPartnerUrl, finalQuoteId, finalUserHash, finalRequestId, partnerId });

    if (!finalActivityId) {
      return c.json({ success: false, error: 'activity_id is required' }, 400);
    }

    const useExternalFlow = getFlag('external_partner_flow');
    console.log(`[RedirectPOST][${reqId}] external_partner_flow=${useExternalFlow}`);

    if (!finalPartnerUrl && !partnerId && getFlag('partner_selector_enabled')) {
      console.log(`[RedirectPOST][${reqId}] No partner_url/partnerId, using partner selector`);
      const selected = await selectPartner({
        activityId: finalActivityId,
        userContext: { sessionId: finalUserHash || undefined },
        source: 'redirect_post',
      });

      const elapsed = Date.now() - startMs;
      console.log(`[RedirectPOST][${reqId}] Partner selected in ${elapsed}ms: ${selected.partnerId} click=${selected.clickId}`);

      return c.json({
        success: true,
        click_id: selected.clickId,
        redirect: selected.partnerUrl,
        partner_id: selected.partnerId,
        partner_name: selected.partnerName,
        reason: selected.reason,
        score: selected.score,
        redirect_latency_ms: elapsed,
        utm: {
          sub_id: selected.clickId,
          aff_id: selected.partnerId,
          utm_source: 'andartravel',
          utm_medium: 'app',
        },
      });
    }

    const resolved = resolvePartnerUrl(partnerId, finalPartnerUrl);
    if (!resolved) {
      return c.json({ success: false, error: 'partner_url is required or partnerId must map to a known provider' }, 400);
    }

    const clickId = generateClickId();

    const trackedUrl = buildTrackedRedirectUrl({
      activityId: finalActivityId,
      partnerUrl: resolved,
      clickId,
      partnerId,
      quoteId: finalQuoteId || undefined,
      userHash: finalUserHash || undefined,
      requestId: finalRequestId || undefined,
    });

    const clickRecord = {
      clickId,
      activityId: finalActivityId,
      partnerId: partnerId || null,
      quoteId: finalQuoteId || null,
      userHash: finalUserHash || null,
      requestId: finalRequestId || null,
      utmSource: 'andartravel',
      utmMedium: 'app',
      utmCampaign: null,
      redirectUrl: trackedUrl,
      partnerUrl: resolved,
      status: 'clicked' as const,
      timestamp: new Date().toISOString(),
      convertedAt: null,
    };

    await activitiesStore.persistClick(clickRecord);
    const elapsed = Date.now() - startMs;
    console.log(`[RedirectPOST][${reqId}] Click persisted in ${elapsed}ms: ${clickId} -> ${trackedUrl}`);

    return c.json({
      success: true,
      click_id: clickId,
      redirect: trackedUrl,
      redirect_latency_ms: elapsed,
      utm: {
        sub_id: clickId,
        aff_id: GYG_PARTNER_ID,
        utm_source: 'andartravel',
        utm_medium: 'app',
      },
    });
  } catch (error: any) {
    const elapsed = Date.now() - startMs;
    console.error(`[RedirectPOST][${reqId}] Error after ${elapsed}ms:`, error);
    return c.json({ success: false, error: error.message || 'Redirect booking failed' }, 500);
  }
});

app.get('/api/activities/click/:clickId', async (c) => {
  try {
    const clickId = c.req.param('clickId');
    const click = await activitiesStore.getClick(clickId);
    if (!click) {
      return c.json({ success: false, error: 'Click not found' }, 404);
    }
    return c.json({ success: true, click });
  } catch (error: any) {
    console.error('❌ Get click error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/api/activities/stats', (c) => {
  const clickStats = activitiesStore.getConversionStats();
  const workerStats = getQueueStats();
  return c.json({
    success: true,
    clicks: clickStats,
    worker: workerStats,
    flags: getFeatureFlags(),
  });
});

app.post('/api/activities/stripe-webhook', async (c) => {
  const signature = c.req.header('stripe-signature');

  if (!signature) {
    return c.json({ error: 'Missing signature' }, 400);
  }

  try {
    const rawBody = await c.req.text();
    const event = await stripeService.verifyWebhookSignature(rawBody, signature);

    console.log('📨 Activities Stripe Webhook:', event.type, event.id);

    if (isWebhookEventProcessed(event.id)) {
      console.log('⚠️ Duplicate activities webhook event, skipping:', event.id);
      return c.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as any;
        const metadata = pi.metadata || {};

        if (metadata.source === 'andartravel_activities') {
          console.log('✅ Activity payment succeeded:', pi.id, metadata);

          const clickId = metadata.click_id;
          if (clickId) {
            await activitiesStore.updateClickStatus(clickId, 'converted');
            console.log('✅ Commission tracked for click:', clickId);
          }
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as any;
        if (pi.metadata?.source === 'andartravel_activities') {
          console.error('❌ Activity payment failed:', pi.id);
        }
        break;
      }
    }

    return c.json({ received: true });
  } catch (error: any) {
    console.error('❌ Activities webhook error:', error);
    return c.json({ error: error.message }, 400);
  }
});

app.post('/api/activities/confirm-payment', async (c) => {
  const clientIp = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

  try {
    await rateLimiter.consume(clientIp);
  } catch (rateLimitError: any) {
    const retryAfter = Math.ceil((rateLimitError.msBeforeNext || 60000) / 1000);
    return c.json({ success: false, error: 'Too Many Requests', retryAfter }, 429);
  }

  try {
    const body = await c.req.json();
    const { paymentIntentId, clientSecret: _clientSecret, activityId, partnerId, clickId, quoteId, amount, currency } = body;

    console.log('💳 Activities Confirm Payment:', { paymentIntentId, activityId, amount, currency });

    if (!process.env.STRIPE_SECRET_KEY) {
      console.log('[Activities] Stripe not configured, simulating confirmation');
      const bookingId = generateId('bk');
      await bookingStore.persist({
        bookingId,
        activityId,
        partnerId: partnerId || null,
        quoteId: quoteId || null,
        clickId: clickId || null,
        paymentIntentId,
        status: 'confirmed',
        paymentStatus: 'completed',
        amount,
        currency,
        createdAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString(),
      });

      if (clickId) {
        await activitiesStore.updateClickStatus(clickId, 'converted');
      }

      return c.json({
        success: true,
        bookingId,
        status: 'confirmed',
        message: 'Payment confirmed (simulated)',
      });
    }

    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' as any });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const bookingId = generateId('bk');
      await bookingStore.persist({
        bookingId,
        activityId,
        partnerId: partnerId || null,
        quoteId: quoteId || null,
        clickId: clickId || null,
        paymentIntentId,
        status: 'confirmed',
        paymentStatus: 'completed',
        amount,
        currency,
        createdAt: new Date().toISOString(),
        confirmedAt: new Date().toISOString(),
      });

      if (clickId) {
        await activitiesStore.updateClickStatus(clickId, 'converted');
      }

      console.log('✅ Activity payment confirmed:', bookingId);
      return c.json({ success: true, bookingId, status: 'confirmed' });
    }

    if (paymentIntent.status === 'requires_confirmation') {
      const confirmed = await stripe.paymentIntents.confirm(paymentIntentId);
      if (confirmed.status === 'succeeded') {
        const bookingId = generateId('bk');
        await bookingStore.persist({
          bookingId,
          activityId,
          partnerId: partnerId || null,
          quoteId: quoteId || null,
          clickId: clickId || null,
          paymentIntentId,
          status: 'confirmed',
          paymentStatus: 'completed',
          amount,
          currency,
          createdAt: new Date().toISOString(),
          confirmedAt: new Date().toISOString(),
        });
        return c.json({ success: true, bookingId, status: 'confirmed' });
      }
    }

    return c.json({
      success: false,
      status: paymentIntent.status,
      error: `Payment status: ${paymentIntent.status}`,
    });
  } catch (error: any) {
    console.error('❌ Activities confirm payment error:', error);
    return c.json({ success: false, error: error.message || 'Payment confirmation failed' }, 500);
  }
});

app.post('/api/activities/send-confirmation-email', async (c) => {
  try {
    const body = await c.req.json();
    const {
      bookingId,
      customerName,
      customerEmail,
      activityTitle,
      destination,
      date,
      timeSlot,
      guests,
      duration,
      location,
      totalPrice,
      currency,
      paymentMethod,
    } = body;

    console.log('📧 [ConfirmationEmail] Sending to:', customerEmail, 'for booking:', bookingId);

    if (!customerEmail || !bookingId) {
      return c.json(
        { success: false, error: 'customerEmail and bookingId are required' },
        400
      );
    }

    const result = await emailService.sendActivityPurchaseConfirmation({
      bookingId,
      customerName: customerName || 'Traveler',
      customerEmail,
      activityTitle: activityTitle || 'Activity Booking',
      destination: destination || '',
      date: date || new Date().toISOString(),
      timeSlot,
      guests: parseInt(guests) || 1,
      duration,
      location,
      totalPrice: parseFloat(totalPrice) || 0,
      currency: currency || 'USD',
      paymentMethod,
    });

    if (result.success) {
      console.log('✅ [ConfirmationEmail] Sent successfully to:', customerEmail);
      return c.json({ success: true, message: 'Confirmation email sent' });
    } else {
      console.error('❌ [ConfirmationEmail] Failed:', result.error);
      return c.json({ success: false, error: result.error || 'Failed to send email' }, 500);
    }
  } catch (error: any) {
    console.error('❌ [ConfirmationEmail] Error:', error);
    return c.json({ success: false, error: error.message || 'Email sending failed' }, 500);
  }
});

export default app;
