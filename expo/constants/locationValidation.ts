import { ActivityCategory } from '@/types/activities';

export interface CityGeoProfile {
  name: string;
  country: string;
  lat: number;
  lon: number;
  isCoastal: boolean;
  isLakeRegion: boolean;
  isMountainRegion: boolean;
  isDesert: boolean;
  isIsland: boolean;
  allowedCategories: ActivityCategory[];
  blockedCategories: ActivityCategory[];
}

const CITY_GEO_PROFILES: Record<string, CityGeoProfile> = {
  tokyo: {
    name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503,
    isCoastal: true, isLakeRegion: false, isMountainRegion: false, isDesert: false, isIsland: true,
    allowedCategories: ['adventure', 'culture', 'food', 'nature', 'wellness', 'water', 'nightlife', 'tickets'],
    blockedCategories: [],
  },
  bali: {
    name: 'Bali', country: 'Indonesia', lat: -8.4095, lon: 115.1889,
    isCoastal: true, isLakeRegion: false, isMountainRegion: true, isDesert: false, isIsland: true,
    allowedCategories: ['adventure', 'culture', 'food', 'nature', 'wellness', 'water', 'nightlife', 'tickets'],
    blockedCategories: [],
  },
  paris: {
    name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522,
    isCoastal: false, isLakeRegion: false, isMountainRegion: false, isDesert: false, isIsland: false,
    allowedCategories: ['adventure', 'culture', 'food', 'nature', 'wellness', 'nightlife', 'tickets'],
    blockedCategories: ['water'],
  },
  dubai: {
    name: 'Dubai', country: 'UAE', lat: 25.2048, lon: 55.2708,
    isCoastal: true, isLakeRegion: false, isMountainRegion: false, isDesert: true, isIsland: false,
    allowedCategories: ['adventure', 'culture', 'food', 'nature', 'wellness', 'water', 'nightlife', 'tickets'],
    blockedCategories: [],
  },
  barcelona: {
    name: 'Barcelona', country: 'Spain', lat: 41.3874, lon: 2.1686,
    isCoastal: true, isLakeRegion: false, isMountainRegion: false, isDesert: false, isIsland: false,
    allowedCategories: ['adventure', 'culture', 'food', 'nature', 'wellness', 'water', 'nightlife', 'tickets'],
    blockedCategories: [],
  },
  rome: {
    name: 'Rome', country: 'Italy', lat: 41.9028, lon: 12.4964,
    isCoastal: false, isLakeRegion: false, isMountainRegion: false, isDesert: false, isIsland: false,
    allowedCategories: ['adventure', 'culture', 'food', 'nature', 'wellness', 'nightlife', 'tickets'],
    blockedCategories: ['water'],
  },
  bangkok: {
    name: 'Bangkok', country: 'Thailand', lat: 13.7563, lon: 100.5018,
    isCoastal: false, isLakeRegion: false, isMountainRegion: false, isDesert: false, isIsland: false,
    allowedCategories: ['adventure', 'culture', 'food', 'nature', 'wellness', 'nightlife', 'tickets'],
    blockedCategories: ['water'],
  },
  lisbon: {
    name: 'Lisbon', country: 'Portugal', lat: 38.7223, lon: -9.1393,
    isCoastal: true, isLakeRegion: false, isMountainRegion: false, isDesert: false, isIsland: false,
    allowedCategories: ['adventure', 'culture', 'food', 'nature', 'wellness', 'water', 'nightlife', 'tickets'],
    blockedCategories: [],
  },
  london: {
    name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278,
    isCoastal: false, isLakeRegion: false, isMountainRegion: false, isDesert: false, isIsland: true,
    allowedCategories: ['adventure', 'culture', 'food', 'nature', 'wellness', 'nightlife', 'tickets'],
    blockedCategories: ['water'],
  },
  sydney: {
    name: 'Sydney', country: 'Australia', lat: -33.8688, lon: 151.2093,
    isCoastal: true, isLakeRegion: false, isMountainRegion: false, isDesert: false, isIsland: false,
    allowedCategories: ['adventure', 'culture', 'food', 'nature', 'wellness', 'water', 'nightlife', 'tickets'],
    blockedCategories: [],
  },
  cusco: {
    name: 'Cusco', country: 'Peru', lat: -13.532, lon: -71.9675,
    isCoastal: false, isLakeRegion: false, isMountainRegion: true, isDesert: false, isIsland: false,
    allowedCategories: ['adventure', 'culture', 'food', 'nature', 'wellness', 'tickets'],
    blockedCategories: ['water', 'nightlife'],
  },
  cancun: {
    name: 'Cancun', country: 'Mexico', lat: 21.1619, lon: -86.8515,
    isCoastal: true, isLakeRegion: false, isMountainRegion: false, isDesert: false, isIsland: false,
    allowedCategories: ['adventure', 'culture', 'food', 'nature', 'wellness', 'water', 'nightlife', 'tickets'],
    blockedCategories: [],
  },
  new_york: {
    name: 'New York', country: 'USA', lat: 40.7128, lon: -74.006,
    isCoastal: true, isLakeRegion: false, isMountainRegion: false, isDesert: false, isIsland: false,
    allowedCategories: ['adventure', 'culture', 'food', 'nature', 'wellness', 'water', 'nightlife', 'tickets'],
    blockedCategories: [],
  },
  istanbul: {
    name: 'Istanbul', country: 'Turkey', lat: 41.0082, lon: 28.9784,
    isCoastal: true, isLakeRegion: false, isMountainRegion: false, isDesert: false, isIsland: false,
    allowedCategories: ['adventure', 'culture', 'food', 'nature', 'wellness', 'water', 'nightlife', 'tickets'],
    blockedCategories: [],
  },
  amsterdam: {
    name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lon: 4.9041,
    isCoastal: true, isLakeRegion: true, isMountainRegion: false, isDesert: false, isIsland: false,
    allowedCategories: ['adventure', 'culture', 'food', 'nature', 'wellness', 'water', 'nightlife', 'tickets'],
    blockedCategories: [],
  },
  singapore: {
    name: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198,
    isCoastal: true, isLakeRegion: false, isMountainRegion: false, isDesert: false, isIsland: true,
    allowedCategories: ['adventure', 'culture', 'food', 'nature', 'wellness', 'water', 'nightlife', 'tickets'],
    blockedCategories: [],
  },
  seoul: {
    name: 'Seoul', country: 'South Korea', lat: 37.5665, lon: 126.978,
    isCoastal: false, isLakeRegion: false, isMountainRegion: true, isDesert: false, isIsland: false,
    allowedCategories: ['adventure', 'culture', 'food', 'nature', 'wellness', 'nightlife', 'tickets'],
    blockedCategories: ['water'],
  },
  dublin: {
    name: 'Dublin', country: 'Ireland', lat: 53.3498, lon: -6.2603,
    isCoastal: true, isLakeRegion: false, isMountainRegion: false, isDesert: false, isIsland: true,
    allowedCategories: ['adventure', 'culture', 'food', 'nature', 'wellness', 'water', 'nightlife', 'tickets'],
    blockedCategories: [],
  },
  lima: {
    name: 'Lima', country: 'Peru', lat: -12.0464, lon: -77.0428,
    isCoastal: true, isLakeRegion: false, isMountainRegion: false, isDesert: true, isIsland: false,
    allowedCategories: ['adventure', 'culture', 'food', 'nature', 'wellness', 'water', 'nightlife', 'tickets'],
    blockedCategories: [],
  },
};

