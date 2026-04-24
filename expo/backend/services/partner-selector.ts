import { activitiesStore } from './activities-store';
import { generateClickId } from './redirect-builder';

export const GYG_PARTNER_ID = 'D82WHJ5';

export interface PartnerConfig {
  id: string;
  name: string;
  baseUrl: string;
  affIdParam: string;
  affIdValue: string;
  subIdParam: string;
  priority: number;
  isActive: boolean;
}

export const PARTNER_REGISTRY: PartnerConfig[] = [
  {
    id: 'getyourguide',
    name: 'GetYourGuide',
    baseUrl: 'https://www.getyourguide.com/s/',
    affIdParam: 'partner_id',
    affIdValue: GYG_PARTNER_ID,
    subIdParam: 'sub_id',
    priority: 1,
    isActive: true,
  },
  {
    id: 'tiqets',
    name: 'Tiqets',
    baseUrl: 'https://www.getyourguide.com/s/',
    affIdParam: 'partner_id',
    affIdValue: GYG_PARTNER_ID,
    subIdParam: 'sub_id',
    priority: 2,
    isActive: true,
  },
  {
    id: 'wegotrip',
    name: 'WeGoTrip',
    baseUrl: 'https://www.getyourguide.com/s/',
    affIdParam: 'partner_id',
    affIdValue: GYG_PARTNER_ID,
    subIdParam: 'sub_id',
    priority: 3,
    isActive: true,
  },
  {
    id: 'searadar',
    name: 'SeaRadar',
    baseUrl: 'https://www.getyourguide.com/s/',
    affIdParam: 'partner_id',
    affIdValue: GYG_PARTNER_ID,
    subIdParam: 'sub_id',
    priority: 4,
    isActive: true,
  },
  {
    id: 'ticketnetwork',
    name: 'TicketNetwork',
    baseUrl: 'https://www.getyourguide.com/s/',
    affIdParam: 'partner_id',
    affIdValue: GYG_PARTNER_ID,
    subIdParam: 'sub_id',
    priority: 5,
    isActive: true,
  },
];

export interface PartnerOffer {
  offerId: string;
  activityId: string;
  partnerId: string;
  partnerUrl: string;
  priceCents: number | null;
  currency: string;
  availability: boolean;
  lastSeenAt: string;
}

export interface OfferMetrics {
  offerId: string;
  partnerId: string;
  clicks: number;
  conversions: number;
  revenue: number;
  lastUpdated: string;
}

export interface ScoredOffer {
  offer: PartnerOffer;
  metrics: OfferMetrics;
  convNorm: number;
  priceScore: number;
  totalScore: number;
  reason: string;
}

export interface SelectPartnerRequest {
  activityId: string;
  offers?: PartnerOffer[];
  userContext?: {
    sessionId?: string;
    city?: string;
    category?: string;
  };
  source?: string;
}

export interface SelectPartnerResult {
  partnerUrl: string;
  partnerId: string;
  partnerName: string;
  reason: string;
  clickId: string;
  score: number;
  topCandidates: Array<{ partnerId: string; score: number; reason: string }>;
}

const DEFAULT_W1 = 0.8;
const DEFAULT_W2 = 0.2;
const _CONV_RATE_DELTA = 0.05;

const offerStore = new Map<string, PartnerOffer[]>();
const metricsStore = new Map<string, OfferMetrics>();

const idempotencyCache = new Map<string, { result: SelectPartnerResult; expiresAt: number }>();
const IDEMPOTENCY_TTL_MS = 30_000;

function getWeights(): { w1: number; w2: number } {
  const envWeights = process.env.PARTNER_SELECTOR_WEIGHTS;
  if (envWeights) {
    try {
      const parts = envWeights.split(',').map((s: string) => Number(s));
      if (parts.length === 2 && parts.every((n: number) => !isNaN(n) && n >= 0 && n <= 1)) {
        return { w1: parts[0], w2: parts[1] };
      }
    } catch {
      // fall through
    }
  }
  return { w1: DEFAULT_W1, w2: DEFAULT_W2 };
}

function getPartnerConfig(partnerId: string): PartnerConfig | undefined {
  return PARTNER_REGISTRY.find(p => p.id === partnerId);
}

function getActivePartners(): PartnerConfig[] {
  return PARTNER_REGISTRY.filter(p => p.isActive);
}

export function getOfferMetrics(offerId: string): OfferMetrics {
  return metricsStore.get(offerId) || {
    offerId,
    partnerId: '',
    clicks: 0,
    conversions: 0,
    revenue: 0,
    lastUpdated: new Date().toISOString(),
  };
}

