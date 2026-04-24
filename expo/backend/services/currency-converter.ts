import { CurrencyDisplay } from '../types';

interface ExchangeRates {
  [key: string]: number;
}

const EXCHANGE_RATES_TO_USD: ExchangeRates = {
  // Major currencies
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  CHF: 0.88,
  CAD: 1.36,
  AUD: 1.53,
  NZD: 1.67,
  
  // South America
  PEN: 3.75,
  COP: 4200,
  ARS: 1050.25,
  CLP: 950,
  BRL: 5.2,
  BOB: 6.9,
  UYU: 39.5,
  PYG: 7300,
  VES: 36.5,
  
  // Central America & Caribbean
  MXN: 17.15,
  GTQ: 7.85,
  HNL: 24.70,
  NIO: 36.70,
  CRC: 520,
  PAB: 1.0,
  DOP: 58.50,
  JMD: 155.50,
  TTD: 6.80,
  
  // Europe
  PLN: 4.02,
  CZK: 22.85,
  HUF: 358,
  RON: 4.58,
  BGN: 1.80,
  HRK: 6.95,
  RSD: 108,
  NOK: 10.65,
  SEK: 10.45,
  DKK: 6.88,
  ISK: 138,
  TRY: 30.50,
  RUB: 92.50,
  UAH: 37.50,
  
  // Asia
  CNY: 7.25,
  HKD: 7.82,
  TWD: 31.50,
  KRW: 1320,
  SGD: 1.34,
  MYR: 4.72,
  THB: 35.50,
  IDR: 15750,
  PHP: 56.20,
  VND: 24500,
  INR: 83.20,
  PKR: 280,
  BDT: 110,
  LKR: 325,
  NPR: 133,
  
  // Middle East
  AED: 3.67,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.38,
  OMR: 0.38,
  JOD: 0.71,
  ILS: 3.65,
  EGP: 30.90,
  
  // Africa
  ZAR: 18.90,
  MAD: 10.10,
  NGN: 1550,
  KES: 155,
  GHS: 12.50,
  TZS: 2520,
  UGX: 3800,
  ETB: 56.50,
  
  // Oceania
  FJD: 2.25,
  PGK: 3.75,
  WST: 2.75,
};

const HOME_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF'];

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  KRW: '₩',
  INR: '₹',
  THB: '฿',
  BRL: 'R$',
  MXN: '$',
  ARS: '$',
  CLP: '$',
  COP: '$',
  PEN: 'S/',
  AED: 'د.إ',
  SAR: '﷼',
  ILS: '₪',
  TRY: '₺',
  RUB: '₽',
  ZAR: 'R',
  CHF: 'Fr',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  CZK: 'Kč',
  HUF: 'Ft',
  PHP: '₱',
  VND: '₫',
  IDR: 'Rp',
  MYR: 'RM',
  SGD: 'S$',
  HKD: 'HK$',
  TWD: 'NT$',
  AUD: 'A$',
  NZD: 'NZ$',
  CAD: 'C$',
};

export class CurrencyConverter {
  private rates: ExchangeRates;
  
  constructor(customRates?: ExchangeRates) {
    this.rates = customRates || EXCHANGE_RATES_TO_USD;
  }
  
  convert(amount: number, fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return amount;
    
    const fromRate = this.rates[fromCurrency] || 1;
    const toRate = this.rates[toCurrency] || 1;
    
    const amountInUSD = amount / fromRate;
    const convertedAmount = amountInUSD * toRate;
    
    return Math.round(convertedAmount * 100) / 100;
  }
  
  getExchangeRate(fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return 1;
    
    const fromRate = this.rates[fromCurrency] || 1;
    const toRate = this.rates[toCurrency] || 1;
    
    return toRate / fromRate;
  }
  
  createDualCurrencyDisplay(
    localAmount: number,
    localCurrency: string,
    homeCurrency?: string
  ): CurrencyDisplay {
    const targetHomeCurrency = homeCurrency || this.getDefaultHomeCurrency(localCurrency);
    
    const homeAmount = this.convert(localAmount, localCurrency, targetHomeCurrency);
    const exchangeRate = this.getExchangeRate(localCurrency, targetHomeCurrency);
    
    return {
      localAmount,
      localCurrency,
      homeAmount,
      homeCurrency: targetHomeCurrency,
      exchangeRate,
    };
  }
  
  private getDefaultHomeCurrency(localCurrency: string): string {
    if (HOME_CURRENCIES.includes(localCurrency)) {
      return localCurrency;
    }
    return 'USD';
  }
  
  updateRate(currency: string, rateToUSD: number): void {
    this.rates[currency] = rateToUSD;
    console.log(`💱 Updated exchange rate: ${currency} = ${rateToUSD} USD`);
  }
  
  getAllRates(): ExchangeRates {
    return { ...this.rates };
  }
  
  getCurrencySymbol(currency: string): string {
    return CURRENCY_SYMBOLS[currency] || currency;
  }
  
  formatCurrency(amount: number, currency: string, showSymbol = true): string {
    const symbol = showSymbol ? this.getCurrencySymbol(currency) : '';
    const decimals = this.getDecimalPlaces(currency);
    const formatted = amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    const suffixCurrencies = ['SEK', 'NOK', 'DKK', 'CZK', 'PLN', 'HUF'];
    if (suffixCurrencies.includes(currency)) {
      return `${formatted} ${symbol}`;
    }
    
    return `${symbol}${formatted}`;
  }
  
  private getDecimalPlaces(currency: string): number {
    const noDecimals = ['JPY', 'KRW', 'VND', 'IDR', 'CLP', 'PYG', 'HUF', 'ISK'];
    if (noDecimals.includes(currency)) return 0;
    
    const threeDecimals = ['KWD', 'BHD', 'OMR'];
    if (threeDecimals.includes(currency)) return 3;
    
    return 2;
  }
  
  getSupportedCurrencies(): string[] {
    return Object.keys(this.rates);
  }
  
  isSupportedCurrency(currency: string): boolean {
    return currency in this.rates;
  }
}

export const globalCurrencyConverter = new CurrencyConverter();

export function formatPrice(amount: number, currency: string): string {
  return globalCurrencyConverter.formatCurrency(amount, currency);
}

export function convertPrice(amount: number, from: string, to: string): number {
  return globalCurrencyConverter.convert(amount, from, to);
}
