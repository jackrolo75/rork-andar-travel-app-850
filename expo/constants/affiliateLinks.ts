/**
 * Canonical affiliate URL builder — single source of truth for the whole app.
 *
 * Why this file is the only one you should import from for affiliate links:
 *  - All redirects go to GetYourGuide using the real affiliate ID (D82WHJ5).
 *  - Tracking params (partner_id, utm_source, utm_medium) are always attached.
 *  - Category + city + date + guests are normalised in one place.
 */
import { ActivityCategory } from '@/types/activities';
import {
  buildGYGDestinationUrl,
  buildGYGCategoryUrl,
  buildGYGSearchUrl,
  GYG_PARTNER_ID,
} from '@/constants/getYourGuideLinks';

export interface AffiliateSearchParams {
  destination: string;
  category?: ActivityCategory | string;
  date?: string;
  endDate?: string;
  guests?: number;
}

/** Canonical: build a city-only landing URL. */
export function buildDestinationUrl(city: string): string {
  if (!city || !city.trim()) {
    console.warn('[AffiliateLinks] Empty city for destination URL');
    return `https://www.getyourguide.com/?partner_id=${GYG_PARTNER_ID}&utm_source=andartravel&utm_medium=app`;
  }
  return buildGYGDestinationUrl(city.trim());
}

/** Canonical: build a category + city URL. */
export function buildCategoryUrl(category: ActivityCategory | string, city: string): string {
  if (!city || !city.trim()) {
    console.warn('[AffiliateLinks] Empty city for category URL, falling back to category search');
    return `https://www.getyourguide.com/s/?q=${encodeURIComponent(String(category))}&partner_id=${GYG_PARTNER_ID}&utm_source=andartravel&utm_medium=app`;
  }
  return buildGYGCategoryUrl(String(category), city.trim());
}

/** Canonical: full search URL with optional category, dates, guests. */
export function buildSearchUrl(params: AffiliateSearchParams): string {
  const { destination, category, date, guests } = params;
  if (!destination || !destination.trim()) {
    console.warn('[AffiliateLinks] Empty destination for search URL');
    return '';
  }
  return buildGYGSearchUrl({
    destination: destination.trim(),
    category: category ? String(category) : undefined,
    date,
    guests,
  });
}

/** Build an activity-specific URL from a free-text query (used at confirmation). */
export function buildActivityQueryUrl(location: string, activity: string): string {
  const q = `${location} ${activity}`.trim();
  if (!q) return buildDestinationUrl(location || activity);
  return `https://www.getyourguide.com/s/?q=${encodeURIComponent(q)}&partner_id=${GYG_PARTNER_ID}&utm_medium=online_publisher&utm_source=andartravel`;
}

/**
 * Canonical: build the EXACT activity landing URL for a given title + city.
 *
 * This is the URL the user sees when they tap a specific experience card
 * (e.g. "Paris Louvre" must open the Louvre tickets results, NOT the GYG homepage).
 *
 * Strategy: GYG search reliably resolves a title-scoped query to the right activity
 * list. We always include the city so disambiguation works even for common names.
 */
export function buildActivityUrl(title: string, city: string, category?: ActivityCategory | string): string {
  const cleanTitle = (title || '').trim();
  const cleanCity = (city || '').trim();

  if (!cleanTitle && !cleanCity) {
    console.warn('[AffiliateLinks] buildActivityUrl: empty title and city, using fallback');
    return `https://www.getyourguide.com/?partner_id=${GYG_PARTNER_ID}&utm_source=andartravel&utm_medium=app`;
  }

  // Title alone is usually enough — but appending the city massively improves
  // result quality for ambiguous names (e.g. "Louvre" vs "Louvre Lens").
  const queryParts = [cleanTitle, cleanCity].filter(Boolean);
  const q = queryParts.join(' ');

  const url = `https://www.getyourguide.com/s/?q=${encodeURIComponent(q)}&partner_id=${GYG_PARTNER_ID}&utm_medium=online_publisher&utm_source=andartravel`;

  if (category) {
    // category is informational only; GYG search already handles it via q.
    return `${url}&category=${encodeURIComponent(String(category))}`;
  }
  return url;
}

/**
 * Returns true when a URL is a generic/landing page (no specific activity context)
 * and therefore should NOT be used as the redirect target.
 */
export function isGenericAffiliateUrl(url: string | undefined | null): boolean {
  if (!url || !url.trim()) return true;
  try {
    const u = new URL(url);
    if (!u.hostname.includes('getyourguide')) return false;
    const q = u.searchParams.get('q');
    const hasQ = !!(q && q.trim().length > 1);
    // /s/ with no q → generic; / with no path → generic
    const pathIsGeneric = u.pathname === '/' || u.pathname === '/s/' || u.pathname === '/s';
    return pathIsGeneric && !hasQ;
  } catch {
    return true;
  }
}

// ─── Back-compat aliases (do not use in new code) ──────────────────────────────
/** @deprecated use buildCategoryUrl */
export const buildCategoryAffiliateUrl = buildCategoryUrl;
/** @deprecated use buildDestinationUrl */
export const buildDestinationAffiliateUrl = buildDestinationUrl;
/** @deprecated use buildSearchUrl */
export const buildSearchAffiliateUrl = buildSearchUrl;

export interface SearchAffiliateParams extends AffiliateSearchParams {}

interface DestinationLinks {
  primary: string;
}
/** @deprecated use buildDestinationUrl */
export function getDestinationLinks(city: string): DestinationLinks {
  return { primary: buildDestinationUrl(city) };
}

export const AFFILIATE_DISCLOSURE = 'AndarTravel earns commissions from bookings made through partner links. Prices shown are sourced from our partners and may vary at checkout. All payments are processed directly by the booking provider — AndarTravel does not handle payments.';

export const PRICING_NOTICE = "Prices are indicative and set by our partners. Final price is confirmed on the partner's checkout page. No hidden fees are added by AndarTravel.";

export { GYG_PARTNER_ID };
