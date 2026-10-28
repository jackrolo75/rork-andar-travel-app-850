import { createTRPCRouter } from './create-context';
import { pricingRouter } from './routes/pricing';
import { loyaltyRouter } from './routes/loyalty';
import { yieldRouter } from './routes/yield';
import { operatorRouter } from './routes/operator';
import { inflationRouter } from './routes/inflation';
import { itineraryRouter } from './routes/itinerary';
import { partnersRouter } from './routes/partners';

export const appRouter = createTRPCRouter({
  pricing: pricingRouter,
  loyalty: loyaltyRouter,
  yield: yieldRouter,
  operator: operatorRouter,
  inflation: inflationRouter,
  itinerary: itineraryRouter,
  partners: partnersRouter,
});

export type AppRouter = typeof appRouter;
