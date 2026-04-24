import { YieldAdjustment, YieldContext, RouteHistoricalData } from '../types';
import { globalCurrencyConverter } from './currency-converter';

const HISTORICAL_DEMAND_DATA: Map<string, RouteHistoricalData> = new Map([
  ['Lima-Cusco', { routeKey: 'Lima-Cusco', averageBookingRate: 0.82, peakDemandMultiplier: 1.35, lastUpdated: '2026-01-10' }],
  ['Lima-Arequipa', { routeKey: 'Lima-Arequipa', averageBookingRate: 0.71, peakDemandMultiplier: 1.25, lastUpdated: '2026-01-10' }],
  ['Bogotá-Medellín', { routeKey: 'Bogotá-Medellín', averageBookingRate: 0.88, peakDemandMultiplier: 1.42, lastUpdated: '2026-01-10' }],
  ['Quito-Guayaquil', { routeKey: 'Quito-Guayaquil', averageBookingRate: 0.79, peakDemandMultiplier: 1.30, lastUpdated: '2026-01-10' }],
  ['Buenos Aires-Mendoza', { routeKey: 'Buenos Aires-Mendoza', averageBookingRate: 0.65, peakDemandMultiplier: 1.18, lastUpdated: '2026-01-10' }],
  ['Santiago-Valparaíso', { routeKey: 'Santiago-Valparaíso', averageBookingRate: 0.73, peakDemandMultiplier: 1.22, lastUpdated: '2026-01-10' }],
  ['La Paz-Cochabamba', { routeKey: 'La Paz-Cochabamba', averageBookingRate: 0.69, peakDemandMultiplier: 1.28, lastUpdated: '2026-01-10' }],
]);

const ARS_VOLATILITY_HISTORY = [
  { date: '2026-01-10', rate: 1050.25, volatilityIndex: 0.18 },
  { date: '2026-01-09', rate: 1038.50, volatilityIndex: 0.22 },
  { date: '2026-01-08', rate: 1015.00, volatilityIndex: 0.25 },
];

interface PriceAuditLog {
  auditId: string;
  routeId: string;
  timestamp: string;
  originalPrice: number;
  adjustedPrice: number;
  modifiers: {
    historicalDemand: number;
    seatAvailability: number;
    currencyVolatility: number;
  };
  reasoning: string;
  context: YieldContext;
}

class AuditLogger {
  private logs: PriceAuditLog[] = [];

  log(adjustment: YieldAdjustment, context: YieldContext): void {
    const auditEntry: PriceAuditLog = {
      auditId: adjustment.auditId,
      routeId: adjustment.routeId,
      timestamp: adjustment.timestamp,
      originalPrice: adjustment.originalPrice,
      adjustedPrice: adjustment.adjustedPrice,
      modifiers: adjustment.modifiers,
      reasoning: adjustment.reasoning,
      context,
    };

    this.logs.push(auditEntry);
    
    console.log('📊 YIELD AUDIT LOG:', {
      auditId: auditEntry.auditId,
      route: `${context.origin} → ${context.destination}`,
      priceChange: `${context.currency} ${adjustment.originalPrice} → ${adjustment.adjustedPrice}`,
      delta: `${((adjustment.adjustedPrice - adjustment.originalPrice) / adjustment.originalPrice * 100).toFixed(2)}%`,
      modifiers: adjustment.modifiers,
      reasoning: adjustment.reasoning,
    });
  }

  getAuditLog(routeId?: string): PriceAuditLog[] {
    if (routeId) {
      return this.logs.filter(log => log.routeId === routeId);
    }
    return this.logs;
  }

