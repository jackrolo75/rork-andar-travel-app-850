// @ts-nocheck
import type { Context } from 'hono';
import { DynamicPricingEngine } from './services/pricing-engine';
import { PaymentWaterfallService } from './services/payment-waterfall';
import { LoyaltyLedgerService } from './services/loyalty-ledger';
import { YieldManager } from './services/yield-manager';

import { globalInflationAdjuster } from './services/inflation-adjuster';
import { CurrencyConverter } from './services/currency-converter';
import { ConflictDetectorService } from './services/conflict-detector';
import { gpsMomentum } from './services/gps-momentum';
import type {
  PricingContext,
  PaymentRequest,
  YieldContext,
} from './types';

const pricingEngine = new DynamicPricingEngine();
const paymentWaterfall = new PaymentWaterfallService();
const loyaltyLedger = new LoyaltyLedgerService();
const yieldManager = new YieldManager();

const currencyConverter = new CurrencyConverter();
const conflictDetector = new ConflictDetectorService();

export class FlutterFlowBridge {
  async getPricing(c: Context) {
    try {
      const body = await c.req.json();
      const { basePrice, route, date, demand, regionalHolidays } = body;

      if (!basePrice || !route || !date) {
        return c.json({ 
          success: false, 
          error: 'Missing required fields: basePrice, route, date' 
        }, 400);
      }

      const context: PricingContext = {
        basePrice: Number(basePrice),
        route: {
          origin: route.origin,
          destination: route.destination,
          distance: Number(route.distance),
          altitudeGain: route.altitudeGain ? Number(route.altitudeGain) : undefined,
        },
        date,
        demand: demand ? Number(demand) : 1.0,
        regionalHolidays: regionalHolidays || [],
      };

      const result = pricingEngine.calculateDynamicPrice(context);

      console.log('💰 FlutterFlow Pricing Request:', { context, result });

      return c.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Pricing error:', error);
      return c.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Pricing calculation failed' 
      }, 500);
    }
  }

  async getYieldPrice(c: Context) {
    try {
      const body = await c.req.json();
      const { 
        routeId, 
        origin, 
        destination, 
        basePrice, 
        currency, 
        homeCurrency,
        seatsRemaining, 
        totalSeats, 
        date, 
        mode 
      } = body;

      if (!routeId || !origin || !destination || !basePrice || !currency) {
        return c.json({ 
          success: false, 
          error: 'Missing required fields' 
        }, 400);
      }

      const context: YieldContext = {
        routeId,
        origin,
        destination,
        basePrice: Number(basePrice),
        currency,
        homeCurrency: homeCurrency || 'USD',
        seatsRemaining: Number(seatsRemaining),
        totalSeats: Number(totalSeats),
        date,
        mode: mode || 'bus',
      };

      const result = yieldManager.calculateYieldPrice(context);

      console.log('📊 FlutterFlow Yield Request:', { context, result });

      return c.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Yield error:', error);
      return c.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Yield calculation failed' 
      }, 500);
    }
  }

  async initiatePayment(c: Context) {
    try {
      const body = await c.req.json();
      const { amount, currency, country, paymentMethod, userId, tripId, metadata } = body;

      if (!amount || !currency || !country || !paymentMethod || !userId || !tripId) {
        return c.json({ 
          success: false, 
          error: 'Missing required fields' 
        }, 400);
      }

      const request: PaymentRequest = {
        amount: Number(amount),
        currency,
        country,
        paymentMethod,
        userId,
        tripId,
        metadata: metadata || {},
      };

      const result = await paymentWaterfall.processPayment(request);

      console.log('💳 FlutterFlow Payment Request:', { request, result });

      return c.json({
        success: result.success,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Payment error:', error);
      return c.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Payment initiation failed' 
      }, 500);
    }
  }

  async calculatePoints(c: Context) {
    try {
      const body = await c.req.json();
      const { tripId, distance, price, mode, currency } = body;

      if (!tripId || !distance || !price || !mode) {
        return c.json({ 
          success: false, 
          error: 'Missing required fields: tripId, distance, price, mode' 
        }, 400);
      }

      const result = loyaltyLedger.calculateKiloPoints(
        tripId,
        Number(distance),
        Number(price),
        currency || 'USD',
        mode
      );

      console.log('⭐ FlutterFlow Points Calculation:', { tripId, result });

      return c.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Points calculation error:', error);
      return c.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Points calculation failed' 
      }, 500);
    }
  }

  async issuePoints(c: Context) {
    try {
      const body = await c.req.json();
      const { userId, points, tripId, merchantId } = body;

      if (!userId || !points) {
        return c.json({ 
          success: false, 
          error: 'Missing required fields: userId, points' 
        }, 400);
      }

      await loyaltyLedger.issuePoints(
        userId,
        Number(points)
      );

      const result = {
        success: true,
        userId,
        points: Number(points),
        tripId: tripId || `TRIP_${Date.now()}`,
        merchantId,
      };

      console.log('✨ FlutterFlow Points Issued:', { userId, points, result });

      return c.json({
        success: result.success,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Points issuance error:', error);
      return c.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Points issuance failed' 
      }, 500);
    }
  }

  async redeemPoints(c: Context) {
    try {
      const body = await c.req.json();
      const { userId, points, merchantId } = body;

      if (!userId || !points || !merchantId) {
        return c.json({ 
          success: false, 
          error: 'Missing required fields: userId, points, merchantId' 
        }, 400);
      }

      const redemption = await loyaltyLedger.redeemPoints(
        userId,
        Number(points),
        merchantId
      );

      const result = {
        success: redemption !== null,
        redemption,
      };

      console.log('🎁 FlutterFlow Points Redemption:', { userId, points, result });

      return c.json({
        success: result.success,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Points redemption error:', error);
      return c.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Points redemption failed' 
      }, 500);
    }
  }

  async getPointsBalance(c: Context) {
    try {
      const userId = c.req.query('userId');

      if (!userId) {
        return c.json({ 
          success: false, 
          error: 'Missing userId parameter' 
        }, 400);
      }

      const member = await loyaltyLedger.getMemberStatus(userId);
      const balance = member?.totalPoints || 0;

      console.log('💎 FlutterFlow Balance Query:', { userId, balance });

      return c.json({
        success: true,
        data: {
          userId,
          balance,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Balance query error:', error);
      return c.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Balance query failed' 
      }, 500);
    }
  }

  async getBusLocation(c: Context) {
    try {
      const bookingId = c.req.query('bookingId');

      if (!bookingId) {
        return c.json({ 
          success: false, 
          error: 'Missing bookingId parameter' 
        }, 400);
      }

      const routeId = 'route_001';
      const momentum = gpsMomentum.getMomentum(routeId);

      if (!momentum || !momentum.lastKnownLocation) {
        return c.json({ 
          success: false, 
          error: 'Bus location not found' 
        }, 404);
      }

      const location = {
        lat: momentum.lastKnownLocation.latitude,
        lng: momentum.lastKnownLocation.longitude,
        status: 'En ruta',
        estimatedArrival: '2h 30min',
      };

      const mapsLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;

      console.log('📍 FlutterFlow Bus Location:', { bookingId, location });

      return c.json({
        success: true,
        data: {
          location,
          mapsLink,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Bus location error:', error);
      return c.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Location query failed' 
      }, 500);
    }
  }

  async updateGPS(c: Context) {
    try {
      const body = await c.req.json();
      const { routeId, location } = body;

      if (!routeId || !location || !location.lat || !location.lng) {
        return c.json({ 
          success: false, 
          error: 'Missing required fields: routeId, location.lat, location.lng' 
        }, 400);
      }

      gpsMomentum.updateLocation(routeId, {
        latitude: Number(location.lat || location.latitude),
        longitude: Number(location.lng || location.longitude),
        accuracy: location.accuracy ? Number(location.accuracy) : 10,
        timestamp: location.timestamp || new Date().toISOString(),
      });

      console.log('📍 FlutterFlow GPS Update:', { routeId, location });

      return c.json({
        success: true,
        data: {
          routeId,
          location,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ GPS update error:', error);
      return c.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'GPS update failed' 
      }, 500);
    }
  }

  async convertCurrency(c: Context) {
    try {
      const { amount, from, to } = c.req.query();

      if (!amount || !from || !to) {
        return c.json({ 
          success: false, 
          error: 'Missing required parameters: amount, from, to' 
        }, 400);
      }

      const result = currencyConverter.createDualCurrencyDisplay(
        Number(amount),
        from,
        to
      );

      console.log('💱 FlutterFlow Currency Conversion:', { amount, from, to, result });

      return c.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Currency conversion error:', error);
      return c.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Currency conversion failed' 
      }, 500);
    }
  }

  async detectConflicts(c: Context) {
    try {
      const body = await c.req.json();
      const { routeId, bookings } = body;

      if (!routeId || !bookings || !Array.isArray(bookings)) {
        return c.json({ 
          success: false, 
          error: 'Missing required fields: routeId, bookings (array)' 
        }, 400);
      }

      const result = conflictDetector.detectConflicts(routeId, bookings);

      console.log('⚠️ FlutterFlow Conflict Detection:', { count: result.conflicts.length });

      return c.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Conflict detection error:', error);
      return c.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Conflict detection failed' 
      }, 500);
    }
  }

  async getInflationData(c: Context) {
    try {
      const currency = c.req.query('currency');

      if (currency) {
        const vpIndexData = await globalInflationAdjuster.getVPIndex();
        const vpIndex = vpIndexData[currency as keyof typeof vpIndexData];
        const cpiData = await globalInflationAdjuster.fetchRealTimeCPI(currency);

        return c.json({
          success: true,
          data: {
            currency,
            vpIndex,
            cpiData,
          },
          timestamp: new Date().toISOString(),
        });
      }

      const report = await globalInflationAdjuster.getInflationReport();

      console.log('📊 FlutterFlow Inflation Report:', report);

      return c.json({
        success: true,
        data: report,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Inflation data error:', error);
      return c.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Inflation data query failed' 
      }, 500);
    }
  }

  async getCooloffStatus(c: Context) {
    try {
      const userId = c.req.query('userId');

      if (!userId) {
        return c.json({ 
          success: false, 
          error: 'Missing userId parameter' 
        }, 400);
      }

      const cooloff = await loyaltyLedger.getCooloffStatus(userId);

      console.log('⏰ FlutterFlow Cooloff Status:', { userId, cooloff });

      return c.json({
        success: true,
        data: cooloff,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Cooloff status error:', error);
      return c.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Cooloff status query failed' 
      }, 500);
    }
  }

  async getMerchantStats(c: Context) {
    try {
      const merchantId = c.req.query('merchantId');

      if (!merchantId) {
        return c.json({ 
          success: false, 
          error: 'Missing merchantId parameter' 
        }, 400);
      }

      const stats = {
        merchantId,
        totalPointsIssued: 15420,
        totalTransactions: 342,
        averagePointsPerTransaction: 45,
        lastTransaction: new Date().toISOString(),
      };

      console.log('📊 FlutterFlow Merchant Stats:', stats);

      return c.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('❌ Merchant stats error:', error);
      return c.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Merchant stats query failed' 
      }, 500);
    }
  }

  async getAPIStatus(c: Context) {
    return c.json({
      success: true,
      data: {
        status: 'operational',
        version: '1.0.0',
        services: {
          pricing: 'active',
          payment: 'active',
          loyalty: 'active',
          email: 'active',
          gps: 'active',
        },
        region: 'South America',
        endpoints: [
          'POST /api/ff/pricing',
          'POST /api/ff/yield',
          'POST /api/ff/payment/initiate',
          'POST /api/ff/loyalty/calculate',
          'POST /api/ff/loyalty/issue',
          'POST /api/ff/loyalty/redeem',
          'GET /api/ff/loyalty/balance',

          'GET /api/ff/bus/location',
          'POST /api/ff/gps/update',
          'GET /api/ff/currency/convert',
          'POST /api/ff/conflicts/detect',
          'GET /api/ff/inflation',
          'GET /api/ff/cooloff',
          'GET /api/ff/merchant/stats',
        ],
      },
      timestamp: new Date().toISOString(),
    });
  }
}

export const flutterflowBridge = new FlutterFlowBridge();
