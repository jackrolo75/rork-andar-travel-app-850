export interface PricingContext {
  basePrice: number;
  route: {
    origin: string;
    destination: string;
    distance: number;
    altitudeGain?: number;
  };
  date: string;
  demand: number;
  regionalHolidays: string[];
}

export interface CurrencyDisplay {
  localAmount: number;
  localCurrency: string;
  homeAmount: number;
  homeCurrency: string;
  exchangeRate: number;
}

export interface DynamicPriceResult {
  originalPrice: number;
  adjustedPrice: number;
  dualCurrency: CurrencyDisplay;
  modifiers: {
    topographic: number;
    festival: number;
    demand: number;
  };
  reasoning: string;
}

export interface KiloPointCalculation {
  tripId: string;
  distance: number;
  price: number;
  mode: 'bus' | 'flight';
  vpIndex: number;
  pointsEarned: number;
  multiplier: number;
}

export interface RegionalHoliday {
  date: string;
  name: string;
  countries: string[];
  demandMultiplier: number;
}

export interface YieldAdjustment {
  routeId: string;
  originalPrice: number;
  adjustedPrice: number;
  dualCurrency: CurrencyDisplay;
  modifiers: {
    historicalDemand: number;
    seatAvailability: number;
    currencyVolatility: number;
  };
  reasoning: string;
  timestamp: string;
  auditId: string;
}

export interface RouteHistoricalData {
  routeKey: string;
  averageBookingRate: number;
  peakDemandMultiplier: number;
  lastUpdated: string;
}

export interface RedemptionAttempt {
  userId: string;
  pointsRedeemed: number;
  timestamp: string;
  cooloffEnds: string;
  status: 'active' | 'expired';
}

export interface YieldContext {
  routeId: string;
  origin: string;
  destination: string;
  basePrice: number;
  currency: string;
  homeCurrency?: string;
  seatsRemaining: number;
  totalSeats: number;
  date: string;
  mode: 'bus' | 'flight';
}

export interface CPIData {
  country: string;
  currency: string;
  cpiValue: number;
  monthlyInflation: number;
  annualInflation: number;
  lastUpdated: string;
}

export interface InflationMultiplier {
  currency: string;
  monthlyRate: number;
  compoundedRate: number;
  appliedAt: string;
}

export interface VPIndexData {
  USD: number;
  PEN: number;
  COP: number;
  ARS: number;
  CLP: number;
  BRL: number;
  BOB: number;
  UYU: number;
  PYG: number;
}

export interface CooloffRecord {
  userId: string;
  cooloffEnds: string;
  redemptionTimestamp: string;
  pointsRedeemed: number;
  merchantId?: string;
}

export interface InflationReport {
  vpIndex: VPIndexData;
  lastAdjustment: string;
  cpiData: Record<string, CPIData | null>;
}
