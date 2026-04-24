// @ts-nocheck
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';

export const merchantRouter = createTRPCRouter({
  getBalance: publicProcedure
    .input(
      z.object({
        merchantId: z.string(),
      })
    )
    .query(async ({ input }) => {
      console.log('🏪 Merchant: Fetching balance', input.merchantId);

      return {
        merchantId: input.merchantId,
        merchantName: 'Kiosko La Terminal',
        totalSales: 12850.50,
        pointsIssued: 128505,
        pendingPayout: 12850.50,
        currency: 'PEN',
        lastTransaction: new Date().toISOString(),
      };
    }),

  requestPayout: publicProcedure
    .input(
      z.object({
        merchantId: z.string(),
        amount: z.number().positive(),
        currency: z.string(),
        paymentMethod: z.enum(['yape', 'nequi']),
        accountNumber: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      console.log('💰 Merchant: Processing payout request', input);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const payoutId = `PAYOUT_${Date.now()}`;

      console.log('✅ Merchant: Payout processed', {
        payoutId,
        amount: input.amount,
        method: input.paymentMethod,
      });

      return {
        success: true,
        payoutId,
        amount: input.amount,
        currency: input.currency,
        paymentMethod: input.paymentMethod,
        status: 'processing',
        estimatedArrival: '1-3 días hábiles',
        timestamp: new Date().toISOString(),
      };
    }),
});
