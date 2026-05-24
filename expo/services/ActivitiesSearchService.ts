import {
  ActivityOffer,
  ActivitySearchParams,
  ActivityCategory,
  ActivityBookingFlow,
  ResolvedPlace,
} from '@/types/activities';
import { buildActivityUrl } from '@/constants/affiliateLinks';
import { resolvePlace, getDefaultRadiusKm } from '@/services/GeocodingService';
import { geoFilterOffers } from '@/services/GeoFilterService';
import { isCategoryAllowedForCity, cityMatchesOffer, getValidCategoriesForCity } from '@/constants/locationValidation';
import { getActivityImages, getPrimaryImage } from '@/constants/activityImageDatabase';

interface ActivityPartner {
  id: string;
  name: string;
  isActive: boolean;
}

const ACTIVITY_PARTNERS: ActivityPartner[] = [
  { id: 'klook', name: 'Klook', isActive: true },
  { id: 'tiqets', name: 'Tiqets', isActive: true },
  { id: 'viator', name: 'Viator', isActive: true },
  { id: 'tripcom', name: 'Trip.com', isActive: true },
  { id: 'searadar', name: 'Searadar', isActive: true },
  { id: 'eatwith', name: 'EatWith', isActive: true },
];

const CITY_SPECIFIC_TITLES: Record<string, Record<string, string[]>> = {
  tokyo: {
    adventure: ['Mount Fuji Day Trip', 'Tokyo Go-Kart Street Tour', 'Ninja Experience Workshop', 'Samurai Sword Training'],
    culture: ['Meiji Shrine & Harajuku Tour', 'Traditional Tea Ceremony', 'Tsukiji Market Walking Tour', 'Asakusa Temple Discovery'],
    food: ['Sushi Making Class in Tsukiji', 'Ramen Tasting Tour Shinjuku', 'Sake Brewery & Tasting', 'Izakaya Food Crawl'],
    nature: ['Mount Takao Nature Hike', 'Shinjuku Gyoen Garden Tour', 'Cherry Blossom Walk', 'Kamakura Day Trip'],
    nightlife: ['Shinjuku Golden Gai Bar Crawl', 'Robot Restaurant Experience', 'Roppongi Night Tour', 'Shibuya Nightlife Walk'],
    tickets: ['Tokyo Skytree Express Pass', 'TeamLab Borderless Entry', 'Disneyland Day Pass', 'Ghibli Museum Ticket'],
    wellness: ['Onsen Hot Spring Experience', 'Traditional Japanese Massage', 'Zen Meditation Session', 'Forest Bathing Retreat'],
    water: ['Tokyo Bay Cruise', 'Sumida River Boat Tour', 'Odaiba Beach Walk', 'Kayaking Edogawa River'],
  },
  bali: {
    adventure: ['Mount Batur Sunrise Trek', 'ATV Quad Bike Ubud', 'White Water Rafting Ayung', 'Bali Swing Jungle'],
    culture: ['Ubud Temple & Rice Terrace', 'Balinese Dance Performance', 'Tirta Empul Purification', 'Uluwatu Temple Sunset'],
    food: ['Balinese Cooking Class', 'Ubud Market Food Tour', 'Coffee Plantation Visit', 'Seafood Beach BBQ Jimbaran'],
    nature: ['Tegallalang Rice Terraces', 'Monkey Forest Sanctuary', 'Bali Waterfalls Tour', 'Sunrise at Kintamani'],
    water: ['Snorkeling Nusa Penida', 'Bali Dolphin Watching', 'Surfing Lesson Kuta', 'Island Hopping Nusa Lembongan'],
    wellness: ['Ubud Spa & Massage', 'Yoga Retreat Ubud', 'Balinese Healing Ceremony', 'Meditation in Rice Fields'],
    nightlife: ['Seminyak Beach Club', 'Kuta Pub Crawl', 'Canggu Sunset Party', 'Ubud Jazz Night'],
    tickets: ['Bali Safari & Marine Park', 'Waterbom Bali Entry', 'GWK Cultural Park', 'Bali Bird Park Pass'],
  },
  paris: {
    adventure: ['Versailles Bike Tour', 'Paris Catacombs Exploration', 'Seine Valley Hot Air Balloon', 'Electric Scooter City Tour'],
    culture: ['Louvre Museum Skip-the-Line', 'Musée d\'Orsay Guided Tour', 'Notre-Dame Quarter Walk', 'Montmartre Art Tour'],
    food: ['French Wine & Cheese Tasting', 'Pastry Making Class', 'Le Marais Food Walk', 'Paris Market & Cooking'],
    nature: ['Luxembourg Gardens Walk', 'Giverny Monet Garden Day Trip', 'Fontainebleau Forest Walk', 'Tuileries Stroll'],
    nightlife: ['Moulin Rouge Cabaret Show', 'Seine River Dinner Cruise', 'Saint-Germain Jazz Club', 'Rooftop Cocktail Tour'],
    tickets: ['Eiffel Tower Summit Access', 'Arc de Triomphe Priority Entry', 'Disneyland Paris Day Pass', 'Palace of Versailles'],
    wellness: ['Parisian Spa Hammam', 'Luxury Wellness Retreat', 'Yoga in the Park', 'Aromatherapy Workshop'],
  },
  dubai: {
    adventure: ['Desert Safari & Dune Bashing', 'Skydiving over Palm Jumeirah', 'Quad Bike Desert Ride', 'Zip Line Jebel Jais'],
    culture: ['Old Dubai Heritage Tour', 'Dubai Museum & Souks Walk', 'Abu Dhabi Grand Mosque Trip', 'Al Fahidi Walking Tour'],
    food: ['Emirates Culinary Experience', 'Dubai Food Truck Tour', 'Arabic Coffee & Dates', 'Dhow Dinner Cruise'],
    water: ['Dubai Marina Yacht Cruise', 'Jet Ski at JBR Beach', 'Scuba Diving Palm Islands', 'Parasailing Dubai Beach'],
    nightlife: ['Burj Al Arab Cocktail Bar', 'Dubai Marina Night Walk', 'Rooftop Bar Crawl Downtown', 'Atlantis Nightclub Party'],
    tickets: ['Burj Khalifa At The Top', 'Dubai Frame Entry', 'Aquaventure Waterpark', 'IMG Worlds of Adventure'],
    nature: ['Hatta Mountain Safari', 'Ras Al Khor Flamingo Sanctuary', 'Dubai Miracle Garden', 'Desert Stargazing Tour'],
    wellness: ['Luxury Desert Spa', 'Turkish Hammam Experience', 'Yoga at Sunrise Beach', 'Traditional Healing Session'],
  },
  barcelona: {
    adventure: ['Montserrat Hiking Day Trip', 'Paragliding over Costa Brava', 'E-Bike Coastal Ride', 'Rock Climbing Montjuïc'],
    culture: ['Sagrada Família Skip-the-Line', 'Gothic Quarter Walking Tour', 'Picasso Museum Guided Visit', 'Flamenco Show Experience'],
    food: ['Tapas Tasting Tour Born', 'Paella Cooking Workshop', 'La Boqueria Market Tour', 'Wine Tasting Penedès'],
    water: ['Catamaran Sailing Costa Brava', 'Kayaking Barcelona Beach', 'Paddleboard Barceloneta', 'Costa Brava Snorkeling'],
    nightlife: ['El Born Bar Crawl', 'Rooftop Cocktail Tour', 'Barcelona Flamenco Night', 'Beach Club Sunset Party'],
    nature: ['Montserrat Natural Park', 'Park Güell Garden Walk', 'Costa Brava Coastal Path', 'Tibidabo Hill Hike'],
    tickets: ['Park Güell Entry', 'Camp Nou Tour', 'Casa Batlló Ticket', 'Barcelona Aquarium Pass'],
    wellness: ['Spa Circuit Experience', 'Yoga Overlooking the Sea', 'Thermal Baths Visit', 'Meditation in Park Güell'],
  },
  rome: {
    adventure: ['Appian Way Bike Tour', 'Vespa City Tour', 'Tivoli Day Trip Adventure', 'Underground Rome Exploration'],
    culture: ['Colosseum Skip-the-Line', 'Vatican Museums & Sistine Chapel', 'Roman Forum Guided Walk', 'Pantheon & Piazza Tour'],
    food: ['Pasta Making Class Trastevere', 'Gelato Tasting Walk', 'Roman Street Food Tour', 'Wine & Olive Oil Experience'],
    nature: ['Villa Borghese Garden Stroll', 'Tivoli Gardens Day Trip', 'Appian Way Nature Walk', 'Roman Countryside Tour'],
    nightlife: ['Trastevere Wine Bar Crawl', 'Rooftop Aperitivo Tour', 'Jazz Club Night Testaccio', 'Moonlit Colosseum Walk'],
    tickets: ['Colosseum Priority Entry', 'Vatican Fast Track', 'Borghese Gallery Reservation', 'Castel Sant\'Angelo Pass'],
    wellness: ['Roman Thermal Baths', 'Italian Spa Retreat', 'Yoga in Villa Borghese', 'Aromatherapy Masterclass'],
  },
  bangkok: {
    adventure: ['Khao Yai National Park Trip', 'Floating Market Speedboat', 'Muay Thai Boxing Class', 'Zip Line Canopy Tour'],
    culture: ['Grand Palace & Wat Phra Kaew', 'Ayutthaya Ancient Capital Tour', 'Wat Arun Temple Visit', 'Jim Thompson House Tour'],
    food: ['Street Food Tuk-Tuk Tour', 'Thai Cooking Class Silom', 'Chinatown Night Food Walk', 'Floating Market Tasting'],
    nature: ['Erawan Falls Day Trip', 'Khlong Boat Canal Tour', 'Bangkok Green Lung Park', 'Damnoen Saduak Market'],
    nightlife: ['Khao San Road Pub Crawl', 'Rooftop Sky Bar Experience', 'Asiatique Night Market Tour', 'Thai Boxing & Nightlife'],
    tickets: ['Siam Ocean World Entry', 'Safari World Day Pass', 'Madame Tussauds Bangkok', 'Dream World Theme Park'],
    wellness: ['Traditional Thai Massage', 'Luxury Spa Half Day', 'Meditation at Wat Mahathat', 'Herbal Compress Therapy'],
  },
  lisbon: {
    adventure: ['Sintra Day Trip & Pena Palace', 'Surfing Lesson Cascais', 'E-Bike Lisbon Hills', 'Arrábida Coasteering'],
    culture: ['Belém Tower & Monastery Tour', 'Alfama Walking Tour', 'Fado Night Experience', 'Tram 28 Heritage Ride'],
    food: ['Pastel de Nata Workshop', 'Lisbon Food & Wine Tour', 'Time Out Market Experience', 'Portuguese Olive Oil Tasting'],
    water: ['Tagus River Sailing Cruise', 'Cascais Beach Day Trip', 'Dolphin Watching Setúbal', 'Kayaking Arrábida'],
    nightlife: ['Bairro Alto Bar Crawl', 'Fado & Dinner Experience', 'Rooftop Cocktails Chiado', 'LX Factory Night Walk'],
    nature: ['Sintra Forest Hiking', 'Cabo da Roca Cliff Walk', 'Arrábida Nature Park', 'Cascais Coastal Trail'],
    tickets: ['Oceanário de Lisboa Entry', 'Jerónimos Monastery Pass', 'Lisbon Card Multi-Site', 'Benfica Stadium Tour'],
    wellness: ['Thermal Spa Caldas', 'Yoga by the Tagus', 'Traditional Hammam', 'Wellness Retreat Sintra'],
  },
};

