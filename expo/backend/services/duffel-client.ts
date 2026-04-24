// @ts-nocheck
import { Duffel } from '@duffel/api';
import { duffelCache } from './duffel-cache';

const DUFFEL_ACCESS_TOKEN = process.env.DUFFEL_ACCESS_TOKEN || '';
const DUFFEL_ENABLED = !!DUFFEL_ACCESS_TOKEN && DUFFEL_ACCESS_TOKEN !== '';

export const duffelClient = DUFFEL_ENABLED ? new Duffel({
  token: DUFFEL_ACCESS_TOKEN,
}) : null;

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
}

export interface FlightOffer {
  id: string;
  price: number;
  currency: string;
  airline: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  segments: FlightSegment[];
}

export interface FlightSegment {
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  airline: string;
  flightNumber: string;
  aircraft: string;
}

export interface AccommodationSearchParams {
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms?: number;
}

export interface AccommodationOffer {
  id: string;
  name: string;
  price: number;
  currency: string;
  rating: number;
  address: string;
  imageUrl: string;
  amenities: string[];
  roomType: string;
}

export class DuffelService {
  async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    console.log('🔍 Duffel: Searching flights', params);

    const cached = duffelCache.getCachedFlightSearch(params);
    if (cached) {
      return cached;
    }

    if (!DUFFEL_ENABLED || !duffelClient) {
      console.log('⚠️ Duffel API not configured, returning mock data');
      return this.getMockFlights(params);
    }

