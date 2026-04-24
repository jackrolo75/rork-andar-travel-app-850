import { ActivityCategory } from '@/types/activities';

export type AffiliatePartner = 'tiqets' | 'tripcom' | 'ticketnetwork';

export interface PartnerAffiliateConfig {
  id: AffiliatePartner;
  name: string;
  baseSearchUrl: string;
  trackingParams: Record<string, string>;
  categories: ActivityCategory[];
}

const TIQETS_CONFIG: PartnerAffiliateConfig = {
  id: 'tiqets',
  name: 'Tiqets',
  baseSearchUrl: 'https://www.tiqets.com/en/search',
  trackingParams: {
    partner: 'andartravel',
    utm_source: 'andartravel',
    utm_medium: 'app',
  },
  categories: ['culture', 'tickets'],
};

const TRIPCOM_CONFIG: PartnerAffiliateConfig = {
  id: 'tripcom',
  name: 'Trip.com',
  baseSearchUrl: 'https://www.trip.com/travel-guide/activities',
  trackingParams: {
    utm_source: 'andartravel',
    utm_medium: 'app',
  },
  categories: ['adventure', 'food', 'nature', 'wellness', 'water'],
};

const TICKETNETWORK_CONFIG: PartnerAffiliateConfig = {
  id: 'ticketnetwork',
  name: 'TicketNetwork',
  baseSearchUrl: 'https://www.ticketnetwork.com/performers',
  trackingParams: {
    utm_source: 'andartravel',
    utm_medium: 'app',
  },
  categories: ['nightlife'],
};

export const PARTNER_CONFIGS: PartnerAffiliateConfig[] = [
  TIQETS_CONFIG,
  TRIPCOM_CONFIG,
  TICKETNETWORK_CONFIG,
];

const CATEGORY_PARTNER_MAP: Record<ActivityCategory, AffiliatePartner> = {
  culture: 'tiqets',
  tickets: 'tiqets',
  adventure: 'tripcom',
  food: 'tripcom',
  nature: 'tripcom',
  wellness: 'tripcom',
  water: 'tripcom',
  nightlife: 'ticketnetwork',
};

export function getPartnerForCategory(category: ActivityCategory): AffiliatePartner {
  return CATEGORY_PARTNER_MAP[category];
}

export function getPartnerConfig(partner: AffiliatePartner): PartnerAffiliateConfig {
  const config = PARTNER_CONFIGS.find(p => p.id === partner);
  if (!config) {
    console.warn(`[PartnerRouting] Unknown partner: ${partner}, falling back to Trip.com`);
    return TRIPCOM_CONFIG;
  }
  return config;
}

export function getPartnerConfigForCategory(category: ActivityCategory): PartnerAffiliateConfig {
  const partnerId = getPartnerForCategory(category);
  return getPartnerConfig(partnerId);
}

const TIQETS_CITY_SLUGS: Record<string, string> = {
  'paris': 'paris',
  'london': 'london',
  'barcelona': 'barcelona',
  'rome': 'rome',
  'madrid': 'madrid',
  'amsterdam': 'amsterdam',
  'berlin': 'berlin',
  'florence': 'florence',
  'venice': 'venice',
  'milan': 'milan',
  'lisbon': 'lisbon',
  'istanbul': 'istanbul',
  'athens': 'athens',
  'new york': 'new-york',
  'dubai': 'dubai',
  'bangkok': 'bangkok',
  'tokyo': 'tokyo',
  'los angeles': 'los-angeles',
  'san francisco': 'san-francisco',
  'las vegas': 'las-vegas',
  'orlando': 'orlando',
  'miami': 'miami',
  'seville': 'seville',
  'malaga': 'malaga',
  'rio de janeiro': 'rio-de-janeiro',
  'palma de mallorca': 'palma-de-mallorca',
};

const TRIPCOM_CITY_SLUGS: Record<string, string> = {
  'paris': 'paris-60',
  'london': 'london-100',
  'barcelona': 'barcelona-631',
  'rome': 'rome-303',
  'madrid': 'madrid-197',
  'amsterdam': 'amsterdam-580',
  'bangkok': 'bangkok-191',
  'tokyo': 'tokyo-254',
  'dubai': 'dubai-293',
  'new york': 'new-york-60',
  'los angeles': 'los-angeles-148',
  'miami': 'miami-148',
  'istanbul': 'istanbul-285',
  'lisbon': 'lisbon-577',
  'berlin': 'berlin-472',
  'athens': 'athens-327',
  'florence': 'florence-303',
  'venice': 'venice-303',
  'milan': 'milan-303',
  'orlando': 'orlando-148',
  'las vegas': 'las-vegas-148',
  'san francisco': 'san-francisco-148',
  'seville': 'seville-631',
  'malaga': 'malaga-631',
  'rio de janeiro': 'rio-de-janeiro-73',
  'palma de mallorca': 'palma-de-mallorca-631',
};

