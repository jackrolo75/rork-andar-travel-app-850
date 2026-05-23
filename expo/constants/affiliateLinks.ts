/**
 * Canonical affiliate URL builder — single source of truth for the whole app.
 *
 * Why this file is the only one you should import from for affiliate links:
 *  - All redirects go to GetYourGuide using the real affiliate ID (D82WHJ5).
 *  - Tracking params (partner_id, utm_source, utm_medium) are always attached.
 *  - Category + city + date + guests are normalised in one place.
 *
 * Back-compat: `constants/travelpayoutsLinks.ts` and `constants/partnerRouting.ts`
 * are now thin shims that delegate here, so existing imports keep working.
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
