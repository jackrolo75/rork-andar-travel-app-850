import {
  ActivityOffer,
  ResolvedPlace,
  GeoBoundingBox,
  GeoCoordinates,
} from '@/types/activities';

const EARTH_RADIUS_KM = 6371;

export function haversineDistance(
  point1: GeoCoordinates,
  point2: GeoCoordinates,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lon - point1.lon);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
      Math.cos(toRad(point2.lat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

export function isInsideBbox(
  point: GeoCoordinates,
  bbox: GeoBoundingBox,
): boolean {
  return (
    point.lat >= bbox.south &&
    point.lat <= bbox.north &&
    point.lon >= bbox.west &&
    point.lon <= bbox.east
  );
}

export function matchesAdminFields(
  offer: ActivityOffer,
  place: ResolvedPlace,
): boolean {
  const offerCity = offer.city.toLowerCase().trim();
  const offerCountry = offer.country.toLowerCase().trim();
  const placeName = place.name.toLowerCase().trim();
  const placeCountry = place.country.toLowerCase().trim();
  const placeAdmin = place.adminRegion?.toLowerCase().trim() || '';

  if (offerCity === placeName) return true;
  if (offerCity.includes(placeName) || placeName.includes(offerCity)) return true;
  if (placeAdmin && offerCity === placeAdmin) return true;
  if (place.type === 'country' && offerCountry === placeCountry) return true;

  return false;
}

interface GeoFilterResult {
  offer: ActivityOffer;
  distanceKm: number;
  matchMethod: 'bbox' | 'radius' | 'admin_match' | 'name_match';
  confidenceScore: number;
}

export function geoFilterOffers(
  offers: ActivityOffer[],
  place: ResolvedPlace,
  strictLocation: boolean,
  radiusKm: number,
): GeoFilterResult[] {
  console.log(
    `[GeoFilter] Filtering ${offers.length} offers for "${place.displayName}" | strict=${strictLocation} radius=${radiusKm}km`,
  );

  const results: GeoFilterResult[] = [];

  for (const offer of offers) {
    const geo = offer.geo;

    if (geo && geo.lat !== undefined && geo.lon !== undefined) {
      const offerPoint: GeoCoordinates = { lat: geo.lat, lon: geo.lon };
      const distance = haversineDistance(place.centroid, offerPoint);

      const inBbox = isInsideBbox(offerPoint, place.bbox);

      if (inBbox) {
        results.push({
          offer: {
            ...offer,
            geo: {
              ...geo,
              distanceToPlaceKm: Math.round(distance * 10) / 10,
              matchMethod: 'bbox',
              confidenceScore: 0.95,
            },
          },
          distanceKm: distance,
          matchMethod: 'bbox',
          confidenceScore: 0.95,
        });
        continue;
      }

      if (distance <= radiusKm) {
        results.push({
          offer: {
            ...offer,
            geo: {
              ...geo,
              distanceToPlaceKm: Math.round(distance * 10) / 10,
              matchMethod: 'radius',
              confidenceScore: Math.max(0.5, 1 - distance / radiusKm),
            },
          },
          distanceKm: distance,
          matchMethod: 'radius',
          confidenceScore: Math.max(0.5, 1 - distance / radiusKm),
        });
        continue;
      }

      if (!strictLocation) {
        results.push({
          offer: {
            ...offer,
            geo: {
              ...geo,
              distanceToPlaceKm: Math.round(distance * 10) / 10,
              matchMethod: 'radius',
              confidenceScore: 0.3,
            },
          },
          distanceKm: distance,
          matchMethod: 'radius',
          confidenceScore: 0.3,
        });
        continue;
      }
    } else {
      const adminMatch = matchesAdminFields(offer, place);

      if (adminMatch) {
        const estimatedDistance = 5 + Math.random() * 10;
        results.push({
          offer: {
            ...offer,
            geo: {
              lat: place.centroid.lat + (Math.random() - 0.5) * 0.05,
              lon: place.centroid.lon + (Math.random() - 0.5) * 0.05,
              distanceToPlaceKm: Math.round(estimatedDistance * 10) / 10,
              matchMethod: 'admin_match',
              confidenceScore: 0.7,
            },
          },
          distanceKm: estimatedDistance,
          matchMethod: 'admin_match',
          confidenceScore: 0.7,
        });
        continue;
      }

      if (!strictLocation) {
        results.push({
          offer: {
            ...offer,
            geo: {
              lat: place.centroid.lat,
              lon: place.centroid.lon,
              distanceToPlaceKm: undefined,
              matchMethod: 'name_match',
              confidenceScore: 0.4,
            },
          },
          distanceKm: 999,
          matchMethod: 'name_match',
          confidenceScore: 0.4,
        });
      }
    }
  }

  if (strictLocation) {
    const filtered = results.filter(
      (r) => r.distanceKm <= radiusKm || r.matchMethod === 'bbox' || r.matchMethod === 'admin_match',
    );
    console.log(
      `[GeoFilter] Strict mode: ${filtered.length}/${offers.length} offers passed (radius=${radiusKm}km)`,
    );

    filtered.forEach((r) => {
      console.log(
        `[GeoFilter] ✓ ${r.offer.title} | distance=${r.distanceKm.toFixed(1)}km method=${r.matchMethod} confidence=${r.confidenceScore.toFixed(2)}`,
      );
    });

    return filtered;
  }

  console.log(
    `[GeoFilter] Relaxed mode: ${results.length}/${offers.length} offers returned`,
  );

  return results.sort((a, b) => a.distanceKm - b.distanceKm);
}

export function enrichOfferWithDistance(
  offer: ActivityOffer,
  place: ResolvedPlace,
): ActivityOffer {
  if (!offer.geo || offer.geo.lat === undefined) return offer;

  const distance = haversineDistance(place.centroid, {
    lat: offer.geo.lat,
    lon: offer.geo.lon,
  });

  return {
    ...offer,
    geo: {
      ...offer.geo,
      distanceToPlaceKm: Math.round(distance * 10) / 10,
    },
  };
}
