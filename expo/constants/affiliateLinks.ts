import { buildGYGDestinationUrl, buildGYGCategoryUrl, buildGYGSearchUrl } from '@/constants/getYourGuideLinks';

export function buildCategoryAffiliateUrl(category: string, city: string): string {
  const url = buildGYGCategoryUrl(category, city);
  console.log('[AffiliateLinks] Built GYG category URL:', { category, city, url });
  return url;
}

export function buildDestinationAffiliateUrl(city: string): string {
  const url = buildGYGDestinationUrl(city);
  console.log('[AffiliateLinks] Built GYG destination URL:', { city, url });
  return url;
}

interface DestinationLinks {
  primary: string;
}

export function getDestinationLinks(city: string): DestinationLinks {
  return {
    primary: buildGYGDestinationUrl(city),
  };
}

export interface SearchAffiliateParams {
  destination: string;
  date?: string;
  endDate?: string;
  guests?: number;
  category?: string;
}

export function buildSearchAffiliateUrl(params: SearchAffiliateParams): string {
  const { destination, date, guests, category } = params;

  const url = buildGYGSearchUrl({
    destination,
    category: category || undefined,
    date,
    guests,
  });

  console.log('[AffiliateLinks] Built GYG search URL:', { destination, category, date, guests, url });
  return url;
}

export const AFFILIATE_DISCLOSURE = 'AndarTravel earns commissions from bookings made through partner links. Prices shown are sourced from our partners and may vary at checkout. All payments are processed directly by the booking provider — AndarTravel does not handle payments.';

export const PRICING_NOTICE = 'Prices are indicative and set by our partners. Final price is confirmed on the partner\'s checkout page. No hidden fees are added by AndarTravel.';
