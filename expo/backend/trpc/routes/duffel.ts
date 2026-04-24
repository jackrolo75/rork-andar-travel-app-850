// @ts-nocheck
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import { duffelService } from '../../services/duffel-client';

export const duffelRouter = createTRPCRouter({
  searchFlights: publicProcedure
    .input(
      z.object({
        origin: z.string(),
        destination: z.string(),
        departureDate: z.string(),
        returnDate: z.string().optional(),
        passengers: z.number().min(1).max(9),
        cabinClass: z.enum(['economy', 'premium_economy', 'business', 'first']).optional(),
      })
    )
    .query(async ({ input }) => {
      console.log('🔍 tRPC: Searching flights via Duffel', input);

      const flights = await duffelService.searchFlights(input);

      return {
        success: true,
        flights,
        count: flights.length,
      };
    }),

  getFlightOffer: publicProcedure
    .input(
      z.object({
        offerId: z.string(),
      })
    )
    .query(async ({ input }) => {
      console.log('🎫 tRPC: Getting flight offer', input.offerId);

      const offer = await duffelService.getFlightOffer(input.offerId);

      if (!offer) {
        throw new Error('Flight offer not found');
      }

      return {
        success: true,
        offer,
      };
    }),

  createBooking: publicProcedure
    .input(
      z.object({
        offerId: z.string(),
        passengers: z.array(
          z.object({
            title: z.string(),
            firstName: z.string(),
            lastName: z.string(),
            dateOfBirth: z.string(),
            email: z.string().email(),
            phone: z.string(),
            gender: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      console.log('📝 tRPC: Creating booking', input.offerId);

      const booking = await duffelService.createBooking(input.offerId, input.passengers);

      return {
        success: true,
        booking,
      };
    }),

  searchAccommodations: publicProcedure
    .input(
      z.object({
        location: z.string(),
        checkIn: z.string(),
        checkOut: z.string(),
        guests: z.number().min(1),
        rooms: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      console.log('🏨 tRPC: Searching accommodations', input);

      const accommodations = await duffelService.searchAccommodations(input);

      return {
        success: true,
        accommodations,
        count: accommodations.length,
      };
    }),
});
