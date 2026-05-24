import { Linking, Platform } from 'react-native';
import { getApiBaseUrl } from '@/lib/env';
import { isGenericAffiliateUrl, buildActivityUrl } from '@/constants/affiliateLinks';

const GYG_PARTNER_ID = 'D82WHJ5';

/**
 * Performance-tuned timeouts.
 * - PERSIST_TIMEOUT_MS: background click-tracking call, NEVER blocks the UI.
 * - OPEN_TIMEOUT_MS: how long we wait for Linking.openURL before bailing.
 */
const PERSIST_TIMEOUT_MS = 1_500;
const OPEN_TIMEOUT_MS = 2_500;
const PERSIST_RETRIES = 1;

export interface RedirectBookParams {
  activityId: string;
  partnerUrl?: string;
  partnerId?: string;
  quoteId?: string;
  userHash?: string;
  requestId?: string;
  /** Optional metadata to recover a specific activity URL if partnerUrl is missing or generic. */
  activityTitle?: string;
  destination?: string;
  category?: string;
}

export interface RedirectBookResponse {
  success: boolean;
  click_id: string;
  redirect: string;
  partner_id?: string;
  partner_name?: string;
  reason?: string;
  score?: number;
  utm: {
    sub_id: string;
    aff_id: string;
    utm_source: string;
    utm_medium: string;
  };
}

export interface RedirectResult {
  clickId: string;
  redirectUrl: string;
  partnerId?: string;
  partnerName?: string;
  opened: boolean;
  fallback: boolean;
}

function timeoutPromise<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); },
    );
  });
}

async function fetchWithTimeout<T>(url: string, options: RequestInit, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      throw new Error(body.error || `HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Ensures every partner URL carries our tracking parameters so commissions
 * are attributed even when the URL is opened directly via Linking.
 */
export function withTracking(url: string, partnerId?: string): string {
  try {
    const u = new URL(url);
    if (!u.searchParams.has('utm_source')) u.searchParams.set('utm_source', 'andartravel');
    if (!u.searchParams.has('utm_medium')) u.searchParams.set('utm_medium', 'app');
    if (partnerId && !u.searchParams.has('partner_ref')) {
      u.searchParams.set('partner_ref', partnerId);
    }
    if (u.hostname.includes('getyourguide') && !u.searchParams.has('partner_id')) {
      u.searchParams.set('partner_id', GYG_PARTNER_ID);
    }
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Opens a URL in the system browser. Optimised to skip canOpenURL on http(s)
 * URLs, which all platforms accept, removing one async hop.
 */
export async function openInExternalBrowser(url: string): Promise<boolean> {
  const startMs = Date.now();
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return true;
    }

    // http/https never needs canOpenURL on iOS / Android: skip the extra round-trip.
    const isHttp = /^https?:\/\//i.test(url);
    if (!isHttp) {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        console.warn('[RedirectService] canOpenURL=false for non-http scheme:', url);
        return false;
      }
    }

    await timeoutPromise(Linking.openURL(url), OPEN_TIMEOUT_MS, 'Linking.openURL');
    console.log(`[RedirectService] Opened in ${Date.now() - startMs}ms:`, url.slice(0, 120));
    return true;
  } catch (error) {
    console.error('[RedirectService] Failed to open URL:', error);
    return false;
  }
}

async function persistClickInBackground(params: RedirectBookParams): Promise<string | null> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/activities/redirect-book`;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= PERSIST_RETRIES; attempt++) {
    try {
      const data = await fetchWithTimeout<RedirectBookResponse>(
        url,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity_id: params.activityId,
            partner_url: params.partnerUrl,
            partnerId: params.partnerId,
            quote_id: params.quoteId,
            user_hash: params.userHash,
            request_id: params.requestId,
          }),
        },
        PERSIST_TIMEOUT_MS,
      );
      console.log(`[RedirectService] Click persisted (attempt ${attempt + 1}):`, data.click_id);
      return data.click_id;
    } catch (err) {
      lastErr = err;
      if (attempt < PERSIST_RETRIES) {
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  }
  console.warn('[RedirectService] Click persist failed (non-blocking):', lastErr);
  return null;
}

/**
 * INSTANT redirect: opens the partner URL immediately and persists the click in
 * the background. Falls back to a tracked URL if no partnerUrl was provided.
 *
 * Target: <500ms from tap to browser open (no server roundtrip on critical path).
 */
export async function openWithClickPersistence(params: RedirectBookParams): Promise<RedirectResult> {
  const navStartMs = Date.now();

  // Resolve the most specific URL possible, in priority order:
  //   1. caller-provided partnerUrl, if it actually points at a specific activity
  //   2. title+destination → activity-specific GYG search
  //   3. activityId-based search fallback
  let resolvedUrl: string;
  if (params.partnerUrl && !isGenericAffiliateUrl(params.partnerUrl)) {
    resolvedUrl = params.partnerUrl;
  } else if (params.activityTitle || params.destination) {
    resolvedUrl = buildActivityUrl(
      params.activityTitle ?? '',
      params.destination ?? '',
      params.category,
    );
    if (params.partnerUrl) {
      console.warn('[RedirectService] partnerUrl was generic, rebuilt from title:', {
        original: params.partnerUrl.slice(0, 80),
        rebuilt: resolvedUrl.slice(0, 80),
      });
    }
  } else {
    resolvedUrl = buildFallbackUrl(params);
  }

  const targetUrl = withTracking(resolvedUrl, params.partnerId);

  // Fire click persistence in the background — never block the redirect.
  const localClickId = `pending_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const persistPromise = persistClickInBackground({ ...params, partnerUrl: targetUrl })
    .catch(() => null);

  const opened = await openInExternalBrowser(targetUrl);
  const elapsed = Date.now() - navStartMs;
  console.log(`[RedirectService] Redirect flow ${opened ? 'OK' : 'FAILED'} in ${elapsed}ms`);

  // Don't await persistPromise — it'll resolve on its own and log.
  void persistPromise;

  return {
    clickId: localClickId,
    redirectUrl: targetUrl,
    opened,
    fallback: !params.partnerUrl,
  };
}

/**
 * Server-side partner selection. Use ONLY when no partnerUrl is known up-front.
 * Result is cached briefly so repeated taps don't refetch.
 */
const partnerCache = new Map<string, { url: string; expires: number }>();
const PARTNER_CACHE_MS = 60_000;

export async function selectPartnerUrl(activityId: string): Promise<string | null> {
  const cached = partnerCache.get(activityId);
  if (cached && cached.expires > Date.now()) {
    return cached.url;
  }
  const baseUrl = getApiBaseUrl();
  try {
    const data = await fetchWithTimeout<{ partner_url: string }>(
      `${baseUrl}/api/activities/select-partner`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activity_id: activityId, source: 'app' }),
      },
      PERSIST_TIMEOUT_MS,
    );
    if (data?.partner_url) {
      partnerCache.set(activityId, { url: data.partner_url, expires: Date.now() + PARTNER_CACHE_MS });
      return data.partner_url;
    }
  } catch (err) {
    console.warn('[RedirectService] selectPartnerUrl failed:', err);
  }
  return null;
}

function buildFallbackUrl(params: RedirectBookParams): string {
  return `https://www.getyourguide.com/s/?partner_id=${GYG_PARTNER_ID}&utm_source=andartravel&utm_medium=app&q=${encodeURIComponent(params.activityId)}`;
}

export { GYG_PARTNER_ID };
