import { ActivityCategory } from '@/types/activities';

export const GYG_PARTNER_ID = 'D82WHJ5';

export interface ExperienceProvider {
  id: string;
  name: string;
  commissionWeight: number;
  isActive: boolean;
  buildSearchUrl: (location: string, category?: string) => string;
}

export const PROVIDERS: ExperienceProvider[] = [
  {
    id: 'tiqets',
    name: 'Tiqets',
    commissionWeight: 0.85,
    isActive: true,
    buildSearchUrl: (location: string, category?: string) => {
      const q = category ? `${location} ${category}` : location;
      return `https://www.tiqets.com/en/search?q=${encodeURIComponent(q)}&partner=andartravel&utm_source=andartravel&utm_medium=app`;
    },
  },
  {
    id: 'tripcom',
    name: 'Trip.com',
    commissionWeight: 0.7,
    isActive: true,
    buildSearchUrl: (location: string, category?: string) => {
      const q = category ? `${location} ${category}` : location;
      return `https://www.trip.com/travel-guide/activities/?keyword=${encodeURIComponent(q)}&utm_source=andartravel&utm_medium=app`;
    },
  },
  {
    id: 'ticketnetwork',
    name: 'TicketNetwork',
    commissionWeight: 0.5,
    isActive: true,
    buildSearchUrl: (location: string, category?: string) => {
      const q = category ? `${location} ${category}` : `${location} events`;
      return `https://www.ticketnetwork.com/performers?q=${encodeURIComponent(q)}&utm_source=andartravel&utm_medium=app`;
    },
  },
  {
    id: 'getyourguide',
    name: 'GetYourGuide',
    commissionWeight: 0.4,
    isActive: true,
    buildSearchUrl: (location: string, category?: string) => {
      const q = category ? `${location} ${category}` : location;
      return `https://www.getyourguide.com/s/?q=${encodeURIComponent(q)}&partner_id=${GYG_PARTNER_ID}&utm_source=andartravel&utm_medium=app`;
    },
  },
];

export type ExperienceCategoryId = 'adventure' | 'food_drink' | 'culture_history' | 'nature_wildlife' | 'nightlife' | 'water_activities' | 'luxury' | 'wellness';

export interface ExperienceCategoryDef {
  id: ExperienceCategoryId;
  label: string;
  emoji: string;
  keywords: string[];
  mapToActivityCategory: ActivityCategory;
}

export const EXPERIENCE_CATEGORIES: ExperienceCategoryDef[] = [
  { id: 'adventure', label: 'Adventure', emoji: '🏔️', keywords: ['hiking', 'zipline', 'atv', 'climbing', 'bungee'], mapToActivityCategory: 'adventure' },
  { id: 'food_drink', label: 'Food & Drink', emoji: '🍷', keywords: ['food', 'cooking', 'wine', 'tasting', 'culinary'], mapToActivityCategory: 'food' },
  { id: 'culture_history', label: 'Culture & History', emoji: '🏛️', keywords: ['museum', 'temple', 'historical', 'heritage', 'art'], mapToActivityCategory: 'culture' },
  { id: 'nature_wildlife', label: 'Nature & Wildlife', emoji: '🌿', keywords: ['safari', 'wildlife', 'national park', 'garden', 'whale'], mapToActivityCategory: 'nature' },
  { id: 'nightlife', label: 'Nightlife', emoji: '🌙', keywords: ['pub', 'bar', 'club', 'party', 'night'], mapToActivityCategory: 'nightlife' },
  { id: 'water_activities', label: 'Water Activities', emoji: '🏄', keywords: ['snorkeling', 'diving', 'kayak', 'surf', 'boat'], mapToActivityCategory: 'water' },
  { id: 'luxury', label: 'Luxury', emoji: '✨', keywords: ['luxury', 'vip', 'private', 'premium', 'exclusive'], mapToActivityCategory: 'tickets' },
  { id: 'wellness', label: 'Wellness', emoji: '🧘', keywords: ['spa', 'yoga', 'massage', 'meditation', 'hot springs'], mapToActivityCategory: 'wellness' },
];

export interface CityPriority {
  categories: ExperienceCategoryId[];
  topKeywords: string[];
}