export function incrementOfferClicks(partnerId: string): void {
  const key = `metrics_${partnerId}`;
  const existing = metricsStore.get(key) || {
    offerId: key,
    partnerId,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    lastUpdated: new Date().toISOString(),
  };
  existing.clicks += 1;
  existing.lastUpdated = new Date().toISOString();
  metricsStore.set(key, existing);
  console.log(`[PartnerSelector] Incremented clicks for ${partnerId}: ${existing.clicks}`);
}

export function incrementOfferConversions(partnerId: string, revenue: number = 0): void {
  const key = `metrics_${partnerId}`;
  const existing = metricsStore.get(key) || {
    offerId: key,
    partnerId,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    lastUpdated: new Date().toISOString(),
  };
  existing.conversions += 1;
  existing.revenue += revenue;
  existing.lastUpdated = new Date().toISOString();
  metricsStore.set(key, existing);
  console.log(`[PartnerSelector] Incremented conversions for ${partnerId}: ${existing.conversions}`);
}

export function upsertPartnerOffers(activityId: string, offers: PartnerOffer[]): void {
  offerStore.set(activityId, offers);
  console.log(`[PartnerSelector] Stored ${offers.length} offers for activity ${activityId}`);
}

export function getPartnerOffers(activityId: string): PartnerOffer[] {
  return offerStore.get(activityId) || [];
}

function buildDefaultOffersForActivity(activityId: string): PartnerOffer[] {
  const partners = getActivePartners();
  const now = new Date().toISOString();
  return partners.map(p => ({
    offerId: `${activityId}_${p.id}`,
    activityId,
    partnerId: p.id,
    partnerUrl: p.baseUrl,
    priceCents: null,
    currency: 'USD',
    availability: true,
    lastSeenAt: now,
  }));
}

function scoreOffers(offers: PartnerOffer[]): ScoredOffer[] {
  const { w1, w2 } = getWeights();

  const scored: ScoredOffer[] = offers.map(offer => {
    const key = `metrics_${offer.partnerId}`;
    const metrics = metricsStore.get(key) || {
      offerId: offer.offerId,
      partnerId: offer.partnerId,
      clicks: 0,
      conversions: 0,
      revenue: 0,
      lastUpdated: new Date().toISOString(),
    };

    const convRate = metrics.clicks > 0
      ? metrics.conversions / metrics.clicks
      : 0;

    return {
      offer,
      metrics,
      convNorm: convRate,
      priceScore: 0,
      totalScore: 0,
      reason: '',
    };
  });

  const maxConv = Math.max(...scored.map(s => s.convNorm), 0.001);
  scored.forEach(s => {
    s.convNorm = s.convNorm / maxConv;
  });

  const offersWithPrice = scored.filter(s => s.offer.priceCents !== null);
  if (offersWithPrice.length > 0) {
    offersWithPrice.sort((a, b) => (a.offer.priceCents ?? Infinity) - (b.offer.priceCents ?? Infinity));
    offersWithPrice.forEach((s, idx) => {
      s.priceScore = offersWithPrice.length > 1
        ? 1 - idx / (offersWithPrice.length - 1)
        : 1;
    });
  }

  const noPrice = scored.filter(s => s.offer.priceCents === null);
  noPrice.forEach(s => {
    s.priceScore = 0.5;
  });

  scored.forEach(s => {
    s.totalScore = w1 * s.convNorm + w2 * s.priceScore;

    const partner = getPartnerConfig(s.offer.partnerId);
    if (s.metrics.clicks === 0 && partner) {
      s.totalScore = 1 - (partner.priority - 1) * 0.1;
      s.reason = `fallback_priority_${partner.priority}`;
    } else {
      s.reason = `conv=${s.convNorm.toFixed(3)},price=${s.priceScore.toFixed(3)},total=${s.totalScore.toFixed(3)}`;
    }
  });

  scored.sort((a, b) => b.totalScore - a.totalScore);

  return scored;
}

function buildPartnerRedirectUrl(partner: PartnerConfig, clickId: string): string {
  const url = new URL(partner.baseUrl);
  url.searchParams.set(partner.subIdParam, clickId);
  url.searchParams.set(partner.affIdParam, partner.affIdValue);
  url.searchParams.set('utm_source', 'andartravel');
  url.searchParams.set('utm_medium', 'app');
  return url.toString();
}

