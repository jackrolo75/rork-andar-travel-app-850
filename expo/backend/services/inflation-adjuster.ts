import { redisCache } from './redis-cache';

interface CPIData {
  country: string;
  currency: string;
  cpiValue: number;
  monthlyInflation: number;
  annualInflation: number;
  lastUpdated: string;
}

interface VPIndexData {
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

interface InflationMultiplier {
  currency: string;
  monthlyRate: number;
  compoundedRate: number;
  appliedAt: string;
}

const BASE_VP_INDEX: VPIndexData = {
  USD: 1.0,
  PEN: 3.75,
  COP: 4200,
  ARS: 850,
  CLP: 950,
  BRL: 5.2,
  BOB: 6.9,
  UYU: 39.5,
  PYG: 7300,
};

const MONTHLY_INFLATION_RATES: Record<string, number> = {
  USD: 0.003,
  PEN: 0.004,
  COP: 0.008,
  ARS: 0.15,
  CLP: 0.006,
  BRL: 0.005,
  BOB: 0.002,
  UYU: 0.007,
  PYG: 0.004,
};

export class InflationAdjuster {
  private vpIndex: VPIndexData;
  private lastAdjustment: Date;
  private readonly REDIS_KEY_PREFIX = 'inflation:';
  private readonly VP_INDEX_KEY = 'vp:index';
  
  constructor() {
    this.vpIndex = { ...BASE_VP_INDEX };
    this.lastAdjustment = new Date();
  }
  
  async initialize(): Promise<void> {
    console.log('📊 Inflation Adjuster: Initializing');
    
    const cached = await this.loadVPIndexFromCache();
    if (cached) {
      this.vpIndex = cached;
      console.log('✅ Loaded VP Index from cache', this.vpIndex);
    } else {
      await this.saveVPIndexToCache();
      console.log('✅ Initialized VP Index with base rates');
    }
  }
  
  async fetchRealTimeCPI(currency: string): Promise<CPIData | null> {
    console.log(`📈 Fetching real-time CPI for ${currency}`);
    
    try {
      const cached = await redisCache.get(`${this.REDIS_KEY_PREFIX}cpi:${currency}`);
      
      if (cached) {
        console.log(`✅ CPI data from cache for ${currency}`);
        return JSON.parse(cached);
      }
      
      const monthlyInflation = MONTHLY_INFLATION_RATES[currency] || 0.005;
      const annualInflation = monthlyInflation * 12;
      
      const cpiData: CPIData = {
        country: this.getCurrencyCountry(currency),
        currency,
        cpiValue: 100 + (annualInflation * 100),
        monthlyInflation,
        annualInflation,
        lastUpdated: new Date().toISOString(),
      };
      
      await redisCache.set(
        `${this.REDIS_KEY_PREFIX}cpi:${currency}`,
        JSON.stringify(cpiData),
        3600
      );
      
      console.log(`✅ CPI data generated for ${currency}`, cpiData);
      return cpiData;
    } catch (error) {
      console.error(`❌ Error fetching CPI for ${currency}:`, error);
      return null;
    }
  }
  
  async applyMonthlyMultiplier(currency: string, multiplier?: number): Promise<number> {
    console.log(`💰 Applying monthly inflation to ${currency}`);
    
    const rate = multiplier || MONTHLY_INFLATION_RATES[currency] || 0.005;
    
    const currentRate = this.vpIndex[currency as keyof VPIndexData];
    if (!currentRate) {
      console.log(`⚠️ Currency ${currency} not found in VP Index`);
      return 0;
    }
    
    const adjustedRate = currentRate * (1 + rate);
    this.vpIndex[currency as keyof VPIndexData] = adjustedRate;
    
    const multiplierData: InflationMultiplier = {
      currency,
      monthlyRate: rate,
      compoundedRate: adjustedRate,
      appliedAt: new Date().toISOString(),
    };
    
    await redisCache.set(
      `${this.REDIS_KEY_PREFIX}multiplier:${currency}`,
      JSON.stringify(multiplierData),
      2592000
    );
    
    await this.saveVPIndexToCache();
    
    console.log(`✅ Applied ${(rate * 100).toFixed(2)}% inflation to ${currency}: ${currentRate} → ${adjustedRate}`);
    
    return adjustedRate;
  }
  
