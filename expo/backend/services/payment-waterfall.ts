import { PaymentRail, PaymentRequest, PaymentResult } from '../types';

interface PaymentProvider {
  name: string;
  process: (request: PaymentRequest) => Promise<PaymentResult>;
}

class DLocalProvider implements PaymentProvider {
  name = 'dLocal';
  
  async process(request: PaymentRequest): Promise<PaymentResult> {
    console.log('💳 dLocal: Processing payment', request);
    
    try {
      const isAvailable = Math.random() > 0.15;
      
      if (!isAvailable) {
        throw new Error('dLocal service temporarily unavailable');
      }
      
      const transactionId = `dloc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      let deepLink = '';
      if (request.country === 'PE') {
        deepLink = `https://pagoefectivo.pe/pay?ref=${transactionId}&amount=${request.amount}`;
      } else if (request.country === 'CO') {
        deepLink = `https://efecty.com.co/pay?ref=${transactionId}&amount=${request.amount}`;
      }
      
      console.log('✅ dLocal: Payment successful', transactionId);
      
      return {
        success: true,
        transactionId,
        deepLink,
        provider: 'dLocal',
      };
    } catch (error) {
      console.log('❌ dLocal: Payment failed', error);
      return {
        success: false,
        provider: 'dLocal',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

class MercadoPagoProvider implements PaymentProvider {
  name = 'Mercado Pago';
  
  async process(request: PaymentRequest): Promise<PaymentResult> {
    console.log('💳 Mercado Pago: Processing payment', request);
    
    try {
      const isAvailable = Math.random() > 0.1;
      
      if (!isAvailable) {
        throw new Error('Mercado Pago service temporarily unavailable');
      }
      
      const transactionId = `mp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deepLink = `https://mercadopago.com/checkout?pref_id=${transactionId}`;
      
      console.log('✅ Mercado Pago: Payment successful', transactionId);
      
      return {
        success: true,
        transactionId,
        deepLink,
        provider: 'MercadoPago',
      };
    } catch (error) {
      console.log('❌ Mercado Pago: Payment failed', error);
      return {
        success: false,
        provider: 'MercadoPago',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

class YapeProvider implements PaymentProvider {
  name = 'Yape';
  
  async process(request: PaymentRequest): Promise<PaymentResult> {
    console.log('💳 Yape: Processing payment', request);
    
    try {
      if (request.country !== 'PE') {
        throw new Error('Yape only available in Peru');
      }
      
      const isAvailable = Math.random() > 0.08;
      
      if (!isAvailable) {
        throw new Error('Yape service temporarily unavailable');
      }
      
      const transactionId = `yape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deepLink = `yape://payment?amount=${request.amount}&description=ANDAR-${request.tripId}&ref=${transactionId}`;
      
      console.log('✅ Yape: Payment successful', transactionId);
      
      return {
        success: true,
        transactionId,
        deepLink,
        provider: 'Yape',
      };
    } catch (error) {
      console.log('❌ Yape: Payment failed', error);
      return {
        success: false,
        provider: 'Yape',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

class NequiProvider implements PaymentProvider {
  name = 'Nequi';
  
  async process(request: PaymentRequest): Promise<PaymentResult> {
    console.log('💳 Nequi: Processing payment', request);
    
    try {
      if (request.country !== 'CO') {
        throw new Error('Nequi only available in Colombia');
      }
      
      const isAvailable = Math.random() > 0.08;
      
      if (!isAvailable) {
        throw new Error('Nequi service temporarily unavailable');
      }
      
      const transactionId = `nequi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deepLink = `nequi://pay?amount=${request.amount}&concept=ANDAR-${request.tripId}&token=${transactionId}`;
      
      console.log('✅ Nequi: Payment successful', transactionId);
      
      return {
        success: true,
        transactionId,
        deepLink,
        provider: 'Nequi',
      };
    } catch (error) {
      console.log('❌ Nequi: Payment failed', error);
      return {
        success: false,
        provider: 'Nequi',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

class AviasalesProvider implements PaymentProvider {
  name = 'Aviasales';
  
  async process(request: PaymentRequest): Promise<PaymentResult> {
    console.log('✈️ Aviasales: Processing booking', request);
    
    try {
      const transactionId = `aviasales_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deepLink = `https://aviasales.tpx.lv/wp9JaVAY?marker=${transactionId}&amount=${request.amount}`;
      
      console.log('✅ Aviasales: Booking link generated', transactionId);
      
      return {
        success: true,
        transactionId,
        deepLink,
        provider: 'Aviasales',
      };
    } catch (error) {
      console.log('❌ Aviasales: Booking failed', error);
      return {
        success: false,
        provider: 'Aviasales',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

class KlookProvider implements PaymentProvider {
  name = 'Klook';
  
  async process(request: PaymentRequest): Promise<PaymentResult> {
    console.log('🎫 Klook: Processing booking', request);
    
    try {
      const transactionId = `klook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deepLink = `https://klook.tpx.lv/vFff47D3?marker=${transactionId}&amount=${request.amount}`;
      
      console.log('✅ Klook: Booking link generated', transactionId);
      
      return {
        success: true,
        transactionId,
        deepLink,
        provider: 'Klook',
      };
    } catch (error) {
      console.log('❌ Klook: Booking failed', error);
      return {
        success: false,
        provider: 'Klook',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

class LocalRentProvider implements PaymentProvider {
  name = 'LocalRent';
  
  async process(request: PaymentRequest): Promise<PaymentResult> {
    console.log('🚗 LocalRent: Processing booking', request);
    
    try {
      const transactionId = `localrent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deepLink = `https://localrent.tpx.lv/H5giKhmf?marker=${transactionId}&amount=${request.amount}`;
      
      console.log('✅ LocalRent: Booking link generated', transactionId);
      
      return {
        success: true,
        transactionId,
        deepLink,
        provider: 'LocalRent',
      };
    } catch (error) {
      console.log('❌ LocalRent: Booking failed', error);
      return {
        success: false,
        provider: 'LocalRent',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

class KiwiTaxiProvider implements PaymentProvider {
  name = 'KiwiTaxi';
  
  async process(request: PaymentRequest): Promise<PaymentResult> {
    console.log('🚕 KiwiTaxi: Processing booking', request);
    
    try {
      const transactionId = `kiwitaxi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deepLink = `https://kiwitaxi.tpx.lv/aed2EOsJ?marker=${transactionId}&amount=${request.amount}`;
      
      console.log('✅ KiwiTaxi: Booking link generated', transactionId);
      
      return {
        success: true,
        transactionId,
        deepLink,
        provider: 'KiwiTaxi',
      };
    } catch (error) {
      console.log('❌ KiwiTaxi: Booking failed', error);
      return {
        success: false,
        provider: 'KiwiTaxi',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

class TravelPayoutsProvider implements PaymentProvider {
  name = 'TravelPayouts';
  
  async process(request: PaymentRequest): Promise<PaymentResult> {
    console.log('🌍 TravelPayouts: Processing booking', request);
    
    try {
      const transactionId = `tp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deepLink = `https://tpx.lv/4Jxz4XoV?marker=${transactionId}&amount=${request.amount}`;
      
      console.log('✅ TravelPayouts: Booking link generated', transactionId);
      
      return {
        success: true,
        transactionId,
        deepLink,
        provider: 'TravelPayouts',
      };
    } catch (error) {
      console.log('❌ TravelPayouts: Booking failed', error);
      return {
        success: false,
        provider: 'TravelPayouts',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

class EconomyBookingsProvider implements PaymentProvider {
  name = 'EconomyBookings';
  
  async process(request: PaymentRequest): Promise<PaymentResult> {
    console.log('🚗 EconomyBookings: Processing car rental booking', request);
    
    try {
      const transactionId = `economybookings_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deepLink = `https://economybookings.tpx.lv/PNnYpMav?marker=${transactionId}&amount=${request.amount}`;
      
      console.log('✅ EconomyBookings: Booking link generated', transactionId);
      
      return {
        success: true,
        transactionId,
        deepLink,
        provider: 'EconomyBookings',
      };
    } catch (error) {
      console.log('❌ EconomyBookings: Booking failed', error);
      return {
        success: false,
        provider: 'EconomyBookings',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

class TiqetsProvider implements PaymentProvider {
  name = 'Tiqets';
  
  async process(request: PaymentRequest): Promise<PaymentResult> {
    console.log('🎟️ Tiqets: Processing reservation', request);
    
    try {
      const transactionId = `tiqets_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deepLink = `https://tiqets.tpx.lv/eho1RwzR?marker=${transactionId}&amount=${request.amount}`;
      
      console.log('✅ Tiqets: Reservation link generated', transactionId);
      
      return {
        success: true,
        transactionId,
        deepLink,
        provider: 'Tiqets',
      };
    } catch (error) {
      console.log('❌ Tiqets: Reservation failed', error);
      return {
        success: false,
        provider: 'Tiqets',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

class TripComProvider implements PaymentProvider {
  name = 'Trip.com';
  
  async process(request: PaymentRequest): Promise<PaymentResult> {
    console.log('🏨 Trip.com: Processing booking', request);
    
    try {
      const transactionId = `tripcom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deepLink = `https://jp.trip.com/hotels/list?Allianceid=7745235&SID=291136098&trip_sub1=${transactionId}&trip_sub3=D10851507`;
      
      console.log('✅ Trip.com: Booking link generated', transactionId);
      
      return {
        success: true,
        transactionId,
        deepLink,
        provider: 'Trip.com',
      };
    } catch (error) {
      console.log('❌ Trip.com: Booking failed', error);
      return {
        success: false,
        provider: 'Trip.com',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

class YeSimProvider implements PaymentProvider {
  name = 'YeSim';
  
  async process(request: PaymentRequest): Promise<PaymentResult> {
    console.log('📱 YeSim: Processing SIM purchase', request);
    
    try {
      const transactionId = `yesim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const deepLink = `https://yesim.tpx.lv/4Lpo39cB?marker=${transactionId}&amount=${request.amount}`;
      
      console.log('✅ YeSim: Purchase link generated', transactionId);
      
      return {
        success: true,
        transactionId,
        deepLink,
        provider: 'YeSim',
      };
    } catch (error) {
      console.log('❌ YeSim: Purchase failed', error);
      return {
        success: false,
        provider: 'YeSim',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export class PaymentWaterfallService {
  private providers: Map<string, PaymentProvider>;
  
  constructor() {
    this.providers = new Map([
      ['dlocal', new DLocalProvider()],
      ['mercadopago', new MercadoPagoProvider()],
      ['yape', new YapeProvider()],
      ['nequi', new NequiProvider()],
      ['aviasales', new AviasalesProvider()],
      ['klook', new KlookProvider()],
      ['localrent', new LocalRentProvider()],
      ['kiwitaxi', new KiwiTaxiProvider()],
      ['travelpayouts', new TravelPayoutsProvider()],
      ['yesim', new YeSimProvider()],
      ['economybookings', new EconomyBookingsProvider()],
      ['tiqets', new TiqetsProvider()],
      ['tripcom', new TripComProvider()],
    ]);
  }
  
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    console.log('🌊 Payment Waterfall: Starting payment flow', request);
    
    const rails = this.determinePaymentRails(request.country, request.paymentMethod);
    
    for (const rail of rails) {
      const provider = this.providers.get(rail.provider);
      
      if (!provider || !rail.enabled) {
        console.log(`⏭️ Skipping ${rail.provider} - not enabled or unavailable`);
        continue;
      }
      
      console.log(`🔄 Attempting payment via ${rail.provider} (${rail.type} rail)`);
      
      const result = await provider.process(request);
      
      if (result.success) {
        console.log(`✅ Payment successful via ${rail.provider}`);
        return {
          ...result,
          fallbackAttempted: rail.type !== 'primary',
        };
      }
      
      console.log(`❌ ${rail.provider} failed, trying next rail...`);
    }
    
    console.log('❌ Payment Waterfall: All rails failed');
    
    return {
      success: false,
      provider: 'none',
      failureReason: 'All payment rails failed',
      fallbackAttempted: true,
    };
  }
  
  private determinePaymentRails(country: string, paymentMethod: string): PaymentRail[] {
    const rails: PaymentRail[] = [];
    
    if (paymentMethod === 'aviasales') {
      rails.push({ provider: 'aviasales', type: 'primary', enabled: true, priority: 1 });
      return rails;
    } else if (paymentMethod === 'klook') {
      rails.push({ provider: 'klook', type: 'primary', enabled: true, priority: 1 });
      return rails;
    } else if (paymentMethod === 'localrent') {
      rails.push({ provider: 'localrent', type: 'primary', enabled: true, priority: 1 });
      return rails;
    } else if (paymentMethod === 'kiwitaxi') {
      rails.push({ provider: 'kiwitaxi', type: 'primary', enabled: true, priority: 1 });
      return rails;
    } else if (paymentMethod === 'travelpayouts') {
      rails.push({ provider: 'travelpayouts', type: 'primary', enabled: true, priority: 1 });
      return rails;
    } else if (paymentMethod === 'yesim') {
      rails.push({ provider: 'yesim', type: 'primary', enabled: true, priority: 1 });
      return rails;
    } else if (paymentMethod === 'economybookings') {
      rails.push({ provider: 'economybookings', type: 'primary', enabled: true, priority: 1 });
      return rails;
    } else if (paymentMethod === 'tiqets') {
      rails.push({ provider: 'tiqets', type: 'primary', enabled: true, priority: 1 });
      return rails;
    } else if (paymentMethod === 'tripcom') {
      rails.push({ provider: 'tripcom', type: 'primary', enabled: true, priority: 1 });
      return rails;
    }
    
    if (country === 'PE') {
      if (paymentMethod === 'yape') {
        rails.push({ provider: 'yape', type: 'primary', enabled: true, priority: 1 });
        rails.push({ provider: 'dlocal', type: 'secondary', enabled: true, priority: 2 });
        rails.push({ provider: 'mercadopago', type: 'fallback', enabled: true, priority: 3 });
      } else {
        rails.push({ provider: 'dlocal', type: 'primary', enabled: true, priority: 1 });
        rails.push({ provider: 'mercadopago', type: 'secondary', enabled: true, priority: 2 });
        rails.push({ provider: 'yape', type: 'fallback', enabled: true, priority: 3 });
      }
    } else if (country === 'CO') {
      if (paymentMethod === 'nequi') {
        rails.push({ provider: 'nequi', type: 'primary', enabled: true, priority: 1 });
        rails.push({ provider: 'dlocal', type: 'secondary', enabled: true, priority: 2 });
        rails.push({ provider: 'mercadopago', type: 'fallback', enabled: true, priority: 3 });
      } else {
        rails.push({ provider: 'dlocal', type: 'primary', enabled: true, priority: 1 });
        rails.push({ provider: 'mercadopago', type: 'secondary', enabled: true, priority: 2 });
        rails.push({ provider: 'nequi', type: 'fallback', enabled: true, priority: 3 });
      }
    } else {
      rails.push({ provider: 'dlocal', type: 'primary', enabled: true, priority: 1 });
      rails.push({ provider: 'mercadopago', type: 'secondary', enabled: true, priority: 2 });
    }
    
    rails.push({ provider: 'aviasales', type: 'fallback', enabled: true, priority: 90 });
    rails.push({ provider: 'travelpayouts', type: 'fallback', enabled: true, priority: 91 });
    
    return rails.sort((a, b) => a.priority - b.priority);
  }
  
  getAvailablePaymentMethods(country: string): string[] {
    const methods = ['cash', 'card'];
    
    if (country === 'PE') {
      methods.push('yape');
    } else if (country === 'CO') {
      methods.push('nequi');
    }
    
    methods.push('aviasales', 'klook', 'localrent', 'kiwitaxi', 'travelpayouts', 'yesim', 'economybookings', 'tiqets', 'tripcom');
    
    return methods;
  }
}
