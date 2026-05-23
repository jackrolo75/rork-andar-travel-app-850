/**
 * @deprecated Shim — delegates to the canonical affiliate URL builder.
 * Import from `@/constants/affiliateLinks` instead.
 */
import { ActivityCategory } from '@/types/activities';
import {
  buildSearchUrl,
  buildCategoryUrl,
  buildDestinationUrl,
} from '@/constants/affiliateLinks';

export function buildTravelpayoutsSearchUrl(params: {
  destination: string;
  date?: string;
  endDate?: string;
  guests?: number;
  category?: ActivityCategory;
}): string {
  return buildSearchUrl(params);
}

export function buildTravelpayoutsCategoryUrl(category: ActivityCategory, city: string): string {
  return buildCategoryUrl(category, city);
}

export function buildTravelpayoutsDestinationUrl(city: string): string {
  return buildDestinationUrl(city);
}