const GENERIC_TITLES: Record<ActivityCategory, string[]> = {
  adventure: ['Mountain Hiking Tour', 'Zipline Adventure', 'ATV Quad Bike Ride', 'Bungee Jump Experience', 'Rock Climbing Session'],
  culture: ['Historical Walking Tour', 'Museum Skip-the-Line', 'Ancient Temple Visit', 'Art Gallery Guided Tour', 'Heritage City Tour'],
  food: ['Street Food Tasting Tour', 'Cooking Class', 'Wine & Cheese Experience', 'Local Market Tour', 'Farm-to-Table Dinner'],
  nature: ['Wildlife Safari', 'Botanical Garden Tour', 'Sunset Cruise', 'National Park Hike', 'Whale Watching Trip'],
  wellness: ['Spa & Massage Package', 'Yoga Retreat Session', 'Hot Springs Visit', 'Meditation Workshop', 'Traditional Healing'],
  water: ['Snorkeling Adventure', 'Scuba Diving Course', 'Kayaking Tour', 'Surfing Lesson', 'Island Hopping'],
  nightlife: ['Pub Crawl', 'Rooftop Bar Tour', 'Live Jazz Night', 'Night Market Tour', 'Sunset Party Cruise'],
  tickets: ['Theme Park Ticket', 'Observation Deck Pass', 'Concert Ticket', 'Show & Performance', 'Attraction Bundle'],
};