export const CITY_PRIORITIES: Record<string, CityPriority> = {
  bali: { categories: ['water_activities', 'adventure', 'wellness', 'culture_history'], topKeywords: ['temple', 'rice terrace', 'snorkeling', 'yoga'] },
  paris: { categories: ['culture_history', 'food_drink', 'luxury', 'nightlife'], topKeywords: ['eiffel tower', 'louvre', 'wine tasting', 'seine cruise'] },
  tokyo: { categories: ['culture_history', 'food_drink', 'adventure', 'nightlife'], topKeywords: ['sushi making', 'temple', 'mount fuji', 'shibuya'] },
  dubai: { categories: ['luxury', 'adventure', 'water_activities', 'nightlife'], topKeywords: ['desert safari', 'burj khalifa', 'yacht', 'skydiving'] },
  barcelona: { categories: ['culture_history', 'food_drink', 'nightlife', 'water_activities'], topKeywords: ['sagrada familia', 'tapas tour', 'gothic quarter', 'sailing'] },
  rome: { categories: ['culture_history', 'food_drink', 'luxury'], topKeywords: ['colosseum', 'vatican', 'pasta making', 'gelato tour'] },
  bangkok: { categories: ['food_drink', 'culture_history', 'nightlife', 'wellness'], topKeywords: ['street food', 'temple', 'floating market', 'thai massage'] },
  london: { categories: ['culture_history', 'food_drink', 'nightlife', 'luxury'], topKeywords: ['tower of london', 'afternoon tea', 'harry potter', 'pub crawl'] },
  sydney: { categories: ['water_activities', 'adventure', 'nature_wildlife', 'food_drink'], topKeywords: ['harbor cruise', 'surf lesson', 'blue mountains', 'bondi'] },
  cusco: { categories: ['adventure', 'culture_history', 'nature_wildlife', 'food_drink'], topKeywords: ['machu picchu', 'sacred valley', 'rainbow mountain', 'ceviche'] },
  cancun: { categories: ['water_activities', 'adventure', 'nightlife', 'nature_wildlife'], topKeywords: ['snorkeling', 'cenotes', 'chichen itza', 'isla mujeres'] },
  new_york: { categories: ['culture_history', 'food_drink', 'nightlife', 'luxury'], topKeywords: ['statue of liberty', 'broadway', 'pizza tour', 'central park'] },
  istanbul: { categories: ['culture_history', 'food_drink', 'luxury', 'nightlife'], topKeywords: ['hagia sophia', 'grand bazaar', 'turkish bath', 'bosphorus'] },
  amsterdam: { categories: ['culture_history', 'food_drink', 'nightlife', 'water_activities'], topKeywords: ['canal cruise', 'anne frank', 'cheese tasting', 'bike tour'] },
  lisbon: { categories: ['food_drink', 'culture_history', 'nightlife', 'adventure'], topKeywords: ['pasteis de nata', 'tram 28', 'fado night', 'sintra day trip'] },
  madrid: { categories: ['culture_history', 'food_drink', 'nightlife', 'adventure'], topKeywords: ['prado museum', 'tapas tour', 'flamenco show', 'retiro park'] },
  los_angeles: { categories: ['adventure', 'food_drink', 'nightlife', 'luxury'], topKeywords: ['hollywood sign', 'venice beach', 'studio tour', 'santa monica'] },
  san_francisco: { categories: ['culture_history', 'food_drink', 'nature_wildlife', 'adventure'], topKeywords: ['golden gate', 'alcatraz', 'chinatown', 'fishermans wharf'] },
  las_vegas: { categories: ['nightlife', 'luxury', 'adventure', 'food_drink'], topKeywords: ['strip tour', 'grand canyon', 'show tickets', 'helicopter ride'] },
  orlando: { categories: ['adventure', 'nature_wildlife', 'food_drink', 'nightlife'], topKeywords: ['theme park', 'disney', 'universal', 'everglades'] },
  miami: { categories: ['water_activities', 'nightlife', 'food_drink', 'adventure'], topKeywords: ['south beach', 'art deco', 'everglades', 'boat tour'] },
  milan: { categories: ['culture_history', 'food_drink', 'luxury', 'nightlife'], topKeywords: ['duomo', 'last supper', 'fashion district', 'aperitivo tour'] },
  florence: { categories: ['culture_history', 'food_drink', 'adventure', 'luxury'], topKeywords: ['uffizi gallery', 'ponte vecchio', 'tuscan wine', 'david statue'] },
  venice: { categories: ['culture_history', 'water_activities', 'food_drink', 'luxury'], topKeywords: ['gondola ride', 'st marks', 'murano glass', 'rialto bridge'] },
  palma_de_mallorca: { categories: ['water_activities', 'adventure', 'food_drink', 'nightlife'], topKeywords: ['beach club', 'boat tour', 'cathedral', 'tapas crawl'] },
  malaga: { categories: ['culture_history', 'food_drink', 'water_activities', 'nightlife'], topKeywords: ['picasso museum', 'tapas tour', 'caminito del rey', 'beach'] },
  seville: { categories: ['culture_history', 'food_drink', 'nightlife', 'adventure'], topKeywords: ['alcazar', 'flamenco show', 'tapas tour', 'plaza de espana'] },
  rio_de_janeiro: { categories: ['adventure', 'nature_wildlife', 'nightlife', 'water_activities'], topKeywords: ['christ redeemer', 'sugarloaf', 'copacabana', 'samba show'] },
  berlin: { categories: ['culture_history', 'nightlife', 'food_drink', 'adventure'], topKeywords: ['berlin wall', 'brandenburg gate', 'museum island', 'techno club'] },
  athens: { categories: ['culture_history', 'food_drink', 'adventure', 'nature_wildlife'], topKeywords: ['acropolis', 'plaka walk', 'greek food tour', 'temple of poseidon'] },
};

export function getCityPriority(city: string): CityPriority {
  const key = city.toLowerCase().replace(/\s+/g, '_');
  return CITY_PRIORITIES[key] || {
    categories: ['adventure', 'culture_history', 'food_drink', 'nature_wildlife'],
    topKeywords: [],
  };
}

export function getProviderById(id: string): ExperienceProvider | undefined {
  return PROVIDERS.find(p => p.id === id);
}

export function getActiveProviders(): ExperienceProvider[] {
  return PROVIDERS.filter(p => p.isActive);
}
