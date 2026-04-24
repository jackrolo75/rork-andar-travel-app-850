// @ts-nocheck
import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { LoyaltyLedgerService } from '@/backend/services/loyalty-ledger';
import { emitPointsConfirmation } from '@/backend/hono';

const loyaltyService = new LoyaltyLedgerService();

export const loyaltyRouter = createTRPCRouter({
  calculateKiloPoints: publicProcedure
    .input(z.object({
      userId: z.string(),
      tripDistance: z.number(),
      tripPrice: z.number(),
      tripCurrency: z.string(),
      tripMode: z.enum(['bus', 'flight']),
    }))
    .mutation(({ input }) => {
      return loyaltyService.calculateKiloPoints(
        input.userId,
        input.tripDistance,
        input.tripPrice,
        input.tripCurrency,
        input.tripMode
      );
    }),
    
  issuePoints: publicProcedure
    .input(z.object({
      userId: z.string(),
      points: z.number().positive(),
      merchantId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      await loyaltyService.issuePoints(input.userId, input.points);
      
      if (input.merchantId) {
        const transactionId = `TXN_${Date.now()}_${input.userId}`;
        emitPointsConfirmation(input.merchantId, {
          transactionId,
          userId: input.userId,
          points: input.points,
        });
      }
      
      return { success: true };
    }),
    
  redeemPoints: publicProcedure
    .input(z.object({
      userId: z.string(),
      pointsToRedeem: z.number().positive(),
      merchantId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await loyaltyService.redeemPoints(
        input.userId,
        input.pointsToRedeem,
        input.merchantId
      );
      return result;
    }),
    
  getMemberStatus: publicProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ input }) => {
      return await loyaltyService.getMemberStatus(input.userId);
    }),
    
  validateTerminalQR: publicProcedure
    .input(z.object({
      qrCode: z.string(),
      userId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const isValid = await loyaltyService.validateTerminalQR(
        input.qrCode,
        input.userId
      );
      return { valid: isValid };
    }),
    
  getCooloffStatus: publicProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ input }) => {
      return await loyaltyService.getCooloffStatus(input.userId);
    }),
});
