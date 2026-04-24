import { Linking, Platform } from 'react-native';
import { getApiBaseUrl } from '@/lib/env';

const GYG_PARTNER_ID = 'D82WHJ5';
const REDIRECT_TIMEOUT_MS = 12_000;

export interface RedirectBookParams {
  activityId: string;
  partnerUrl?: string;
  partnerId?: string;
  quoteId?: string;
  userHash?: string;
  requestId?: string;
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

export interface SelectPartnerResponse {
  success: boolean;
  partner_url: string;
  partner_id: string;
  partner_name: string;
  reason: string;
  click_id: string;
  score: number;
  top_candidates: Array<{ partnerId: string; score: number; reason: string }>;
}

export interface RedirectResult {
  clickId: string;
  redirectUrl: string;
  partnerId?: string;
  partnerName?: string;
  opened: boolean;
  fallback: boolean;
}

function fetchWithTimeout<T>(url: string, options: RequestInit, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    fetch(url, { ...options, signal: controller.signal })
      .then(async (response) => {
        clearTimeout(timer);
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
          reject(new Error(errorBody.error || `HTTP ${response.status}`));
          return;
        }
        const data = await response.json();
        resolve(data as T);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export function buildGetRedirectUrl(params: RedirectBookParams): string {
  const baseUrl = getApiBaseUrl();
  const qs = new URLSearchParams();
  qs.set('activity_id', params.activityId);
  if (params.partnerUrl) qs.set('partner_url', params.partnerUrl);
  if (params.quoteId) qs.set('quote_id', params.quoteId);
  if (params.userHash) qs.set('user_hash', params.userHash);
  if (params.requestId) qs.set('request_id', params.requestId);
  return `${baseUrl}/api/activities/redirect-book?${qs.toString()}`;
}

export async function selectPartner(activityId: string, sessionId?: string): Promise<SelectPartnerResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/activities/select-partner`;

  console.log('[RedirectService] POST select-partner:', activityId);

  const data = await fetchWithTimeout<SelectPartnerResponse>(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_id: activityId,
        user_context: sessionId ? { sessionId } : undefined,
        source: 'app',
      }),
    },
    REDIRECT_TIMEOUT_MS,
  );

  console.log('[RedirectService] Partner selected:', data.partner_id, data.partner_name, '-> url:', data.partner_url);
  return data;
}

export async function postRedirectBook(params: RedirectBookParams): Promise<RedirectBookResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/api/activities/redirect-book`;

  console.log('[RedirectService] POST redirect-book:', params.activityId, 'partnerUrl:', params.partnerUrl ? 'provided' : 'server-select');

  const startMs = Date.now();

  const data = await fetchWithTimeout<RedirectBookResponse>(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_id: params.activityId,
        partner_url: params.partnerUrl || undefined,
        partnerId: params.partnerId || undefined,
        quote_id: params.quoteId,
        user_hash: params.userHash,
        request_id: params.requestId,
      }),
    },
    REDIRECT_TIMEOUT_MS,
  );

  const elapsed = Date.now() - startMs;
  console.log(`[RedirectService] Click persisted in ${elapsed}ms: ${data.click_id} -> redirect: ${data.redirect} partner: ${data.partner_id || 'explicit'}`);

  return data;
}

export async function openInExternalBrowser(url: string): Promise<boolean> {
  console.log('[RedirectService] Opening in external browser:', url);

  try {
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    }

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }

    console.warn('[RedirectService] Cannot open URL via Linking, trying direct openURL:', url);
    await Linking.openURL(url);
    return true;
  } catch (error) {
    console.error('[RedirectService] Failed to open URL in external browser:', error);
    return false;
  }
}

export async function openWithClickPersistence(params: RedirectBookParams): Promise<RedirectResult> {
  const navStartMs = Date.now();

  try {
    const result = await postRedirectBook(params);

    const opened = await openInExternalBrowser(result.redirect);

    const elapsed = Date.now() - navStartMs;
    console.log(`[RedirectService] Full redirect flow completed in ${elapsed}ms, opened=${opened}`);

    return {
      clickId: result.click_id,
      redirectUrl: result.redirect,
      partnerId: result.partner_id,
      partnerName: result.partner_name,
      opened,
      fallback: false,
    };
  } catch (error) {
    console.warn('[RedirectService] Server redirect failed, using local fallback:', error);

    const fallbackUrl = buildFallbackUrl(params);
    const opened = await openInExternalBrowser(fallbackUrl);

    const elapsed = Date.now() - navStartMs;
    console.log(`[RedirectService] Fallback redirect in ${elapsed}ms, opened=${opened}`);

    return {
      clickId: `local_fallback_${Date.now()}`,
      redirectUrl: fallbackUrl,
      opened,
      fallback: true,
    };
  }
}

function buildFallbackUrl(params: RedirectBookParams): string {
  if (!params.partnerUrl) {
    return `https://www.getyourguide.com/s/?partner_id=${GYG_PARTNER_ID}&utm_source=andartravel&utm_medium=app`;
  }
  try {
    const url = new URL(params.partnerUrl);
    url.searchParams.set('aff_id', GYG_PARTNER_ID);
    url.searchParams.set('utm_source', 'andartravel');
    url.searchParams.set('utm_medium', 'app');
    return url.toString();
  } catch {
    return params.partnerUrl;
  }
}

export { GYG_PARTNER_ID };
