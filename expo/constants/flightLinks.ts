/**
 * Canonical flight-affiliate URL builder — the single place that knows how
 * AndarTravel monetizes flight searches.
 *
 * How it works:
 *  - User-facing search happens on Aviasales via deep-links
 *    (https://www.aviasales.com/search/{ORIGIN}{DDMM}{DEST}{DDMM}{PAX}).
 *  - Every deep-link is wrapped in a Travelpayouts tracking redirect
 *    (tp.media/r) so commissions are attributed to partner marker 698160.
 *  - sub_id=andartravel_flights keeps flight traffic separable in statistics.
 *
 * Credentials (Travelpayouts account): marker 698160, trs 491382.
 */
import { resolveIata } from '@/constants/flightCities';

export const TP_MARKER = '698160';
export const TP_TRS = '491382';
/** Travelpayouts program id for Aviasales. */
const AVIASALES_PROGRAM_ID = '4114';
const CAMPAIGN_ID = '100';
export const FLIGHTS_SUB_ID = 'andartravel_flights';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  /** ISO date YYYY-MM-DD. */
  departDate?: string;
  /** ISO date YYYY-MM-DD (round-trip only). */
  returnDate?: string;
  passengers?: number;
}

/** Aviasales dates are DDMM (day + month, no year) in the /search path. */
export function formatAviasalesDate(isoDate: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return null;
  const [, , month, day] = m;
  return `${day}${month}`;
}

/**
 * Builds the raw Aviasales search URL (no tracking wrapper).
 * Format: /search/{ORIGIN}{DDMM}{DEST}{DDMM}{PAX}
 */
export function buildAviasalesSearchUrl(params: FlightSearchParams): string | null {
  const origin = resolveIata(params.origin);
  const destination = resolveIata(params.destination);
  if (!origin || !destination) return null;
  if (origin === destination) return null;

  const depart = params.departDate ? formatAviasalesDate(params.departDate) : null;
  const ret = params.returnDate ? formatAviasalesDate(params.returnDate) : null;
  const passengers = Math.min(Math.max(params.passengers ?? 1, 1), 9);

  const path = `${origin}${depart ?? ''}${destination}${ret ?? ''}${passengers}`;
  return `https://www.aviasales.com/search/${path}`;
}

/**
 * Canonical: tracked flight-search URL (tp.media/r → Aviasales).
 * Returns null when origin/destination can't be resolved to IATA codes —
 * callers should surface a "check the city name" hint instead of opening a
 * broken link.
 */
export function buildFlightAffiliateUrl(params: FlightSearchParams): string | null {
  const aviasalesUrl = buildAviasalesSearchUrl(params);
  if (!aviasalesUrl) return null;

  const tracking = new URLSearchParams({
    marker: TP_MARKER,
    trs: TP_TRS,
    p: AVIASALES_PROGRAM_ID,
    u: aviasalesUrl,
    campaign_id: CAMPAIGN_ID,
    sub_id: FLIGHTS_SUB_ID,
  });

  return `https://tp.media/r?${tracking.toString()}`;
}
