// @ts-nocheck
import * as z from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { DynamicPricingEngine } from '@/backend/services/pricing-engine';

const pricingEngine = new DynamicPricingEngine();

export const pricingRouter = createTRPCRouter({
  calculatePrice: publicProcedure
    .input(z.object({
      basePrice: z.number(),
      route: z.object({
        origin: z.string(),
        destination: z.string(),
        distance: z.number(),
        altitudeGain: z.number().optional(),
      }),
      date: z.string(),
      demand: z.number().min(0).max(1),
      regionalHolidays: z.array(z.string()).optional(),
    }))
    .mutation(({ input }) => {
      return pricingEngine.calculateDynamicPrice({
        ...input,
        regionalHolidays: input.regionalHolidays || [],
      });
    }),
    
  batchCalculate: publicProcedure
    .input(z.array(z.object({
      basePrice: z.number(),
      route: z.object({
        origin: z.string(),
        destination: z.string(),
        distance: z.number(),
        altitudeGain: z.number().optional(),
      }),
      date: z.string(),
      demand: z.number().min(0).max(1),
      regionalHolidays: z.array(z.string()).optional(),
    })))
    .mutation(({ input }) => {
      const contextsWithDefaults = input.map(ctx => ({
        ...ctx,
        regionalHolidays: ctx.regionalHolidays || [],
      }));
      return pricingEngine.batchCalculate(contextsWithDefaults);
    }),
});
