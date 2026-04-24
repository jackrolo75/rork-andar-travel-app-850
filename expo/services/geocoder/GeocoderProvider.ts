import { ResolvedPlace, GeoCoordinates, GeoBoundingBox } from '@/types/activities';

export interface GeocoderProvider {
  name: string;
  resolve(input: string): Promise<ResolvedPlace | null>;
  reverseGeocode?(coords: GeoCoordinates): Promise<ResolvedPlace | null>;
}

export interface GeocoderConfig {
  provider: 'static' | 'osm' | 'mapbox' | 'google';
  apiKey?: string;
  fallbackToStatic?: boolean;
  cacheEnabled?: boolean;
  cacheTtlMs?: number;
}

const DEFAULT_CONFIG: GeocoderConfig = {
  provider: 'static',
  fallbackToStatic: true,
  cacheEnabled: true,
  cacheTtlMs: 1000 * 60 * 60,
};

interface CacheEntry {
  place: ResolvedPlace | null;
  expiresAt: number;
}

const geocodeCache = new Map<string, CacheEntry>();

export function clearGeocoderCache(): void {
  geocodeCache.clear();
  console.log('[Geocoder] Cache cleared');
}

function getCached(key: string, _ttlMs: number): ResolvedPlace | null | undefined {
  const entry = geocodeCache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    geocodeCache.delete(key);
    return undefined;
  }
  return entry.place;
}

function setCache(key: string, place: ResolvedPlace | null, ttlMs: number): void {
  geocodeCache.set(key, { place, expiresAt: Date.now() + ttlMs });
}

export function createGeocoderPipeline(
  providers: GeocoderProvider[],
  config: Partial<GeocoderConfig> = {},
): {
  resolve: (input: string) => Promise<ResolvedPlace | null>;
} {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  return {
    resolve: async (input: string): Promise<ResolvedPlace | null> => {
      const normalized = input.toLowerCase().trim();
      if (!normalized) return null;

      if (cfg.cacheEnabled) {
        const cached = getCached(normalized, cfg.cacheTtlMs ?? 3600000);
        if (cached !== undefined) {
          console.log(`[Geocoder] Cache hit for "${input}"`);
          return cached;
        }
      }

      for (const provider of providers) {
        try {
          console.log(`[Geocoder] Trying provider "${provider.name}" for "${input}"`);
          const result = await provider.resolve(input);
          if (result) {
            console.log(`[Geocoder] Resolved via "${provider.name}": ${result.displayName} (${result.placeId})`);
            if (cfg.cacheEnabled) {
              setCache(normalized, result, cfg.cacheTtlMs ?? 3600000);
            }
            return result;
          }
        } catch (err) {
          console.error(`[Geocoder] Provider "${provider.name}" error:`, err);
        }
      }

      console.log(`[Geocoder] No provider resolved "${input}"`);
      if (cfg.cacheEnabled) {
        setCache(normalized, null, cfg.cacheTtlMs ?? 3600000);
      }
      return null;
    },
  };
}

export function expandBbox(bbox: GeoBoundingBox, radiusKm: number): GeoBoundingBox {
  const degPerKm = 1 / 111.32;
  const latExpand = radiusKm * degPerKm;
  const midLat = (bbox.north + bbox.south) / 2;
  const lonExpand = radiusKm * (degPerKm / Math.cos((midLat * Math.PI) / 180));

  return {
    north: bbox.north + latExpand,
    south: bbox.south - latExpand,
    east: bbox.east + lonExpand,
    west: bbox.west - lonExpand,
  };
}
