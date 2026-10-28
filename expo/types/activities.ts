export type ActivityCategory = 'adventure' | 'culture' | 'food' | 'nature' | 'wellness' | 'water' | 'nightlife' | 'tickets';

export type ActivityBookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface GeoCoordinates {
  lat: number;
  lon: number;
}

export interface GeoBoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface ResolvedPlace {
  placeId: string;
  name: string;
  displayName: string;
  centroid: GeoCoordinates;
  bbox: GeoBoundingBox;
  country: string;
  adminRegion?: string;
  type: 'city' | 'region' | 'country';
}

export interface ActivityGeoMeta {
  lat: number;
  lon: number;
  distanceToPlaceKm?: number;
  matchMethod?: 'bbox' | 'radius' | 'admin_match' | 'name_match';
  confidenceScore?: number;
}

export interface ActivitySearchParams {
  destination: string;
  date: string;
  endDate?: string;
  guests: number;
  category?: ActivityCategory;
  timeSlot?: 'morning' | 'afternoon' | 'evening' | 'any';
  priceMin?: number;
  priceMax?: number;
  sortBy?: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'popularity';
  placeId?: string;
  strictLocation?: boolean;
  radiusKm?: number;
}

export interface ActivityOffer {
  id: string;
  partnerId: string;
  partnerName: string;
  title: string;
  subtitle?: string;
  description: string;
  location: string;
  city: string;
  country: string;
  geo?: ActivityGeoMeta;
  category: ActivityCategory;
  price: number;
  originalPrice?: number;
  currency: string;
  duration: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  images: string[];
  highlights: string[];
  includes: string[];
  timeSlots?: string[];
  availability?: string;
  isBestPrice?: boolean;
  discount?: number;
  deepLink: string;
  cancellationPolicy?: string;
  languages?: string[];
  maxGroupSize?: number;
}

export interface ActivityQuote {
  quoteId: string;
  activityId: string;
  partnerId: string;
  price: number;
  currency: string;
  guests: number;
  date: string;
  timeSlot?: string;
  expiresAt: string;
}

export interface ActivityBooking {
  bookingId: string;
  activityId: string;
  partnerId: string;
  quoteId: string;
  clickId: string;
  status: ActivityBookingStatus;
  price: number;
  currency: string;
  guests: number;
  date: string;
  timeSlot?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface ActivityClickRecord {
  clickId: string;
  activityId: string;
  partnerId: string;
  quoteId: string;
  timestamp: string;
  utmSource: string;
  utmMedium: string;
  redirectUrl: string;
  status: 'pending' | 'clicked' | 'converted' | 'expired';
}

export interface ActivitiesFeatureFlags {
  activities_enabled: boolean;
  activities_affiliate_redirect_enabled: boolean;
}

export const DEFAULT_ACTIVITIES_FLAGS: ActivitiesFeatureFlags = {
  activities_enabled: true,
  activities_affiliate_redirect_enabled: true,
};

export const ACTIVITIES_DISCLAIMER = "Disclaimer: AndarTravel acts solely as an intermediary for search and redirection. Bookings, payments, cancellations, and refunds are governed by the terms of the selected provider. AndarTravel is not responsible for changes or failures in services provided by third parties.";

export const GYG_BASE_URL = 'https://www.getyourguide.com/s/';
export const GYG_AFFILIATE_PARTNER_ID = 'D82WHJ5';

export const TIQETS_BASE_URL = 'https://www.tiqets.com/en/search';
export const TRIPCOM_BASE_URL = 'https://www.trip.com/travel-guide/activities';
export const TICKETNETWORK_BASE_URL = 'https://www.ticketnetwork.com/performers';

export const PARTNER_AFFILIATE_URLS: Record<string, string> = {
  tiqets: TIQETS_BASE_URL,
  tripcom: TRIPCOM_BASE_URL,
  ticketnetwork: TICKETNETWORK_BASE_URL,
  getyourguide: GYG_BASE_URL,
  klook: GYG_BASE_URL,
  viator: GYG_BASE_URL,
};

export function getPartnerAffiliateUrl(partnerId: string): string {
  return PARTNER_AFFILIATE_URLS[partnerId] || GYG_BASE_URL;
}

export function buildActivityRedirectUrl(
  clickId: string,
  quoteId: string,
  baseUrl: string = GYG_BASE_URL,
): string {
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}sub_id=${encodeURIComponent(clickId)}&sub_id2=${encodeURIComponent(quoteId)}&utm_source=andartravel&utm_medium=app`;
}
