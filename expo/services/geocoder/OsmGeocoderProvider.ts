import { ResolvedPlace } from '@/types/activities';
import { GeocoderProvider } from './GeocoderProvider';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

interface NominatimResult {
  place_id: number;
  osm_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string];
  type: string;
  class: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

function inferPlaceType(result: NominatimResult): 'city' | 'region' | 'country' {
  if (result.type === 'country' || result.class === 'boundary') {
    if (result.address?.country && !result.address?.city && !result.address?.state) {
      return 'country';
    }
  }
  if (result.type === 'state' || result.type === 'administrative') {
    return 'region';
  }
  return 'city';
}

export class OsmGeocoderProvider implements GeocoderProvider {
  name = 'osm';

  async resolve(input: string): Promise<ResolvedPlace | null> {
    const encoded = encodeURIComponent(input.trim());
    const url = `${NOMINATIM_BASE}/search?q=${encoded}&format=json&limit=1&addressdetails=1&accept-language=en`;

    console.log(`[OSM Geocoder] Fetching: ${url}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'AndarTravel/1.0 (contact@andartravel.com)',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        console.error(`[OSM Geocoder] HTTP ${res.status}`);
        return null;
      }

      const results: NominatimResult[] = await res.json();
      if (!results || results.length === 0) {
        console.log(`[OSM Geocoder] No results for "${input}"`);
        return null;
      }

      const top = results[0];
      const lat = parseFloat(top.lat);
      const lon = parseFloat(top.lon);
      const [south, north, west, east] = top.boundingbox.map(Number);
      const placeType = inferPlaceType(top);

      const cityName =
        top.address?.city || top.address?.town || top.address?.village || input;

      return {
        placeId: `osm_${top.osm_id}`,
        name: cityName,
        displayName: top.display_name.split(',').slice(0, 3).join(',').trim(),
        centroid: { lat, lon },
        bbox: { north, south, east, west },
        country: top.address?.country || 'Unknown',
        adminRegion: top.address?.state,
        type: placeType,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        console.warn('[OSM Geocoder] Request timed out');
      } else {
        console.error('[OSM Geocoder] Error:', err);
      }
      return null;
    }
  }
}