function generateClickId(): string {
  return `clk_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

function generateQuoteId(): string {
  return `qt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function getActivityTitle(city: string, category: ActivityCategory, index: number): string {
  const cityKey = city.toLowerCase().replace(/\s+/g, '_');
  const cityTitles = CITY_SPECIFIC_TITLES[cityKey]?.[category];

  if (cityTitles && cityTitles.length > 0) {
    return cityTitles[index % cityTitles.length];
  }

  const genericTitles = GENERIC_TITLES[category];
  return `${city} ${genericTitles[index % genericTitles.length]}`;
}

function generateActivityOffers(
  params: ActivitySearchParams,
  partner: ActivityPartner,
  resolvedPlace: ResolvedPlace | null,
): ActivityOffer[] {
  const offers: ActivityOffer[] = [];
  const dest = params.destination || 'Bangkok';

  const validCategories = getValidCategoriesForCity(dest);
  console.log(`[ActivitiesSearch] Valid categories for ${dest}:`, validCategories);

  const requestedCategories: ActivityCategory[] = params.category
    ? (validCategories.includes(params.category) ? [params.category] : [])
    : validCategories.filter(c => ['adventure', 'culture', 'food', 'nature', 'tickets'].includes(c) || validCategories.includes(c)).slice(0, 6);

  if (requestedCategories.length === 0) {
    console.log(`[ActivitiesSearch] No valid categories for ${dest} with requested filter`);
    return [];
  }

  const centroid = resolvedPlace?.centroid || { lat: 13.7563, lon: 100.5018 };
  const bbox = resolvedPlace?.bbox;
  const country = resolvedPlace?.country || 'Various';

  requestedCategories.forEach(cat => {
    if (!isCategoryAllowedForCity(cat, dest)) {
      console.log(`[ActivitiesSearch] Skipping blocked category "${cat}" for ${dest}`);
      return;
    }

    const numOffers = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numOffers; i++) {
      const title = getActivityTitle(dest, cat, i);
      const basePrice = 15 + Math.random() * 180;
      const price = Math.round(basePrice);
      const rating = 3.8 + Math.random() * 1.2;
      const durations = ['2 hours', '3 hours', '4 hours', 'Half day', 'Full day'];
      const duration = durations[Math.floor(Math.random() * durations.length)];
      const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00', '16:00', '18:00'];
      const availableSlots = timeSlots.slice(0, 3 + Math.floor(Math.random() * 4));

      const imgSeed = (title + dest + i).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const primaryImage = getPrimaryImage(dest, cat, imgSeed + i);
      const offerImages = getActivityImages(dest, cat, 4, imgSeed + i);
      const allImages = [primaryImage, ...offerImages.filter(img => img !== primaryImage)].slice(0, 5);

      const clickId = generateClickId();
      const quoteId = generateQuoteId();

      const bookingFlow: ActivityBookingFlow = Math.random() > 0.4 ? 'affiliate_redirect' : 'api';
      // Activity-specific deep link: always resolves to the exact GYG result for this title + city,
      // never the generic homepage. Tracking params (sub_id / quote_id) are appended for attribution.
      const baseActivityUrl = buildActivityUrl(title, dest, cat);
      const trackingSep = baseActivityUrl.includes('?') ? '&' : '?';
      const deepLink = bookingFlow === 'affiliate_redirect'
        ? `${baseActivityUrl}${trackingSep}sub_id=${encodeURIComponent(clickId)}&sub_id2=${encodeURIComponent(quoteId)}`
        : baseActivityUrl;

      let offerLat: number;
      let offerLon: number;

      if (bbox) {
        const latRange = bbox.north - bbox.south;
        const lonRange = bbox.east - bbox.west;
        offerLat = bbox.south + Math.random() * latRange;
        offerLon = bbox.west + Math.random() * lonRange;
      } else {
        offerLat = centroid.lat + (Math.random() - 0.5) * 0.2;
        offerLon = centroid.lon + (Math.random() - 0.5) * 0.2;
      }

      offers.push({
        id: `${partner.id}-act-${cat}-${i}-${Date.now()}`,
        partnerId: partner.id,
        partnerName: partner.name,
        title,
        subtitle: duration,
        description: `Experience an unforgettable ${title.toLowerCase()} in ${dest}. Expert local guides, small groups, and guaranteed departure.`,
        location: dest,
        city: dest,
        country,
        category: cat,
        price,
        originalPrice: Math.random() > 0.5 ? Math.round(price * 1.2) : undefined,
        currency: 'USD',
        duration,
        rating: Math.round(rating * 10) / 10,
        reviewCount: 50 + Math.floor(Math.random() * 5000),
        imageUrl: primaryImage,
        images: allImages,
        highlights: ['Expert guide', 'Small group', 'Free cancellation', 'Instant confirmation'].slice(0, 2 + Math.floor(Math.random() * 3)),
        includes: ['Transport', 'Entrance fees', 'Water', 'Guide'].slice(0, 2 + Math.floor(Math.random() * 3)),
        timeSlots: availableSlots,
        availability: Math.random() > 0.3 ? `${2 + Math.floor(Math.random() * 15)} spots left` : undefined,
        isBestPrice: false,
        discount: Math.random() > 0.7 ? 5 + Math.floor(Math.random() * 25) : undefined,
        deepLink,
        bookingFlow,
        cancellationPolicy: Math.random() > 0.3 ? 'Free cancellation up to 24h before' : 'Non-refundable',
        languages: ['English', 'Spanish'].slice(0, 1 + Math.floor(Math.random() * 2)),
        maxGroupSize: 8 + Math.floor(Math.random() * 20),
        geo: {
          lat: offerLat,
          lon: offerLon,
        },
      });
    }
  });

  return offers;
}

