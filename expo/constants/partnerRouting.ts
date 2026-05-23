/**
 * @deprecated Shim — delegates to the canonical affiliate URL builder.
 * Import from `@/constants/affiliateLinks` instead.
 *
 * Previously routed to Tiqets / Trip.com / TicketNetwork with non-affiliate
 * UTM-only links. Consolidated to a single attributed GetYourGuide flow.
 */
import { ActivityCategory } from '@/types/activities';
import {
  buildSearchUrl,
  buildCategoryUrl,
  buildDestinationUrl,
} from '@/constants/affiliateLinks';

export type AffiliatePartner = 'getyourguide';

export interface PartnerSearchParams {
  destination: string;
  category?: ActivityCategory;
  date?: string;
  endDate?: string;
  guests?: number;
}

export function buildPartnerAffiliateUrl(params: PartnerSearchParams): string {
  return buildSearchUrl(params);
}

export function buildPartnerCategoryUrl(category: ActivityCategory, city: string): string {
  return buildCategoryUrl(category, city);
}

export function buildPartnerDestinationUrl(city: string): string {
  return buildDestinationUrl(city);
}

export function getPartnerForCategory(_category: ActivityCategory): AffiliatePartner {
  return 'getyourguide';
}

export function getPartnerNameForCategory(_category: ActivityCategory): string {
  return 'GetYourGuide';
}