  exportAuditTrail(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export class YieldManager {
  private auditLogger: AuditLogger;

  constructor() {
    this.auditLogger = new AuditLogger();
  }

  private getHistoricalDemandModifier(origin: string, destination: string): number {
    const routeKey = `${origin}-${destination}`;
    const reverseKey = `${destination}-${origin}`;
    
    const historicalData = HISTORICAL_DEMAND_DATA.get(routeKey) || HISTORICAL_DEMAND_DATA.get(reverseKey);
    
    if (!historicalData) {
      return 0;
    }

    const bookingRate = historicalData.averageBookingRate;
    
    if (bookingRate >= 0.85) {
      return 0.20;
    } else if (bookingRate >= 0.75) {
      return 0.15;
    } else if (bookingRate >= 0.65) {
      return 0.08;
    }
    
    return 0;
  }

  private getSeatAvailabilityModifier(seatsRemaining: number, totalSeats: number): number {
    if (totalSeats === 0) return 0;
    
    const occupancyRate = (totalSeats - seatsRemaining) / totalSeats;
    
    if (occupancyRate >= 0.90) {
      return 0.35;
    } else if (occupancyRate >= 0.80) {
      return 0.25;
    } else if (occupancyRate >= 0.70) {
      return 0.18;
    } else if (occupancyRate >= 0.60) {
      return 0.12;
    } else if (occupancyRate >= 0.50) {
      return 0.08;
    }
    
    if (occupancyRate < 0.30) {
      return -0.05;
    }
    
    return 0;
  }

  private getCurrencyVolatilityModifier(currency: string): number {
    if (currency !== 'ARS') {
      return 0;
    }

    const latestData = ARS_VOLATILITY_HISTORY[0];
    const volatilityIndex = latestData.volatilityIndex;
    
    const riskPremium = Math.min(volatilityIndex * 0.5, 0.15);
    
    console.log(`💱 ARS Volatility: Index ${volatilityIndex} → Premium +${(riskPremium * 100).toFixed(1)}%`);
    
    return riskPremium;
  }

  private generateAuditId(): string {
    return `YLD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  private generateReasoning(
    historicalMod: number,
    seatMod: number,
    currencyMod: number,
    context: YieldContext
  ): string {
    const reasons: string[] = [];

    if (historicalMod > 0) {
      reasons.push(`Alta demanda histórica (+${Math.round(historicalMod * 100)}%)`);
    }

    if (seatMod > 0.15) {
      reasons.push(`Asientos limitados (+${Math.round(seatMod * 100)}%)`);
    } else if (seatMod < 0) {
      reasons.push(`Baja ocupación (${Math.round(seatMod * 100)}%)`);
    }

    if (currencyMod > 0) {
      reasons.push(`Volatilidad ARS (+${Math.round(currencyMod * 100)}%)`);
    }

    return reasons.length > 0 ? reasons.join(' • ') : 'Precio base';
  }

  calculateYieldPrice(context: YieldContext): YieldAdjustment {
    console.log('📈 Yield Manager: Calculating optimized price', {
      route: `${context.origin} → ${context.destination}`,
      seats: `${context.seatsRemaining}/${context.totalSeats}`,
      currency: context.currency,
    });

    const historicalDemandModifier = this.getHistoricalDemandModifier(
      context.origin,
      context.destination
    );

    const seatAvailabilityModifier = this.getSeatAvailabilityModifier(
      context.seatsRemaining,
      context.totalSeats
    );

    const currencyVolatilityModifier = this.getCurrencyVolatilityModifier(context.currency);

    let adjustedPrice = context.basePrice;

    adjustedPrice += context.basePrice * historicalDemandModifier;
    adjustedPrice += context.basePrice * seatAvailabilityModifier;
    adjustedPrice += context.basePrice * currencyVolatilityModifier;

    adjustedPrice = Math.round(adjustedPrice * 100) / 100;

    const reasoning = this.generateReasoning(
      historicalDemandModifier,
      seatAvailabilityModifier,
      currencyVolatilityModifier,
      context
    );

    const dualCurrency = globalCurrencyConverter.createDualCurrencyDisplay(
      adjustedPrice,
      context.currency,
      context.homeCurrency
    );

    const adjustment: YieldAdjustment = {
      routeId: context.routeId,
      originalPrice: context.basePrice,
      adjustedPrice,
      dualCurrency,
      modifiers: {
        historicalDemand: historicalDemandModifier,
        seatAvailability: seatAvailabilityModifier,
        currencyVolatility: currencyVolatilityModifier,
      },
      reasoning,
      timestamp: new Date().toISOString(),
      auditId: this.generateAuditId(),
    };

    this.auditLogger.log(adjustment, context);

    return adjustment;
  }

  batchCalculateYieldPrices(contexts: YieldContext[]): YieldAdjustment[] {
    console.log(`📈 Yield Manager: Batch processing ${contexts.length} routes`);
    return contexts.map(ctx => this.calculateYieldPrice(ctx));
  }

  getAuditLogs(routeId?: string): PriceAuditLog[] {
    return this.auditLogger.getAuditLog(routeId);
  }

  exportAuditTrail(): string {
    return this.auditLogger.exportAuditTrail();
  }

  updateHistoricalData(routeKey: string, data: RouteHistoricalData): void {
    HISTORICAL_DEMAND_DATA.set(routeKey, data);
    console.log(`📊 Historical data updated for route: ${routeKey}`);
  }
}
