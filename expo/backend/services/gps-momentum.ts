import { GPSLocation, GPSMomentum } from '@/types';

interface RouteGeometry {
  routeId: string;
  coordinates: { lat: number; lng: number }[];
  totalDistance: number;
}

export class GPSMomentumService {
  private momentumCache: Map<string, GPSMomentum> = new Map();
  private routeGeometries: Map<string, RouteGeometry> = new Map();

  constructor() {
    this.initializeRouteGeometries();
  }

  private initializeRouteGeometries(): void {
    this.routeGeometries.set('route_001', {
      routeId: 'route_001',
      coordinates: [
        { lat: -12.0464, lng: -77.0428 },
        { lat: -12.5, lng: -76.5 },
        { lat: -13.0, lng: -76.0 },
        { lat: -13.5319, lng: -71.9675 },
      ],
      totalDistance: 1100,
    });

    this.routeGeometries.set('route_002', {
      routeId: 'route_002',
      coordinates: [
        { lat: 4.711, lng: -74.0721 },
        { lat: 3.5, lng: -73.5 },
        { lat: 3.0, lng: -73.0 },
        { lat: 2.4448, lng: -76.6147 },
      ],
      totalDistance: 450,
    });

    console.log('🗺️ GPS Momentum: Initialized route geometries');
  }

  updateLocation(routeId: string, location: GPSLocation): GPSMomentum {
    console.log('📍 GPS Momentum: Updating location', {
      routeId,
      lat: location.latitude,
      lng: location.longitude,
    });

    const previousMomentum = this.momentumCache.get(routeId);

    if (!previousMomentum) {
      const initialMomentum: GPSMomentum = {
        velocity: 0,
        heading: 0,
        lastKnownLocation: location,
        isEstimated: false,
      };

      this.momentumCache.set(routeId, initialMomentum);
      console.log('📌 First location recorded for route', routeId);
      return initialMomentum;
    }

    const velocity = this.calculateVelocity(previousMomentum.lastKnownLocation, location);
    const heading = this.calculateHeading(previousMomentum.lastKnownLocation, location);

    const momentum: GPSMomentum = {
      velocity,
      heading,
      lastKnownLocation: location,
      isEstimated: false,
    };

    this.momentumCache.set(routeId, momentum);

    console.log('✅ GPS Momentum updated', {
      velocity: `${velocity.toFixed(2)} km/h`,
      heading: `${heading.toFixed(2)}°`,
    });

    return momentum;
  }

  predictLocation(routeId: string, elapsedSeconds: number): GPSLocation | null {
    const momentum = this.momentumCache.get(routeId);

    if (!momentum || momentum.velocity === 0) {
      console.log('⚠️ GPS Momentum: Cannot predict - no velocity data');
      return null;
    }

    const routeGeometry = this.routeGeometries.get(routeId);

    if (!routeGeometry) {
      return this.simplePrediction(momentum, elapsedSeconds);
    }

    return this.geometryBasedPrediction(momentum, routeGeometry, elapsedSeconds);
  }

  private simplePrediction(momentum: GPSMomentum, elapsedSeconds: number): GPSLocation {
    const distanceKm = (momentum.velocity * elapsedSeconds) / 3600;
    const distanceDegrees = distanceKm / 111.32;

    const headingRad = (momentum.heading * Math.PI) / 180;

    const deltaLat = distanceDegrees * Math.cos(headingRad);
    const deltaLng = distanceDegrees * Math.sin(headingRad);

    const accuracyDegradation = elapsedSeconds * 2;
    const cappedAccuracy = Math.min(momentum.lastKnownLocation.accuracy + accuracyDegradation, 500);
    
    const predictedLocation: GPSLocation = {
      latitude: momentum.lastKnownLocation.latitude + deltaLat,
      longitude: momentum.lastKnownLocation.longitude + deltaLng,
      accuracy: cappedAccuracy,
      timestamp: new Date().toISOString(),
    };

    console.log('🔮 Simple prediction calculated', {
      elapsed: `${elapsedSeconds}s`,
      distance: `${distanceKm.toFixed(2)} km`,
      predicted: `${predictedLocation.latitude.toFixed(4)}, ${predictedLocation.longitude.toFixed(4)}`,
    });

    return predictedLocation;
  }

