// @ts-nocheck
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../create-context';

export type PartnerCategory = 
  | 'flights'
  | 'activities'
  | 'transport'
  | 'car_rental'
  | 'esim'
  | 'hotels'
  | 'insurance';

export type PartnerServiceType = 
  | 'flight'
  | 'hotel'
  | 'hostel'
  | 'tour'
  | 'activity'
  | 'car_rental'
  | 'transfer'
  | 'insurance'
  | 'sim_card'
  | 'ferry'
  | 'bus'
  | 'train';

export interface Partner {
  id: string;
  name: string;
  category: PartnerCategory;
  serviceType: PartnerServiceType;
  description: string;
  affiliateUrl: string;
  baseUrl: string;
  logoUrl?: string;
  iconName: string;
  themeColor: string;
  commissionRate: number;
  tags: string[];
  regions: string[];
  featured: boolean;
  priority: number;
  isActive: boolean;
  maxDiscount?: string;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

const ANDAR_PARTNERS: Partner[] = [
  {
    id: 'klook-activities',
    name: 'Klook',
    category: 'activities',
    serviceType: 'activity',
    description: 'Book attractions, tours, and local experiences worldwide with exclusive discounts',
    affiliateUrl: 'https://tp.media/r?marker=698160&trs=491382&p=4110&u=https%3A%2F%2Fklook.com&campaign_id=137',
    baseUrl: 'https://klook.com',
    logoUrl: 'https://cdn.klook.com/images/logo.svg',
    iconName: 'MapPin',
    themeColor: '#FF5722',
    commissionRate: 5,
    tags: ['tours', 'activities', 'attractions', 'experiences'],
    regions: ['global', 'asia', 'europe'],
    featured: true,
    priority: 1,
    isActive: true,
    maxDiscount: 'Up to 50% off',
    clickCount: 12350,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2026-02-12T00:00:00Z',
  },
  {
    id: 'localrent-cars',
    name: 'Localrent',
    category: 'car_rental',
    serviceType: 'car_rental',
    description: 'Rent cars directly from local owners at the best prices with full insurance',
    affiliateUrl: 'https://tp.media/r?marker=698160&trs=491382&p=2043&u=https%3A%2F%2Flocalrent.com%2Fen&campaign_id=87',
    baseUrl: 'https://localrent.com',
    logoUrl: 'https://localrent.com/images/logo.svg',
    iconName: 'Car',
    themeColor: '#4CAF50',
    commissionRate: 8,
    tags: ['car rental', 'local', 'cheap', 'insurance included'],
    regions: ['global', 'europe', 'asia'],
    featured: true,
    priority: 1,
    isActive: true,
    maxDiscount: 'Up to 30% off',
    clickCount: 8920,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2026-02-12T00:00:00Z',
  },
  {
    id: 'welcome-pickups',
    name: 'Welcome Pickups',
    category: 'transport',
    serviceType: 'transfer',
    description: 'Premium airport transfers with local English-speaking drivers and personalized service',
    affiliateUrl: 'https://tp.media/r?marker=698160&trs=491382&p=8919&u=https%3A%2F%2Fwelcomepickups.com&campaign_id=627',
    baseUrl: 'https://welcomepickups.com',
    logoUrl: 'https://welcomepickups.com/images/logo.svg',
    iconName: 'Car',
    themeColor: '#2196F3',
    commissionRate: 10,
    tags: ['transfers', 'airport', 'premium', 'english-speaking'],
    regions: ['global', 'europe'],
    featured: true,
    priority: 1,
    isActive: true,
    maxDiscount: 'Free cancellation',
    clickCount: 5230,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2026-02-12T00:00:00Z',
  },
  {
    id: 'tiqets-activities',
    name: 'Tiqets',
    category: 'activities',
    serviceType: 'activity',
    description: 'Skip-the-line tickets to museums, attractions and experiences worldwide',
    affiliateUrl: 'https://tiqets.tpx.lv/eho1RwzR',
    baseUrl: 'https://tiqets.com',
    logoUrl: 'https://tiqets.com/images/logo.svg',
    iconName: 'Ticket',
    themeColor: '#00BCD4',
    commissionRate: 8,
    tags: ['tickets', 'museums', 'attractions', 'skip-the-line'],
    regions: ['global', 'europe', 'north_america'],
    featured: true,
    priority: 2,
    isActive: true,
    maxDiscount: 'Skip-the-line tickets',
    clickCount: 6120,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2026-02-12T00:00:00Z',
  },
  {
    id: 'yesim-esim',
    name: 'Yesim eSIM',
    category: 'esim',
    serviceType: 'sim_card',
    description: 'Instant eSIM data plans for 200+ countries - stay connected anywhere without roaming fees',
    affiliateUrl: 'https://tp.media/r?marker=698160&trs=491382&p=5998&u=https%3A%2F%2Fyesim.tech&campaign_id=224',
    baseUrl: 'https://yesim.tech',
    logoUrl: 'https://yesim.tech/images/logo.svg',
    iconName: 'Wifi',
    themeColor: '#9C27B0',
    commissionRate: 15,
    tags: ['esim', 'data', 'roaming', 'international', 'instant'],
    regions: ['global'],
    featured: true,
    priority: 1,
    isActive: true,
    maxDiscount: 'From $4.99',
    clickCount: 9870,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2026-02-12T00:00:00Z',
  },
  {
    id: 'kiwitaxi-transfers',
    name: 'Kiwitaxi',
    category: 'transport',
    serviceType: 'transfer',
    description: 'Pre-book airport transfers and private transportation worldwide at fixed prices',
    affiliateUrl: 'https://tp.media/r?marker=698160&trs=491382&p=647&u=https%3A%2F%2Fkiwitaxi.com&campaign_id=1',
    baseUrl: 'https://kiwitaxi.com',
    logoUrl: 'https://kiwitaxi.com/images/logo.svg',
    iconName: 'Bus',
    themeColor: '#8BC34A',
    commissionRate: 10,
    tags: ['transfers', 'airport', 'taxi', 'private', 'fixed price'],
    regions: ['global'],
    featured: true,
    priority: 2,
    isActive: true,
    maxDiscount: 'Fixed prices',
    clickCount: 6540,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2026-02-12T00:00:00Z',
  },
  {
    id: 'economybookings-cars',
    name: 'EconomyBookings',
    category: 'car_rental',
    serviceType: 'car_rental',
    description: 'Compare car rental prices from top providers worldwide - best price guaranteed',
    affiliateUrl: 'https://tp.media/r?marker=698160&trs=491382&p=2018&u=https%3A%2F%2Fwww.economybookings.com&campaign_id=10',
    baseUrl: 'https://www.economybookings.com',
    logoUrl: 'https://economybookings.com/images/logo.svg',
    iconName: 'Car',
    themeColor: '#FF9800',
    commissionRate: 7,
    tags: ['car rental', 'compare', 'cheap', 'worldwide', 'best price'],
    regions: ['global'],
    featured: true,
    priority: 2,
    isActive: true,
    maxDiscount: 'Up to 40% off',
    clickCount: 5230,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2026-02-12T00:00:00Z',
  },
  {
    id: 'aviasales-flights',
    name: 'Aviasales',
    category: 'flights',
    serviceType: 'flight',
    description: 'Compare flight prices from 728 airlines and dozens of travel agencies worldwide',
    affiliateUrl: 'https://tp.media/r?marker=698160&trs=491382&p=4114&u=https%3A%2Faviasales.com&campaign_id=100',
    baseUrl: 'https://aviasales.com',
    logoUrl: 'https://cdn.aviasales.com/assets/images/logo.svg',
    iconName: 'Plane',
    themeColor: '#FF6D00',
    commissionRate: 1.5,
    tags: ['flights', 'cheap', 'compare', 'international'],
    regions: ['global'],
    featured: true,
    priority: 1,
    isActive: true,
    maxDiscount: 'Up to 40% off',
    clickCount: 15420,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2026-02-12T00:00:00Z',
  },
  {
    id: 'eatwith-dining',
    name: 'EatWith',
    category: 'activities',
    serviceType: 'activity',
    description: 'Authentic dining experiences and cooking classes hosted by local chefs worldwide',
    affiliateUrl: 'https://tp.media/r?marker=581079&trs=364656&p=4696&u=https%3A%2F%2Featwith.com&campaign_id=164',
    baseUrl: 'https://eatwith.com',
    logoUrl: 'https://eatwith.com/images/logo.svg',
    iconName: 'UtensilsCrossed',
    themeColor: '#E64A19',
    commissionRate: 7,
    tags: ['dining', 'cooking class', 'food tour', 'local chef', 'culinary experience'],
    regions: ['global', 'europe', 'asia', 'north_america'],
    featured: true,
    priority: 2,
    isActive: true,
    maxDiscount: 'Unique local experiences',
    clickCount: 4180,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2026-03-28T00:00:00Z',
  },
  {
    id: 'indrive-rides',
    name: 'inDrive',
    category: 'transport',
    serviceType: 'transfer',
    description: 'Negotiate your ride price - fair taxi fares in 700+ cities worldwide',
    affiliateUrl: 'https://tp.media/r?marker=698160&trs=491382&p=4110&u=https%3A%2F%2Findrive.com&campaign_id=138',
    baseUrl: 'https://indrive.com',
    logoUrl: 'https://indrive.com/images/logo.svg',
    iconName: 'Car',
    themeColor: '#00C853',
    commissionRate: 5,
    tags: ['taxi', 'rides', 'negotiate', 'city transport'],
    regions: ['global', 'asia', 'south_america', 'africa'],
    featured: true,
    priority: 3,
    isActive: true,
    maxDiscount: 'Set your price',
    clickCount: 3420,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2026-02-12T00:00:00Z',
  },
];

function deduplicatePartners(partners: Partner[]): Partner[] {
  const seen = new Map<string, Partner>();
  
  for (const partner of partners) {
    const baseUrlKey = partner.baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
    const existingPartner = seen.get(baseUrlKey);
    
    if (!existingPartner || partner.priority < existingPartner.priority) {
      seen.set(baseUrlKey, partner);
    }
  }
  
  return Array.from(seen.values()).sort((a, b) => a.priority - b.priority);
}

const deduplicatedPartners = deduplicatePartners(ANDAR_PARTNERS);

export const partnersRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      serviceType: z.string().optional(),
      region: z.string().optional(),
      featured: z.boolean().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      console.log('🤝 Listing partners:', input);
      let filtered = [...deduplicatedPartners];

