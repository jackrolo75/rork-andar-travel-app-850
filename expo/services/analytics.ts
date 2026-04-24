import { Platform } from 'react-native';

type EventName =
  | 'app_open'
  | 'search_started'
  | 'search_completed'
  | 'activity_viewed'
  | 'activity_booked'
  | 'activity_favorited'
  | 'payment_started'
  | 'payment_completed'
  | 'payment_failed'
  | 'redirect_clicked'
  | 'category_selected'
  | 'destination_selected'
  | 'language_changed'
  | 'currency_changed'
  | 'privacy_policy_viewed'
  | 'filter_applied'
  | 'sort_changed';

interface EventProperties {
  [key: string]: string | number | boolean | null | undefined;
}

interface AnalyticsEvent {
  name: EventName;
  properties: EventProperties;
  timestamp: string;
  platform: string;
  sessionId: string;
}

let currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
const eventBuffer: AnalyticsEvent[] = [];
const MAX_BUFFER_SIZE = 50;

function getSessionId(): string {
  return currentSessionId;
}

export function resetSession(): void {
  currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  console.log('[Analytics] New session started:', currentSessionId);
}

export function trackEvent(name: EventName, properties: EventProperties = {}): void {
  const event: AnalyticsEvent = {
    name,
    properties: {
      ...properties,
      platform: Platform.OS,
    },
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    sessionId: getSessionId(),
  };

  eventBuffer.push(event);
  console.log(`[Analytics] Event: ${name}`, properties);

  if (eventBuffer.length >= MAX_BUFFER_SIZE) {
    void flushEvents();
  }
}

export function trackSearch(params: {
  destination: string;
  date?: string;
  guests?: number;
  category?: string;
  strictLocation?: boolean;
  radiusKm?: number;
}): void {
  trackEvent('search_started', {
    destination: params.destination,
    date: params.date ?? null,
    guests: params.guests ?? null,
    category: params.category ?? null,
    strict_location: params.strictLocation ?? null,
    radius_km: params.radiusKm ?? null,
  });
}

export function trackActivityView(params: {
  activityId: string;
  title: string;
  partnerId?: string;
  price?: number;
  currency?: string;
}): void {
  trackEvent('activity_viewed', {
    activity_id: params.activityId,
    title: params.title,
    partner_id: params.partnerId ?? null,
    price: params.price ?? null,
    currency: params.currency ?? null,
  });
}

export function trackPayment(params: {
  activityId: string;
  amount: number;
  currency: string;
  status: 'started' | 'completed' | 'failed';
  paymentMethod?: string;
  errorMessage?: string;
}): void {
  const eventName: EventName =
    params.status === 'started'
      ? 'payment_started'
      : params.status === 'completed'
        ? 'payment_completed'
        : 'payment_failed';

  trackEvent(eventName, {
    activity_id: params.activityId,
    amount: params.amount,
    currency: params.currency,
    payment_method: params.paymentMethod ?? null,
    error_message: params.errorMessage ?? null,
  });
}

export function trackRedirectClick(params: {
  activityId: string;
  partnerId: string;
  clickId: string;
  hasPartnerUrl: boolean;
}): void {
  trackEvent('redirect_clicked', {
    activity_id: params.activityId,
    partner_id: params.partnerId,
    click_id: params.clickId,
    has_partner_url: params.hasPartnerUrl,
  });
}

async function flushEvents(): Promise<void> {
  if (eventBuffer.length === 0) return;

  const eventsToFlush = [...eventBuffer];
  eventBuffer.length = 0;

  console.log(`[Analytics] Flushing ${eventsToFlush.length} events`);

  try {
    const DB_ENDPOINT = process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT;
    const DB_NAMESPACE = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;
    const DB_TOKEN = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;

    if (!DB_ENDPOINT || !DB_NAMESPACE || !DB_TOKEN) {
      console.log('[Analytics] No DB configured, events logged to console only');
      return;
    }

    const batchId = `batch_${Date.now()}`;
    await fetch(`${DB_ENDPOINT}/${DB_NAMESPACE}/analytics_events/${batchId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DB_TOKEN}`,
      },
      body: JSON.stringify({
        events: eventsToFlush,
        count: eventsToFlush.length,
        flushedAt: new Date().toISOString(),
      }),
    });

    console.log(`[Analytics] ${eventsToFlush.length} events persisted`);
  } catch (error) {
    console.error('[Analytics] Failed to flush events:', error);
    eventBuffer.push(...eventsToFlush);
  }
}

export function getBufferedEventCount(): number {
  return eventBuffer.length;
}

export { flushEvents };
