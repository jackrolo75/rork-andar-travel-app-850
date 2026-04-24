import { FlightOffer, FlightSearchParams } from './duffel-client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const CACHE_DURATION_MS = 5 * 60 * 1000;

class DuffelCacheService {
  private flightCache: Map<string, CacheEntry<FlightOffer[]>> = new Map();
  private offerCache: Map<string, CacheEntry<FlightOffer>> = new Map();

  private generateFlightSearchKey(params: FlightSearchParams): string {
    return `flights:${params.origin}:${params.destination}:${params.departureDate}:${params.passengers}:${params.cabinClass || 'economy'}`;
  }

  cacheFlightSearch(params: FlightSearchParams, flights: FlightOffer[]): void {
    const key = this.generateFlightSearchKey(params);
    const now = Date.now();
    
    this.flightCache.set(key, {
      data: flights,
      timestamp: now,
      expiresAt: now + CACHE_DURATION_MS,
    });

    console.log(`✅ Cached ${flights.length} flights for key: ${key}`);
  }

  getCachedFlightSearch(params: FlightSearchParams): FlightOffer[] | null {
    const key = this.generateFlightSearchKey(params);
    const cached = this.flightCache.get(key);

    if (!cached) {
      console.log(`❌ Cache miss for: ${key}`);
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      console.log(`⏰ Cache expired for: ${key}`);
      this.flightCache.delete(key);
      return null;
    }

    console.log(`✅ Cache hit for: ${key}`);
    return cached.data;
  }

  cacheOffer(offerId: string, offer: FlightOffer): void {
    const now = Date.now();
    
    this.offerCache.set(offerId, {
      data: offer,
      timestamp: now,
      expiresAt: now + CACHE_DURATION_MS,
    });

    console.log(`✅ Cached offer: ${offerId}`);
  }

  getCachedOffer(offerId: string): FlightOffer | null {
    const cached = this.offerCache.get(offerId);

    if (!cached) {
      console.log(`❌ Offer cache miss: ${offerId}`);
      return null;
    }

    if (Date.now() > cached.expiresAt) {
      console.log(`⏰ Offer cache expired: ${offerId}`);
      this.offerCache.delete(offerId);
      return null;
    }

    console.log(`✅ Offer cache hit: ${offerId}`);
    return cached.data;
  }

  clearExpired(): number {
    const now = Date.now();
    let cleared = 0;

    for (const [key, entry] of this.flightCache.entries()) {
      if (now > entry.expiresAt) {
        this.flightCache.delete(key);
        cleared++;
      }
    }

    for (const [key, entry] of this.offerCache.entries()) {
      if (now > entry.expiresAt) {
        this.offerCache.delete(key);
        cleared++;
      }
    }

    if (cleared > 0) {
      console.log(`🧹 Cleared ${cleared} expired cache entries`);
    }

    return cleared;
  }

  clearAll(): void {
    this.flightCache.clear();
    this.offerCache.clear();
    console.log('🧹 All caches cleared');
  }

  getCacheStats() {
    return {
      flightSearches: this.flightCache.size,
      offers: this.offerCache.size,
      total: this.flightCache.size + this.offerCache.size,
    };
  }
}

export const duffelCache = new DuffelCacheService();

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    duffelCache.clearExpired();
  }, 60 * 1000);
}