    try {
      const offerRequestResponse = await duffelClient.offerRequests.create({
        slices: [
          {
            origin: params.origin,
            destination: params.destination,
            departure_date: params.departureDate,
          } as any,
        ],
        passengers: Array(params.passengers).fill({ type: 'adult' }),
        cabin_class: params.cabinClass || 'economy',
      } as any);

      const offerRequest = offerRequestResponse.data as any;
      const offers = offerRequest.offers || [];

      console.log(`✅ Found ${offers.length} flight offers`);

      const mappedOffers = offers.slice(0, 20).map((offer: any) => ({
        id: offer.id,
        price: parseFloat(offer.total_amount),
        currency: offer.total_currency,
        airline: offer.owner.name,
        departureTime: offer.slices[0].segments[0].departing_at,
        arrivalTime: offer.slices[0].segments[offer.slices[0].segments.length - 1].arriving_at,
        duration: this.calculateDuration(
          offer.slices[0].segments[0].departing_at,
          offer.slices[0].segments[offer.slices[0].segments.length - 1].arriving_at
        ),
        stops: offer.slices[0].segments.length - 1,
        segments: offer.slices[0].segments.map((segment: any) => ({
          origin: segment.origin.iata_code,
          destination: segment.destination.iata_code,
          departureTime: segment.departing_at,
          arrivalTime: segment.arriving_at,
          airline: segment.operating_carrier.name,
          flightNumber: segment.operating_carrier_flight_number,
          aircraft: segment.aircraft?.name || 'Unknown',
        })),
      }));

      duffelCache.cacheFlightSearch(params, mappedOffers);

      return mappedOffers;
    } catch (error: any) {
      console.error('❌ Duffel flight search error:', error);
      console.log('⚠️ Falling back to mock data');
      return this.getMockFlights(params);
    }
  }

  async getFlightOffer(offerId: string): Promise<FlightOffer | null> {
    const cached = duffelCache.getCachedOffer(offerId);
    if (cached) {
      return cached;
    }

    if (!DUFFEL_ENABLED || !duffelClient) {
      console.log('⚠️ Duffel API not configured');
      return null;
    }

    try {
      const offerResponse = await duffelClient.offers.get(offerId);
      const offer = offerResponse.data;

      const mappedOffer: FlightOffer = {
        id: offer.id,
        price: parseFloat(offer.total_amount),
        currency: offer.total_currency,
        airline: offer.owner.name,
        departureTime: offer.slices[0].segments[0].departing_at,
        arrivalTime: offer.slices[0].segments[offer.slices[0].segments.length - 1].arriving_at,
        duration: this.calculateDuration(
          offer.slices[0].segments[0].departing_at,
          offer.slices[0].segments[offer.slices[0].segments.length - 1].arriving_at
        ),
        stops: offer.slices[0].segments.length - 1,
        segments: offer.slices[0].segments.map((segment: any) => ({
          origin: segment.origin.iata_code,
          destination: segment.destination.iata_code,
          departureTime: segment.departing_at,
          arrivalTime: segment.arriving_at,
          airline: segment.operating_carrier.name,
          flightNumber: segment.operating_carrier_flight_number,
          aircraft: segment.aircraft?.name || 'Unknown',
        })),
      };

      duffelCache.cacheOffer(offerId, mappedOffer);

      return mappedOffer;
    } catch (error: any) {
      console.error('❌ Duffel get offer error:', error);
      return null;
    }
  }

  async createBooking(offerId: string, passengers: any[]): Promise<any> {
    if (!DUFFEL_ENABLED || !duffelClient) {
      console.log('⚠️ Duffel API not configured, returning mock booking');
      return {
        bookingId: `MOCK_${Date.now()}`,
        bookingReference: `ANR${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        status: 'confirmed',
        totalAmount: '0.00',
        currency: 'USD',
      };
    }

    try {
      console.log('📝 Creating booking for offer:', offerId);

      const orderResponse = await duffelClient.orders.create({
        type: 'instant',
        selected_offers: [offerId],
        payments: [
          {
            type: 'balance',
            amount: '0.00',
            currency: 'USD',
          },
        ],
        passengers: passengers.map((passenger, index) => ({
          id: `passenger_${index}`,
          type: 'adult' as const,
          title: passenger.title,
          given_name: passenger.firstName,
          family_name: passenger.lastName,
          gender: passenger.gender || 'm',
          born_on: passenger.dateOfBirth,
          email: passenger.email,
          phone_number: passenger.phone,
        })),
      } as any);

      const order = orderResponse.data;

      console.log('✅ Booking created:', order.id);

      return {
        bookingId: order.id,
        bookingReference: order.booking_reference,
        status: 'confirmed',
        totalAmount: order.total_amount,
        currency: order.total_currency,
      };
    } catch (error: any) {
      console.error('❌ Duffel booking error:', error);
      throw new Error(`Booking failed: ${error.message}`);
    }
  }

  async searchAccommodations(params: AccommodationSearchParams): Promise<AccommodationOffer[]> {
    console.log('🏨 Searching accommodations (mock data)', params);

    return [
      {
        id: 'hotel_1',
        name: 'Hotel Boutique Lima Centro',
        price: 85,
        currency: 'USD',
        rating: 4.5,
        address: 'Miraflores, Lima, Peru',
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        amenities: ['WiFi', 'Breakfast', 'Pool', 'Gym'],
        roomType: 'Deluxe Room',
      },
      {
        id: 'hotel_2',
        name: 'Cusco Historic Inn',
        price: 120,
        currency: 'USD',
        rating: 4.8,
        address: 'Plaza de Armas, Cusco, Peru',
        imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
        amenities: ['WiFi', 'Breakfast', 'Bar', 'Restaurant'],
        roomType: 'Colonial Suite',
      },
      {
        id: 'hotel_3',
        name: 'Bogotá Modern Suites',
        price: 95,
        currency: 'USD',
        rating: 4.6,
        address: 'Zona Rosa, Bogotá, Colombia',
        imageUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
        amenities: ['WiFi', 'Kitchenette', 'Concierge'],
        roomType: 'Studio Suite',
      },
    ];
  }

  private getMockFlights(params: FlightSearchParams): FlightOffer[] {
    const departureDate = new Date(params.departureDate);
    const baseTime = departureDate.getTime();

    const airlines = [
      { name: 'LATAM Airlines', code: 'LA' },
      { name: 'Avianca', code: 'AV' },
      { name: 'Azul', code: 'AD' },
      { name: 'GOL', code: 'G3' },
      { name: 'Copa Airlines', code: 'CM' },
    ];

    return airlines.map((airline, index) => {
      const departureTime = new Date(baseTime + (index * 2 * 60 * 60 * 1000));
      const arrivalTime = new Date(departureTime.getTime() + (3 + index) * 60 * 60 * 1000);

      return {
        id: `mock_${params.origin}_${params.destination}_${index}`,
        price: 150 + index * 50,
        currency: 'USD',
        airline: airline.name,
        departureTime: departureTime.toISOString(),
        arrivalTime: arrivalTime.toISOString(),
        duration: this.calculateDuration(departureTime.toISOString(), arrivalTime.toISOString()),
        stops: index % 2,
        segments: [
          {
            origin: params.origin,
            destination: params.destination,
            departureTime: departureTime.toISOString(),
            arrivalTime: arrivalTime.toISOString(),
            airline: airline.name,
            flightNumber: `${airline.code}${1000 + index}`,
            aircraft: 'Boeing 737-800',
          },
        ],
      };
    });
  }

  private calculateDuration(departure: string, arrival: string): string {
    const durationMs = new Date(arrival).getTime() - new Date(departure).getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }
}

export const duffelService = new DuffelService();