  private geometryBasedPrediction(
    momentum: GPSMomentum,
    geometry: RouteGeometry,
    elapsedSeconds: number
  ): GPSLocation {
    const distanceKm = (momentum.velocity * elapsedSeconds) / 3600;

    const currentSegment = this.findNearestSegment(
      momentum.lastKnownLocation,
      geometry.coordinates
    );

    if (!currentSegment) {
      return this.simplePrediction(momentum, elapsedSeconds);
    }

    const predictedPoint = this.projectAlongRoute(
      currentSegment.start,
      currentSegment.end,
      distanceKm
    );

    const accuracyDegradation = elapsedSeconds * 1.5;
    const cappedAccuracy = Math.min(momentum.lastKnownLocation.accuracy + accuracyDegradation, 500);
    
    const predictedLocation: GPSLocation = {
      latitude: predictedPoint.lat,
      longitude: predictedPoint.lng,
      accuracy: cappedAccuracy,
      timestamp: new Date().toISOString(),
    };

    console.log('🗺️ Geometry-based prediction calculated', {
      elapsed: `${elapsedSeconds}s`,
      distance: `${distanceKm.toFixed(2)} km`,
      segment: currentSegment.index,
      predicted: `${predictedLocation.latitude.toFixed(4)}, ${predictedLocation.longitude.toFixed(4)}`,
    });

    return predictedLocation;
  }

  private findNearestSegment(
    location: GPSLocation,
    coordinates: { lat: number; lng: number }[]
  ): { start: { lat: number; lng: number }; end: { lat: number; lng: number }; index: number } | null {
    let minDistance = Infinity;
    let nearestSegment = null;

    for (let i = 0; i < coordinates.length - 1; i++) {
      const distance = this.distanceToSegment(location, coordinates[i], coordinates[i + 1]);

      if (distance < minDistance) {
        minDistance = distance;
        nearestSegment = {
          start: coordinates[i],
          end: coordinates[i + 1],
          index: i,
        };
      }
    }

    return nearestSegment;
  }

  private distanceToSegment(
    point: GPSLocation,
    start: { lat: number; lng: number },
    end: { lat: number; lng: number }
  ): number {
    const distToStart = this.haversineDistance(point.latitude, point.longitude, start.lat, start.lng);
    const distToEnd = this.haversineDistance(point.latitude, point.longitude, end.lat, end.lng);
    return Math.min(distToStart, distToEnd);
  }

  private projectAlongRoute(
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    distanceKm: number
  ): { lat: number; lng: number } {
    const segmentDistance = this.haversineDistance(start.lat, start.lng, end.lat, end.lng);
    const ratio = Math.min(distanceKm / segmentDistance, 1);

    return {
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio,
    };
  }

  private calculateVelocity(prev: GPSLocation, current: GPSLocation): number {
    const distance = this.haversineDistance(
      prev.latitude,
      prev.longitude,
      current.latitude,
      current.longitude
    );

    const timeDiffMs = new Date(current.timestamp).getTime() - new Date(prev.timestamp).getTime();
    const timeDiffHours = timeDiffMs / (1000 * 60 * 60);

    if (timeDiffHours === 0) return 0;

    const velocity = distance / timeDiffHours;

    return Math.max(0, Math.min(velocity, 150));
  }

  private calculateHeading(prev: GPSLocation, current: GPSLocation): number {
    const lat1 = (prev.latitude * Math.PI) / 180;
    const lat2 = (current.latitude * Math.PI) / 180;
    const dLng = ((current.longitude - prev.longitude) * Math.PI) / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    const heading = (Math.atan2(y, x) * 180) / Math.PI;

    return (heading + 360) % 360;
  }

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  getMomentum(routeId: string): GPSMomentum | null {
    return this.momentumCache.get(routeId) || null;
  }

  clearRoute(routeId: string): void {
    console.log('🗑️ GPS Momentum: Clearing route', routeId);
    this.momentumCache.delete(routeId);
  }
}

export const gpsMomentum = new GPSMomentumService();