function buildOfferRedirectUrl(partnerUrl: string, partnerId: string, clickId: string): string {
  const partner = getPartnerConfig(partnerId);
  if (partner) {
    return buildPartnerRedirectUrl(partner, clickId);
  }

  try {
    const url = new URL(partnerUrl);
    url.searchParams.set('sub_id', clickId);
    url.searchParams.set('aff_id', GYG_PARTNER_ID);
    url.searchParams.set('utm_source', 'andartravel');
    url.searchParams.set('utm_medium', 'app');
    return url.toString();
  } catch {
    return partnerUrl;
  }
}

export async function selectPartner(request: SelectPartnerRequest): Promise<SelectPartnerResult> {
  const { activityId, userContext, source } = request;

  const idempotencyKey = userContext?.sessionId
    ? `${activityId}_${userContext.sessionId}`
    : null;

  if (idempotencyKey) {
    const cached = idempotencyCache.get(idempotencyKey);
    if (cached && cached.expiresAt > Date.now()) {
      console.log(`[PartnerSelector] Idempotency hit for ${idempotencyKey}, returning cached result`);
      return cached.result;
    }
  }

  let offers = request.offers || getPartnerOffers(activityId);
  if (offers.length === 0) {
    offers = buildDefaultOffersForActivity(activityId);
    console.log(`[PartnerSelector] No stored offers for ${activityId}, using default partner set (${offers.length} partners)`);
  }

  const available = offers.filter(o => o.availability);
  if (available.length === 0) {
    console.warn(`[PartnerSelector] No available offers for ${activityId}, falling back to all offers`);
  }
  const candidates = available.length > 0 ? available : offers;

  const scored = scoreOffers(candidates);

  const winner = scored[0];
  const clickId = generateClickId();
  const partner = getPartnerConfig(winner.offer.partnerId);
  const redirectUrl = buildOfferRedirectUrl(
    winner.offer.partnerUrl,
    winner.offer.partnerId,
    clickId,
  );

  incrementOfferClicks(winner.offer.partnerId);

  const topCandidates = scored.slice(0, 3).map(s => ({
    partnerId: s.offer.partnerId,
    score: Math.round(s.totalScore * 1000) / 1000,
    reason: s.reason,
  }));

  console.log(`[PartnerSelector] Selected ${winner.offer.partnerId} for activity ${activityId}`, {
    score: winner.totalScore.toFixed(3),
    reason: winner.reason,
    topCandidates,
    source,
    city: userContext?.city,
  });

  const clickRecord = {
    clickId,
    activityId,
    partnerId: winner.offer.partnerId,
    quoteId: null,
    userHash: userContext?.sessionId || null,
    requestId: null,
    utmSource: 'andartravel',
    utmMedium: 'app',
    utmCampaign: null,
    redirectUrl,
    partnerUrl: winner.offer.partnerUrl,
    status: 'clicked' as const,
    timestamp: new Date().toISOString(),
    convertedAt: null,
    chosenPartner: winner.offer.partnerId,
    offerPriceCents: winner.offer.priceCents,
    scoreReason: winner.reason,
  };

  await activitiesStore.persistClick(clickRecord);

  const result: SelectPartnerResult = {
    partnerUrl: redirectUrl,
    partnerId: winner.offer.partnerId,
    partnerName: partner?.name || winner.offer.partnerId,
    reason: winner.reason,
    clickId,
    score: Math.round(winner.totalScore * 1000) / 1000,
    topCandidates,
  };

  if (idempotencyKey) {
    idempotencyCache.set(idempotencyKey, {
      result,
      expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
    });
  }

  return result;
}

export function getFallbackPartnerUrl(_activityId: string): string {
  const partner = PARTNER_REGISTRY[0];
  const clickId = generateClickId();
  return buildPartnerRedirectUrl(partner, clickId);
}

export function getAllMetrics(): Record<string, OfferMetrics> {
  const result: Record<string, OfferMetrics> = {};
  metricsStore.forEach((v, k) => {
    result[k] = v;
  });
  return result;
}

export function getPartnerRegistryInfo(): Array<{ id: string; name: string; priority: number; isActive: boolean }> {
  return PARTNER_REGISTRY.map(p => ({
    id: p.id,
    name: p.name,
    priority: p.priority,
    isActive: p.isActive,
  }));
}

setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  idempotencyCache.forEach((value, key) => {
    if (value.expiresAt < now) {
      idempotencyCache.delete(key);
      cleaned++;
    }
  });
  if (cleaned > 0) {
    console.log(`[PartnerSelector] Cleaned ${cleaned} expired idempotency entries`);
  }
}, 60_000);
