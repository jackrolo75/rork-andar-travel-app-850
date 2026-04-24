import { ResolvedPlace, GeoCoordinates } from '@/types/activities';
import {
  resolvePlace as geocoderResolve,
  getStaticPlaceNames,
} from '@/services/geocoder';

const DEFAULT_CITY_RADIUS_KM = 50;

export function resolvePlace(input: string): ResolvedPlace | null {
  return resolvePlaceSync(input);
}

export async function resolvePlaceAsync(input: string): Promise<ResolvedPlace | null> {
  console.log(`[Geocoding] Async resolving place: "${input}"`);
  return geocoderResolve(input);
}

export function resolvePlaceSync(input: string): ResolvedPlace | null {
  const normalized = input.toLowerCase().trim();
  console.log(`[Geocoding] Sync resolving place: "${input}"`);

  const KNOWN_PLACES: Record<string, { name: string; displayName: string; centroid: GeoCoordinates; bbox: { north: number; south: number; east: number; west: number }; country: string; adminRegion?: string; type: 'city' | 'region' | 'country' }> = {
    bangkok: { name: 'Bangkok', displayName: 'Bangkok, Thailand', centroid: { lat: 13.7563, lon: 100.5018 }, bbox: { north: 13.9553, south: 13.4936, east: 100.9385, west: 100.3279 }, country: 'Thailand', adminRegion: 'Bangkok', type: 'city' },
    bali: { name: 'Bali', displayName: 'Bali, Indonesia', centroid: { lat: -8.4095, lon: 115.1889 }, bbox: { north: -8.0606, south: -8.8517, east: 115.7126, west: 114.4314 }, country: 'Indonesia', adminRegion: 'Bali', type: 'region' },
    tokyo: { name: 'Tokyo', displayName: 'Tokyo, Japan', centroid: { lat: 35.6762, lon: 139.6503 }, bbox: { north: 35.8984, south: 35.5192, east: 139.9200, west: 139.5103 }, country: 'Japan', adminRegion: 'Tokyo', type: 'city' },
    singapore: { name: 'Singapore', displayName: 'Singapore', centroid: { lat: 1.3521, lon: 103.8198 }, bbox: { north: 1.4784, south: 1.1496, east: 104.0885, west: 103.6003 }, country: 'Singapore', type: 'city' },
    paris: { name: 'Paris', displayName: 'Paris, France', centroid: { lat: 48.8566, lon: 2.3522 }, bbox: { north: 48.9022, south: 48.8155, east: 2.4699, west: 2.2241 }, country: 'France', adminRegion: 'Île-de-France', type: 'city' },
    london: { name: 'London', displayName: 'London, United Kingdom', centroid: { lat: 51.5074, lon: -0.1278 }, bbox: { north: 51.6919, south: 51.2867, east: 0.3340, west: -0.5103 }, country: 'United Kingdom', adminRegion: 'Greater London', type: 'city' },
    dubai: { name: 'Dubai', displayName: 'Dubai, UAE', centroid: { lat: 25.2048, lon: 55.2708 }, bbox: { north: 25.3585, south: 24.7921, east: 55.5644, west: 54.8904 }, country: 'UAE', adminRegion: 'Dubai', type: 'city' },
    sydney: { name: 'Sydney', displayName: 'Sydney, Australia', centroid: { lat: -33.8688, lon: 151.2093 }, bbox: { north: -33.5781, south: -34.1183, east: 151.3430, west: 150.5209 }, country: 'Australia', adminRegion: 'New South Wales', type: 'city' },
    seoul: { name: 'Seoul', displayName: 'Seoul, South Korea', centroid: { lat: 37.5665, lon: 126.978 }, bbox: { north: 37.7015, south: 37.4133, east: 127.1835, west: 126.7643 }, country: 'South Korea', adminRegion: 'Seoul', type: 'city' },
    barcelona: { name: 'Barcelona', displayName: 'Barcelona, Spain', centroid: { lat: 41.3874, lon: 2.1686 }, bbox: { north: 41.4695, south: 41.3200, east: 2.2280, west: 2.0525 }, country: 'Spain', adminRegion: 'Catalonia', type: 'city' },
    dublin: { name: 'Dublin', displayName: 'Dublin, Ireland', centroid: { lat: 53.3498, lon: -6.2603 }, bbox: { north: 53.4114, south: 53.2988, east: -6.1119, west: -6.4301 }, country: 'Ireland', adminRegion: 'Leinster', type: 'city' },
    lisbon: { name: 'Lisbon', displayName: 'Lisbon, Portugal', centroid: { lat: 38.7223, lon: -9.1393 }, bbox: { north: 38.7955, south: 38.6916, east: -9.0870, west: -9.2298 }, country: 'Portugal', adminRegion: 'Lisbon', type: 'city' },
    rome: { name: 'Rome', displayName: 'Rome, Italy', centroid: { lat: 41.9028, lon: 12.4964 }, bbox: { north: 42.0000, south: 41.7700, east: 12.8558, west: 12.2346 }, country: 'Italy', adminRegion: 'Lazio', type: 'city' },
    'new york': { name: 'New York', displayName: 'New York, USA', centroid: { lat: 40.7128, lon: -74.006 }, bbox: { north: 40.9176, south: 40.4774, east: -73.7004, west: -74.2591 }, country: 'USA', adminRegion: 'New York', type: 'city' },
    lima: { name: 'Lima', displayName: 'Lima, Peru', centroid: { lat: -12.0464, lon: -77.0428 }, bbox: { north: -11.7500, south: -12.3500, east: -76.6000, west: -77.2000 }, country: 'Peru', adminRegion: 'Lima', type: 'city' },
    cusco: { name: 'Cusco', displayName: 'Cusco, Peru', centroid: { lat: -13.532, lon: -71.9675 }, bbox: { north: -13.4800, south: -13.5900, east: -71.9100, west: -72.0300 }, country: 'Peru', adminRegion: 'Cusco', type: 'city' },
  };

  const direct = KNOWN_PLACES[normalized];
  if (direct) {
    return {
      placeId: `place_${normalized.replace(/\s+/g, '_')}`,
      name: direct.name,
      displayName: direct.displayName,
      centroid: direct.centroid,
      bbox: direct.bbox,
      country: direct.country,
      adminRegion: direct.adminRegion,
      type: direct.type,
    };
  }

  for (const [key, place] of Object.entries(KNOWN_PLACES)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return {
        placeId: `place_${key.replace(/\s+/g, '_')}`,
        name: place.name,
        displayName: place.displayName,
        centroid: place.centroid,
        bbox: place.bbox,
        country: place.country,
        adminRegion: place.adminRegion,
        type: place.type,
      };
    }
  }

  const hash = Array.from(normalized).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const lat = ((hash % 180) - 90) * 0.5;
  const lon = ((hash % 360) - 180) * 0.5;

  return {
    placeId: `place_approx_${normalized.replace(/\s+/g, '_')}`,
    name: input,
    displayName: input,
    centroid: { lat, lon },
    bbox: { north: lat + 0.15, south: lat - 0.15, east: lon + 0.15, west: lon - 0.15 },
    country: 'Unknown',
    type: 'city',
  };
}

export function getDefaultRadiusKm(): number {
  return DEFAULT_CITY_RADIUS_KM;
}

export function getStaticMapUrl(_centroid: GeoCoordinates, _zoom: number = 12): string {
  return `https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=200&fit=crop`;
}

export function getKnownPlaceNames(): string[] {
  return getStaticPlaceNames();
}
