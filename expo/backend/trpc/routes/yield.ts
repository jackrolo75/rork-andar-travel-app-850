// @ts-nocheck
import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { YieldManager } from '@/backend/services/yield-manager';

const yieldManager = new YieldManager();

export const yieldRouter = createTRPCRouter({
  calculateYieldPrice: publicProcedure
    .input(z.object({
      routeId: z.string(),
      origin: z.string(),
      destination: z.string(),
      basePrice: z.number(),
      currency: z.string(),
      seatsRemaining: z.number(),
      totalSeats: z.number(),
      date: z.string(),
      mode: z.enum(['bus', 'flight']),
    }))
    .mutation(({ input }) => {
      return yieldManager.calculateYieldPrice(input);
    }),

  batchCalculateYieldPrices: publicProcedure
    .input(z.array(z.object({
      routeId: z.string(),
      origin: z.string(),
      destination: z.string(),
      basePrice: z.number(),
      currency: z.string(),
      seatsRemaining: z.number(),
      totalSeats: z.number(),
      date: z.string(),
      mode: z.enum(['bus', 'flight']),
    })))
    .mutation(({ input }) => {
      return yieldManager.batchCalculateYieldPrices(input);
    }),

  getAuditLogs: publicProcedure
    .input(z.object({
      routeId: z.string().optional(),
    }))
    .query(({ input }) => {
      return yieldManager.getAuditLogs(input.routeId);
    }),

  exportAuditTrail: publicProcedure
    .query(() => {
      return {
        trail: yieldManager.exportAuditTrail(),
        timestamp: new Date().toISOString(),
      };
    }),

  updateHistoricalData: publicProcedure
    .input(z.object({
      routeKey: z.string(),
      averageBookingRate: z.number().min(0).max(1),
      peakDemandMultiplier: z.number().min(1),
      lastUpdated: z.string(),
    }))
    .mutation(({ input }) => {
      yieldManager.updateHistoricalData(input.routeKey, {
        routeKey: input.routeKey,
        averageBookingRate: input.averageBookingRate,
        peakDemandMultiplier: input.peakDemandMultiplier,
        lastUpdated: input.lastUpdated,
      });
      return { success: true };
    }),
});
