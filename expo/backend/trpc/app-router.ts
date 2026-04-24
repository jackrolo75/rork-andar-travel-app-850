import { createTRPCRouter } from './create-context';
import { pricingRouter } from './routes/pricing';
import { paymentRouter } from './routes/payment';
import { loyaltyRouter } from './routes/loyalty';
import { yieldRouter } from './routes/yield';
import { merchantRouter } from './routes/merchant';
import { operatorRouter } from './routes/operator';
import { inflationRouter } from './routes/inflation';
import { duffelRouter } from './routes/duffel';
import { itineraryRouter } from './routes/itinerary';
import { partnersRouter } from './routes/partners';
import { stripeRouter } from './routes/stripe';

export const appRouter = createTRPCRouter({
  pricing: pricingRouter,
  payment: paymentRouter,
  loyalty: loyaltyRouter,
  yield: yieldRouter,
  merchant: merchantRouter,
  operator: operatorRouter,
  inflation: inflationRouter,
  duffel: duffelRouter,
  itinerary: itineraryRouter,
  partners: partnersRouter,
  stripe: stripeRouter,
});

export type AppRouter = typeof appRouter;
