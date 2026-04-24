export { createGeocoderPipeline, expandBbox, clearGeocoderCache } from './GeocoderProvider';
export type { GeocoderProvider, GeocoderConfig } from './GeocoderProvider';
export { StaticGeocoderProvider, ApproximateGeocoderProvider, getStaticPlaceNames } from './StaticGeocoderProvider';
export { OsmGeocoderProvider } from './OsmGeocoderProvider';

import { createGeocoderPipeline } from './GeocoderProvider';
import { StaticGeocoderProvider, ApproximateGeocoderProvider } from './StaticGeocoderProvider';
import { OsmGeocoderProvider } from './OsmGeocoderProvider';
import { ResolvedPlace } from '@/types/activities';

let defaultPipeline: { resolve: (input: string) => Promise<ResolvedPlace | null> } | null = null;

export function getDefaultGeocoder(): { resolve: (input: string) => Promise<ResolvedPlace | null> } {
  if (!defaultPipeline) {
    defaultPipeline = createGeocoderPipeline(
      [
        new StaticGeocoderProvider(),
        new OsmGeocoderProvider(),
        new ApproximateGeocoderProvider(),
      ],
      { cacheEnabled: true, cacheTtlMs: 1000 * 60 * 30 },
    );
  }
  return defaultPipeline;
}

export async function resolvePlace(input: string): Promise<ResolvedPlace | null> {
  return getDefaultGeocoder().resolve(input);
}
