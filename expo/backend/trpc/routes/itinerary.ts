// @ts-nocheck
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';
import {
  createItinerary,
  getItinerary,
  getItineraries,
  updateItinerary,
  deleteItinerary,
  addItineraryItem,
  updateItineraryItem,
  removeItineraryItem,
  reorderItineraryItem,
  duplicateItinerary,
  getItineraryTemplates,
  createFromTemplate,
  getItineraryStats,
} from '../../services/itinerary';

const locationSchema = z.object({
  city: z.string(),
  country: z.string(),
  countryCode: z.string().optional(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  timezone: z.string().optional(),
  airport: z.string().optional(),
});

const itineraryItemBaseSchema = z.object({
  type: z.enum(['flight', 'hotel', 'transport', 'activity', 'esim', 'car_rental', 'ferry', 'train', 'bus']),
  title: z.string(),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  duration: z.string().optional(),
  location: locationSchema,
  price: z.number(),
  currency: z.string(),
  bookingStatus: z.enum(['not_booked', 'pending', 'confirmed', 'cancelled', 'completed']),
  bookingReference: z.string().optional(),
  affiliateLinkId: z.string().optional(),
  affiliateUrl: z.string().optional(),
  partnerName: z.string().optional(),
  partnerLogo: z.string().optional(),
  imageUrl: z.string().optional(),
  notes: z.string().optional(),
  confirmationNumber: z.string().optional(),
});

export const itineraryRouter = createTRPCRouter({
  create: publicProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      startDate: z.string(),
      endDate: z.string(),
      destinations: z.array(locationSchema).min(1),
      travelers: z.number().optional(),
      currency: z.string().optional(),
      totalBudget: z.number().optional(),
    }))
    .mutation(async (opts) => {
      const { input } = opts;
      console.log('📋 Creating itinerary:', input.title);
      return createItinerary(input);
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async (opts) => {
      const { input } = opts;
      console.log('📖 Fetching itinerary:', input.id);
      return getItinerary(input.id);
    }),

  list: publicProcedure
    .input(z.object({
      status: z.enum(['draft', 'planned', 'booked', 'in_progress', 'completed', 'cancelled']).optional(),
      startDateFrom: z.string().optional(),
      startDateTo: z.string().optional(),
      destination: z.string().optional(),
      minBudget: z.number().optional(),
      maxBudget: z.number().optional(),
    }).optional())
    .query(async (opts) => {
      const { input } = opts;
      console.log('📚 Listing itineraries');
      return getItineraries(input);
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      title: z.string().optional(),
      description: z.string().optional(),
      coverImage: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      status: z.enum(['draft', 'planned', 'booked', 'in_progress', 'completed', 'cancelled']).optional(),
      destinations: z.array(locationSchema).optional(),
      totalBudget: z.number().optional(),
      currency: z.string().optional(),
      travelers: z.number().optional(),
      tags: z.array(z.string()).optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async (opts) => {
      const { input } = opts;
      console.log('✏️ Updating itinerary:', input.id);
      return updateItinerary(input);
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async (opts) => {
      const { input } = opts;
      console.log('🗑️ Deleting itinerary:', input.id);
      return deleteItinerary(input.id);
    }),

  duplicate: publicProcedure
    .input(z.object({
      id: z.string(),
      newTitle: z.string().optional(),
    }))
    .mutation(async (opts) => {
      const { input } = opts;
      console.log('📋 Duplicating itinerary:', input.id);
      return duplicateItinerary(input.id, input.newTitle);
    }),

  addItem: publicProcedure
    .input(z.object({
      itineraryId: z.string(),
      dayIndex: z.number(),
      item: itineraryItemBaseSchema.extend({
        origin: locationSchema.optional(),
        destination: locationSchema.optional(),
        airline: z.string().optional(),
        flightNumber: z.string().optional(),
        departureTime: z.string().optional(),
        arrivalTime: z.string().optional(),
        cabin: z.enum(['economy', 'premium_economy', 'business', 'first']).optional(),
        baggage: z.string().optional(),
        layovers: z.number().optional(),
        hotelName: z.string().optional(),
        address: z.string().optional(),
        checkIn: z.string().optional(),
        checkOut: z.string().optional(),
        roomType: z.string().optional(),
        nights: z.number().optional(),
        guests: z.number().optional(),
        amenities: z.array(z.string()).optional(),
        rating: z.number().optional(),
        operator: z.string().optional(),
        vehicleType: z.string().optional(),
        seatClass: z.string().optional(),
        activityName: z.string().optional(),
        venue: z.string().optional(),
        category: z.string().optional(),
        ticketType: z.string().optional(),
        participants: z.number().optional(),
        inclusions: z.array(z.string()).optional(),
        provider: z.string().optional(),
        dataAmount: z.string().optional(),
        validityDays: z.number().optional(),
        coverage: z.array(z.string()).optional(),
        activationDate: z.string().optional(),
        pickupLocation: locationSchema.optional(),
        dropoffLocation: locationSchema.optional(),
        pickupTime: z.string().optional(),
        dropoffTime: z.string().optional(),
        company: z.string().optional(),
        insurance: z.string().optional(),
        extras: z.array(z.string()).optional(),
      }),
    }))
    .mutation(async (opts) => {
      const { input } = opts;
      console.log('➕ Adding item to itinerary:', input.itineraryId);
      return addItineraryItem(input);
    }),

  updateItem: publicProcedure
    .input(z.object({
      itineraryId: z.string(),
      itemId: z.string(),
      updates: z.record(z.any()),
    }))
    .mutation(async (opts) => {
      const { input } = opts;
      console.log('✏️ Updating item:', input.itemId);
      return updateItineraryItem({ itineraryId: input.itineraryId, itemId: input.itemId, updates: input.updates });
    }),

  removeItem: publicProcedure
    .input(z.object({
      itineraryId: z.string(),
      itemId: z.string(),
    }))
    .mutation(async (opts) => {
      const { input } = opts;
      console.log('🗑️ Removing item:', input.itemId);
      return removeItineraryItem(input.itineraryId, input.itemId);
    }),

  reorderItem: publicProcedure
    .input(z.object({
      itineraryId: z.string(),
      itemId: z.string(),
      newDayIndex: z.number(),
      newOrder: z.number(),
    }))
    .mutation(async (opts) => {
      const { input } = opts;
      console.log('🔄 Reordering item:', input.itemId);
      return reorderItineraryItem(input);
    }),

  getStats: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async (opts) => {
      const { input } = opts;
      const itinerary = await getItinerary(input.id);
      if (!itinerary) return null;
      return getItineraryStats(itinerary);
    }),

  templates: publicProcedure
    .query(async () => {
      console.log('📚 Fetching templates');
      return getItineraryTemplates();
    }),

  createFromTemplate: publicProcedure
    .input(z.object({
      templateId: z.string(),
      startDate: z.string(),
    }))
    .mutation(async (opts) => {
      const { input } = opts;
      console.log('📋 Creating from template:', input.templateId);
      return createFromTemplate(input.templateId, input.startDate);
    }),
});
