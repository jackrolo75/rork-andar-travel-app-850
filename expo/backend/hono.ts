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
import { flutterflowBridge } from './flutterflow-bridge';
import { EmailService } from './services/email-service';
import { activitiesStore } from './services/activities-store';
import { buildTrackedRedirectUrl, resolvePartnerUrl, generateClickId, GYG_PARTNER_ID } from './services/redirect-builder';
import { selectPartner, getAllMetrics, getPartnerRegistryInfo } from './services/partner-selector';
import { enqueueSearch, getJobStatus, getQueueStats } from './services/activities-worker';
import { getFlag, getFeatureFlags } from './services/feature-flags';

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
      'Affiliate Redirects (GetYourGuide / Aviasales)',
      'Activities Search & Click Tracking',
      'Email Notifications'
    ]
  });
});

app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
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


app.get('/api/ff', (c: Context) => flutterflowBridge.getAPIStatus(c));
app.post('/api/ff/pricing', (c: Context) => flutterflowBridge.getPricing(c));
app.post('/api/ff/yield', (c: Context) => flutterflowBridge.getYieldPrice(c));
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

export default app;