      if (input?.category) {
        filtered = filtered.filter(p => p.category === input.category);
      }
      if (input?.serviceType) {
        filtered = filtered.filter(p => p.serviceType === input.serviceType);
      }
      if (input?.region) {
        filtered = filtered.filter(p => 
          p.regions.includes('global') || p.regions.includes(input.region!)
        );
      }
      if (input?.featured !== undefined) {
        filtered = filtered.filter(p => p.featured === input.featured);
      }
      if (input?.search) {
        const searchLower = input.search.toLowerCase();
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.tags.some(t => t.toLowerCase().includes(searchLower))
        );
      }

      return {
        partners: filtered.filter(p => p.isActive),
        total: filtered.filter(p => p.isActive).length,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      console.log('🔍 Getting partner:', input.id);
      return deduplicatedPartners.find(p => p.id === input.id) || null;
    }),

  getFeatured: publicProcedure
    .query(async () => {
      console.log('⭐ Getting featured partners');
      return deduplicatedPartners
        .filter(p => p.featured && p.isActive)
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 6);
    }),

  getByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      console.log('📁 Getting partners by category:', input.category);
      return deduplicatedPartners
        .filter(p => p.category === input.category && p.isActive)
        .sort((a, b) => a.priority - b.priority);
    }),

  getCategories: publicProcedure
    .query(async () => {
      console.log('📂 Getting partner categories');
      return [
        { id: 'flights', name: 'Flights', icon: 'Plane', color: '#4A90D9' },
        { id: 'activities', name: 'Tours & Activities', icon: 'MapPin', color: '#2D5A27' },
        { id: 'transport', name: 'Transfers & Rides', icon: 'Bus', color: '#E85D75' },
        { id: 'car_rental', name: 'Car Rentals', icon: 'Car', color: '#F5A623' },
        { id: 'esim', name: 'eSIM & Data', icon: 'Wifi', color: '#7B68EE' },
        { id: 'hotels', name: 'Hotels', icon: 'Hotel', color: '#00BFA5' },
        { id: 'insurance', name: 'Insurance', icon: 'Shield', color: '#FF6B35' },
      ];
    }),

  trackClick: publicProcedure
    .input(z.object({
      partnerId: z.string(),
      sessionId: z.string().optional(),
      source: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      console.log('📊 Tracking click:', input.partnerId);
      const partner = deduplicatedPartners.find(p => p.id === input.partnerId);
      if (partner) {
        partner.clickCount += 1;
        partner.updatedAt = new Date().toISOString();
      }
      return { success: true, clickCount: partner?.clickCount || 0 };
    }),

  getAffiliateUrl: publicProcedure
    .input(z.object({
      partnerId: z.string(),
      customParams: z.record(z.string()).optional(),
    }))
    .query(async ({ input }) => {
      console.log('🔗 Getting affiliate URL:', input.partnerId);
      const partner = deduplicatedPartners.find(p => p.id === input.partnerId);
      if (!partner) return null;

      let url = partner.affiliateUrl;
      if (input.customParams) {
        const params = new URLSearchParams(input.customParams);
        url += (url.includes('?') ? '&' : '?') + params.toString();
      }

      return {
        url,
        partner: {
          id: partner.id,
          name: partner.name,
          description: partner.description,
        },
      };
    }),

  getDisclosure: publicProcedure
    .query(async () => {
      return {
        standard: "This page contains affiliate links. We may earn a commission if you book through our links at no extra cost to you.",
        detailed: "Affiliate Disclosure: AndarTravel partners with trusted travel providers including Klook, Aviasales, Tiqets, Yesim, and others. When you book through these links, we may earn a commission at no additional cost to you. This helps support our free service. Prices and availability are determined by our partners.",
        minimal: "Contains affiliate links. We may earn commission.",
        legal: "AndarTravel does not provide legal, visa, or immigration advice. Prices displayed are indicative and controlled by our partner providers. We recommend verifying all booking details, prices, and terms directly with the provider before completing any transaction.",
      };
    }),
});