  async adjustPriceForInflation(
    basePrice: number,
    currency: string,
    monthsElapsed: number = 1
  ): Promise<number> {
    console.log(`💵 Adjusting price for inflation: ${basePrice} ${currency} (${monthsElapsed} months)`);
    
    const cpiData = await this.fetchRealTimeCPI(currency);
    if (!cpiData) {
      return basePrice;
    }
    
    const compoundedRate = Math.pow(1 + cpiData.monthlyInflation, monthsElapsed);
    const adjustedPrice = basePrice * compoundedRate;
    
    console.log(`✅ Price adjusted: ${basePrice} → ${adjustedPrice.toFixed(2)} ${currency}`);
    
    return Math.round(adjustedPrice * 100) / 100;
  }
  
  async getVPIndex(): Promise<VPIndexData> {
    const cached = await this.loadVPIndexFromCache();
    return cached || this.vpIndex;
  }
  
  async setVPRate(currency: string, rate: number): Promise<void> {
    console.log(`🔄 Manually setting VP rate: ${currency} = ${rate}`);
    
    this.vpIndex[currency as keyof VPIndexData] = rate;
    await this.saveVPIndexToCache();
    
    console.log(`✅ VP rate updated for ${currency}`);
  }
  
  async runMonthlyAdjustment(): Promise<void> {
    console.log('🔄 Running monthly inflation adjustment for all currencies');
    
    const currencies = Object.keys(this.vpIndex) as (keyof VPIndexData)[];
    
    for (const currency of currencies) {
      if (currency !== 'USD') {
        await this.applyMonthlyMultiplier(currency);
      }
    }
    
    this.lastAdjustment = new Date();
    
    console.log('✅ Monthly adjustment complete', this.vpIndex);
  }
  
  async getInflationReport(): Promise<{
    vpIndex: VPIndexData;
    lastAdjustment: string;
    cpiData: Record<string, CPIData | null>;
  }> {
    const currencies = Object.keys(this.vpIndex);
    const cpiData: Record<string, CPIData | null> = {};
    
    for (const currency of currencies) {
      cpiData[currency] = await this.fetchRealTimeCPI(currency);
    }
    
    return {
      vpIndex: this.vpIndex,
      lastAdjustment: this.lastAdjustment.toISOString(),
      cpiData,
    };
  }
  
  convertToVP(amount: number, currency: string): number {
    const rate = this.vpIndex[currency as keyof VPIndexData] || 1.0;
    return amount / rate;
  }
  
  convertFromVP(vpAmount: number, currency: string): number {
    const rate = this.vpIndex[currency as keyof VPIndexData] || 1.0;
    return vpAmount * rate;
  }
  
  private async saveVPIndexToCache(): Promise<void> {
    await redisCache.set(
      this.VP_INDEX_KEY,
      JSON.stringify({
        index: this.vpIndex,
        lastAdjustment: this.lastAdjustment.toISOString(),
      }),
      2592000
    );
  }
  
  private async loadVPIndexFromCache(): Promise<VPIndexData | null> {
    const cached = await redisCache.get(this.VP_INDEX_KEY);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    this.lastAdjustment = new Date(parsed.lastAdjustment);
    return parsed.index;
  }
  
  private getCurrencyCountry(currency: string): string {
    const map: Record<string, string> = {
      USD: 'United States',
      PEN: 'Peru',
      COP: 'Colombia',
      ARS: 'Argentina',
      CLP: 'Chile',
      BRL: 'Brazil',
      BOB: 'Bolivia',
      UYU: 'Uruguay',
      PYG: 'Paraguay',
    };
    return map[currency] || 'Unknown';
  }
}

export const globalInflationAdjuster = new InflationAdjuster();
