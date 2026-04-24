// @ts-nocheck
import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { PaymentWaterfallService } from '@/backend/services/payment-waterfall';

const paymentService = new PaymentWaterfallService();

export const paymentRouter = createTRPCRouter({
  processPayment: publicProcedure
    .input(z.object({
      amount: z.number().positive(),
      currency: z.string(),
      country: z.string(),
      paymentMethod: z.string(),
      userId: z.string(),
      tripId: z.string(),
      metadata: z.record(z.string(), z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      return await paymentService.processPayment(input);
    }),
    
  getAvailablePaymentMethods: publicProcedure
    .input(z.object({
      country: z.string(),
    }))
    .query(({ input }) => {
      return paymentService.getAvailablePaymentMethods(input.country);
    }),
});