async function simulatePartnerActivitySearch(
  partner: ActivityPartner,
  params: ActivitySearchParams,
  resolvedPlace: ResolvedPlace | null,
): Promise<ActivityOffer[]> {
  const delay = 600 + Math.random() * 1800;
  await new Promise(resolve => setTimeout(resolve, delay));
  console.log(`[ActivitiesSearch] Partner ${partner.name} search completed`);
  return generateActivityOffers(params, partner, resolvedPlace);
}

function strictCityFilter(offers: ActivityOffer[], selectedCity: string): ActivityOffer[] {
  const before = offers.length;
  const filtered = offers.filter(offer => cityMatchesOffer(offer.city, selectedCity));
  console.log(`[ActivitiesSearch] Strict city filter: ${before} → ${filtered.length} (city="${selectedCity}")`);
  return filtered;
}

function deduplicateOffers(offers: ActivityOffer[]): ActivityOffer[] {
  const seen = new Map<string, ActivityOffer>();

  offers.forEach(offer => {
    const key = `${offer.title.toLowerCase().trim()}_${offer.price}_${offer.duration}`;
    const existing = seen.get(key);
    if (!existing || offer.price < existing.price) {
      seen.set(key, offer);
    }
  });

  return Array.from(seen.values());
}

function rankOffers(offers: ActivityOffer[], sortBy: ActivitySearchParams['sortBy'] = 'relevance'): ActivityOffer[] {
  const sorted = [...offers];

  switch (sortBy) {
    case 'price_low':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price_high':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      sorted.sort((a, b) => b.rating - a.rating);
      break;
    case 'popularity':
      sorted.sort((a, b) => b.reviewCount - a.reviewCount);
      break;
    case 'relevance':
    default:
      sorted.sort((a, b) => {
        const geoBoostA = a.geo?.confidenceScore ?? 0.5;
        const geoBoostB = b.geo?.confidenceScore ?? 0.5;
        const scoreA = a.rating * 0.3 + (a.reviewCount / 1000) * 0.2 + (a.isBestPrice ? 0.2 : 0) + geoBoostA * 0.3;
        const scoreB = b.rating * 0.3 + (b.reviewCount / 1000) * 0.2 + (b.isBestPrice ? 0.2 : 0) + geoBoostB * 0.3;
        return scoreB - scoreA;
      });
      break;
  }

  if (sorted.length > 0) {
    const cheapest = sorted.reduce((min, o) => o.price < min.price ? o : min, sorted[0]);
    cheapest.isBestPrice = true;
  }

  return sorted;
}