const TICKETNETWORK_CITY_MAP: Record<string, string> = {
  'new york': 'New-York',
  'los angeles': 'Los-Angeles',
  'las vegas': 'Las-Vegas',
  'miami': 'Miami',
  'orlando': 'Orlando',
  'san francisco': 'San-Francisco',
  'london': 'London',
  'paris': 'Paris',
  'barcelona': 'Barcelona',
  'amsterdam': 'Amsterdam',
  'berlin': 'Berlin',
  'rome': 'Rome',
  'madrid': 'Madrid',
  'tokyo': 'Tokyo',
  'dubai': 'Dubai',
  'bangkok': 'Bangkok',
  'istanbul': 'Istanbul',
  'lisbon': 'Lisbon',
  'athens': 'Athens',
  'rio de janeiro': 'Rio-De-Janeiro',
  'milan': 'Milan',
  'florence': 'Florence',
  'venice': 'Venice',
  'seville': 'Seville',
  'malaga': 'Malaga',
  'palma de mallorca': 'Palma-De-Mallorca',
};

function buildTiqetsUrl(city: string, category?: ActivityCategory): string {
  const cityKey = city.toLowerCase().trim();
  const slug = TIQETS_CITY_SLUGS[cityKey] || encodeURIComponent(city.toLowerCase().replace(/\s+/g, '-'));
  const query = category ? `${city} ${category}` : city;

  const url = `https://www.tiqets.com/en/search?q=${encodeURIComponent(query)}&partner=andartravel&utm_source=andartravel&utm_medium=app`;
  console.log('[PartnerRouting] Built Tiqets URL:', { city, category, url });
  return url;
}

function buildTripcomUrl(city: string, category?: ActivityCategory): string {
  const cityKey = city.toLowerCase().trim();
  const slug = TRIPCOM_CITY_SLUGS[cityKey];

  let url: string;
  if (slug) {
    url = `https://www.trip.com/travel-guide/activities/${slug}/?utm_source=andartravel&utm_medium=app`;
  } else {
    const query = category ? `${city} ${category}` : city;
    url = `https://www.trip.com/travel-guide/activities/?keyword=${encodeURIComponent(query)}&utm_source=andartravel&utm_medium=app`;
  }
  console.log('[PartnerRouting] Built Trip.com URL:', { city, category, url });
  return url;
}

function buildTicketNetworkUrl(city: string, category?: ActivityCategory): string {
  const cityKey = city.toLowerCase().trim();
  const citySlug = TICKETNETWORK_CITY_MAP[cityKey] || encodeURIComponent(city.replace(/\s+/g, '-'));
  const query = category ? `${city} ${category}` : `${city} events`;

  const url = `https://www.ticketnetwork.com/performers?q=${encodeURIComponent(query)}&utm_source=andartravel&utm_medium=app`;
  console.log('[PartnerRouting] Built TicketNetwork URL:', { city, category, url });
  return url;
}

export interface PartnerSearchParams {
  destination: string;
  category?: ActivityCategory;
  date?: string;
  endDate?: string;
  guests?: number;
}

export function buildPartnerAffiliateUrl(params: PartnerSearchParams): string {
  const { destination, category, date, endDate, guests } = params;

  if (!destination) {
    console.warn('[PartnerRouting] No destination provided');
    return '';
  }

  const partner = category ? getPartnerForCategory(category) : 'tripcom';

  console.log('[PartnerRouting] Building affiliate URL:', { destination, category, partner });

  let url: string;

  switch (partner) {
    case 'tiqets':
      url = buildTiqetsUrl(destination, category);
      break;
    case 'ticketnetwork':
      url = buildTicketNetworkUrl(destination, category);
      break;
    case 'tripcom':
    default:
      url = buildTripcomUrl(destination, category);
      break;
  }

  if (date) {
    const separator = url.includes('?') ? '&' : '?';
    url += `${separator}date=${encodeURIComponent(date)}`;
  }

  return url;
}

export function buildPartnerCategoryUrl(category: ActivityCategory, city: string): string {
  const partner = getPartnerForCategory(category);
  console.log('[PartnerRouting] Building category URL:', { category, city, partner });

  switch (partner) {
    case 'tiqets':
      return buildTiqetsUrl(city, category);
    case 'ticketnetwork':
      return buildTicketNetworkUrl(city, category);
    case 'tripcom':
    default:
      return buildTripcomUrl(city, category);
  }
}

export function buildPartnerDestinationUrl(city: string): string {
  const url = buildTripcomUrl(city);
  console.log('[PartnerRouting] Built destination URL:', { city, url });
  return url;
}

export function getPartnerNameForCategory(category: ActivityCategory): string {
  const partnerId = getPartnerForCategory(category);
  const config = getPartnerConfig(partnerId);
  return config.name;
}
