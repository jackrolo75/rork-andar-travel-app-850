import { PricingContext, DynamicPriceResult, RegionalHoliday } from '../types';
import { globalCurrencyConverter } from './currency-converter';

const REGIONAL_HOLIDAYS: RegionalHoliday[] = [
  { date: '2026-02-16', name: 'Carnaval', countries: ['PE', 'CO', 'EC', 'BO', 'BR'], demandMultiplier: 1.4 },
  { date: '2026-06-24', name: 'Inti Raymi', countries: ['PE', 'EC', 'BO'], demandMultiplier: 1.5 },
  { date: '2026-07-28', name: 'Fiestas Patrias (Peru)', countries: ['PE'], demandMultiplier: 1.6 },
  { date: '2026-07-20', name: 'Día de la Independencia (Colombia)', countries: ['CO'], demandMultiplier: 1.5 },
  { date: '2026-08-06', name: 'Batalla de Boyacá', countries: ['CO'], demandMultiplier: 1.3 },
  { date: '2026-12-24', name: 'Navidad', countries: ['ALL'], demandMultiplier: 1.8 },
];

const ALTITUDE_ROUTES = new Map<string, number>([
  ['Lima-Cusco', 3400],
  ['Lima-Arequipa', 2335],
  ['Lima-Puno', 3827],
  ['Cusco-Puno', 3827],
  ['Bogotá-Pasto', 2527],
  ['Quito-Cuenca', 2560],
  ['La Paz-Uyuni', 3656],
]);

function getAltitudeAdjustment(origin: string, destination: string): number {
  const routeKey = `${origin}-${destination}`;
  const reverseKey = `${destination}-${origin}`;
  
  const altitude = ALTITUDE_ROUTES.get(routeKey) || ALTITUDE_ROUTES.get(reverseKey);
  
  if (!altitude) return 0;
  
  if (altitude > 3500) return 0.25;
  if (altitude > 2500) return 0.18;
  if (altitude > 2000) return 0.12;
  
  return 0;
}

function getFestivalDemandSurge(date: string, route: { origin: string; destination: string }): number {
  const targetDate = new Date(date);
  
  const countryMap: Record<string, string> = {
    'Lima': 'PE', 'Cusco': 'PE', 'Arequipa': 'PE', 'Puno': 'PE', 'Trujillo': 'PE',
    'Bogotá': 'CO', 'Medellín': 'CO', 'Cali': 'CO', 'Cartagena': 'CO',
    'Quito': 'EC', 'Guayaquil': 'EC', 'Cuenca': 'EC',
    'La Paz': 'BO', 'Santa Cruz': 'BO', 'Cochabamba': 'BO',
  };
  
  const originCountry = countryMap[route.origin];
  const destCountry = countryMap[route.destination];
  
  for (const holiday of REGIONAL_HOLIDAYS) {
    const holidayDate = new Date(holiday.date);
    const daysDiff = Math.abs((targetDate.getTime() - holidayDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 3) {
      if (holiday.countries.includes('ALL') || 
          holiday.countries.includes(originCountry) || 
          holiday.countries.includes(destCountry)) {
        return holiday.demandMultiplier;
      }
    }
  }
  
  return 1.0;
}

function calculateXGBoostScore(context: PricingContext): number {
  const dayOfWeek = new Date(context.date).getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  let score = 1.0;
  
  score += context.demand * 0.3;
  
  if (isWeekend) {
    score += 0.15;
  }
  
  if (context.route.distance > 800) {
    score += 0.1;
  }
  
  return Math.min(score, 2.0);
}

export class DynamicPricingEngine {
  calculateDynamicPrice(context: PricingContext): DynamicPriceResult {
    console.log('💰 Pricing Engine: Calculating dynamic price', context);
    
    const altitudeAdjustment = getAltitudeAdjustment(context.route.origin, context.route.destination);
    const festivalSurge = getFestivalDemandSurge(context.date, context.route);
    const xgboostScore = calculateXGBoostScore(context);
    
    let adjustedPrice = context.basePrice;
    
    const topographicModifier = altitudeAdjustment > 0 ? altitudeAdjustment : 0;
    adjustedPrice += context.basePrice * topographicModifier;
    
    const festivalModifier = festivalSurge - 1.0;
    adjustedPrice += context.basePrice * festivalModifier;
    
    const demandModifier = (xgboostScore - 1.0);
    adjustedPrice += context.basePrice * demandModifier;
    
    adjustedPrice = Math.round(adjustedPrice * 100) / 100;
    
    const reasoning = this.generateReasoning(
      topographicModifier,
      festivalSurge,
      xgboostScore,
      context
    );
    
    const dualCurrency = globalCurrencyConverter.createDualCurrencyDisplay(
      adjustedPrice,
      'PEN'
    );
    
    return {
      originalPrice: context.basePrice,
      adjustedPrice,
      dualCurrency,
      modifiers: {
        topographic: topographicModifier,
        festival: festivalModifier,
        demand: demandModifier,
      },
      reasoning,
    };
  }
  
  private generateReasoning(
    topographic: number,
    festival: number,
    xgboost: number,
    context: PricingContext
  ): string {
    const reasons: string[] = [];
    
    if (topographic > 0) {
      reasons.push(`Ruta andina (+${Math.round(topographic * 100)}% por altitud)`);
    }
    
    if (festival > 1.0) {
      const increase = Math.round((festival - 1.0) * 100);
      reasons.push(`Demanda festiva (+${increase}%)`);
    }
    
    if (xgboost > 1.1) {
      reasons.push(`Alta demanda prevista`);
    }
    
    return reasons.length > 0 ? reasons.join(', ') : 'Precio base';
  }
  
  batchCalculate(contexts: PricingContext[]): DynamicPriceResult[] {
    console.log(`💰 Pricing Engine: Batch calculating ${contexts.length} prices`);
    return contexts.map(ctx => this.calculateDynamicPrice(ctx));
  }
}