export async function searchActivities(
  params: ActivitySearchParams,
  onPartnerResult: (partnerId: string, offers: ActivityOffer[]) => void,
  onComplete: (offers: ActivityOffer[], resolvedPlace: ResolvedPlace | null) => void,
  onError: (error: string) => void,
): Promise<void> {
  console.log('[ActivitiesSearch] Starting search:', params);

  const resolvedPlace = resolvePlace(params.destination);
  console.log('[ActivitiesSearch] Resolved place:', resolvedPlace?.displayName ?? 'unknown');

  const strictLocation = params.strictLocation !== false;
  const radiusKm = params.radiusKm ?? getDefaultRadiusKm();

  const activePartners = ACTIVITY_PARTNERS.filter(p => p.isActive);

  if (activePartners.length === 0) {
    onError('No activity partners available');
    return;
  }

  const allOffers: ActivityOffer[] = [];

  const searchPromises = activePartners.map(async (partner) => {
    try {
      const offers = await simulatePartnerActivitySearch(partner, params, resolvedPlace);

      let filtered = strictCityFilter(offers, params.destination);

      if (resolvedPlace) {
        const geoResults = geoFilterOffers(filtered, resolvedPlace, strictLocation, radiusKm);
        filtered = geoResults.map(r => r.offer);
        console.log(
          `[ActivitiesSearch] Partner ${partner.name}: ${offers.length} raw → ${filtered.length} after city+geo filter`,
        );
      }

      allOffers.push(...filtered);
      onPartnerResult(partner.id, filtered);
      return filtered;
    } catch (error) {
      console.error(`[ActivitiesSearch] Error from ${partner.name}:`, error);
      return [];
    }
  });

  try {
    await Promise.all(searchPromises);

    const deduplicated = deduplicateOffers(allOffers);
    const ranked = rankOffers(deduplicated, params.sortBy);

    console.log(`[ActivitiesSearch] Search complete: ${ranked.length} unique offers from ${activePartners.length} partners (strict=${strictLocation}, radius=${radiusKm}km, city="${params.destination}")`);
    onComplete(ranked, resolvedPlace);
  } catch (error) {
    console.error('[ActivitiesSearch] Search failed:', error);
    onError('Activity search failed. Please try again.');
  }
}

export function getActivityPartners(): ActivityPartner[] {
  return ACTIVITY_PARTNERS.filter(p => p.isActive);
}

export { generateClickId, generateQuoteId };