export function getCityGeoProfile(cityName: string): CityGeoProfile | null {
  const key = cityName.toLowerCase().replace(/\s+/g, '_');
  return CITY_GEO_PROFILES[key] ?? null;
}

export function isCategoryAllowedForCity(
  category: ActivityCategory,
  cityName: string,
): boolean {
  const profile = getCityGeoProfile(cityName);
  if (!profile) {
    return applyGenericCategoryRules(category);
  }

  if (profile.blockedCategories.includes(category)) {
    console.log(`[LocationValidation] Category "${category}" blocked for "${cityName}"`);
    return false;
  }

  if (category === 'water') {
    const allowed = profile.isCoastal || profile.isLakeRegion || profile.isIsland;
    if (!allowed) {
      console.log(`[LocationValidation] Water activities not allowed in inland city "${cityName}"`);
    }
    return allowed;
  }

  return true;
}

function applyGenericCategoryRules(category: ActivityCategory): boolean {
  if (category === 'water') {
    return false;
  }
  return true;
}

export function getValidCategoriesForCity(cityName: string): ActivityCategory[] {
  const allCategories: ActivityCategory[] = ['adventure', 'culture', 'food', 'nature', 'wellness', 'water', 'nightlife', 'tickets'];
  return allCategories.filter(cat => isCategoryAllowedForCity(cat, cityName));
}

export function cityMatchesOffer(
  offerCity: string,
  selectedCity: string,
): boolean {
  const normalizedOffer = offerCity.toLowerCase().trim();
  const normalizedSelected = selectedCity.toLowerCase().trim();

  if (normalizedOffer === normalizedSelected) return true;
  if (normalizedOffer.includes(normalizedSelected)) return true;
  if (normalizedSelected.includes(normalizedOffer)) return true;

  return false;
}

export function isWithinRadiusKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  maxKm: number,
): boolean {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance <= maxKm;
}

export function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export { CITY_GEO_PROFILES };
export type { CityGeoProfile as CityProfile };
