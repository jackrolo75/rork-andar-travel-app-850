import { ActivityCategory } from '@/types/activities';

const GYG_PARTNER_ID = 'D82WHJ5';

const GYG_CITY_SLUGS: Record<string, string> = {
  'tokyo': 'tokyo-l193',
  'bali': 'bali-l347',
  'paris': 'paris-l16',
  'dubai': 'dubai-l173',
  'barcelona': 'barcelona-l45',
  'rome': 'rome-l33',
  'bangkok': 'bangkok-l204',
  'lisbon': 'lisbon-l53',
  'london': 'london-l57',
  'madrid': 'madrid-l46',
  'amsterdam': 'amsterdam-l36',
  'new york': 'new-york-l49',
  'los angeles': 'los-angeles-l63',
  'san francisco': 'san-francisco-l62',
  'las vegas': 'las-vegas-l66',
  'orlando': 'orlando-l191',
  'miami': 'miami-l176',
  'milan': 'milan-l139',
  'florence': 'florence-l32',
  'venice': 'venice-l35',
  'palma de mallorca': 'palma-de-mallorca-l511',
  'malaga': 'malaga-l488',
  'seville': 'seville-l48',
  'istanbul': 'istanbul-l56',
  'rio de janeiro': 'rio-de-janeiro-l227',
  'berlin': 'berlin-l17',
  'athens': 'athens-l91',
};

const GYG_CATEGORY_MAP: Record<string, string> = {
  adventure: 'adventure',
  culture: 'culture-history',
  culture_history: 'culture-history',
  food: 'food-drink',
  food_drink: 'food-drink',
  nature: 'nature',
  nature_wildlife: 'nature',
  wellness: 'wellness',
  water: 'water-activities',
  water_activities: 'water-activities',
  nightlife: 'nightlife',
  tickets: 'tickets-passes',
  luxury: 'luxury',
};

export function buildGYGDestinationUrl(city: string): string {
  const cityKey = city.toLowerCase().trim();
  const slug = GYG_CITY_SLUGS[cityKey];

  let url: string;
  if (slug) {
    url = `https://www.getyourguide.com/${slug}/?partner_id=${GYG_PARTNER_ID}&utm_medium=online_publisher&utm_source=andartravel`;
  } else {
    url = `https://www.getyourguide.com/s/?q=${encodeURIComponent(city)}&partner_id=${GYG_PARTNER_ID}&utm_medium=online_publisher&utm_source=andartravel`;
  }

  console.log('[GYGLinks] Built destination URL:', { city, url });
  return url;
}

export function buildGYGCategoryUrl(category: string, city: string): string {
  const cityKey = city.toLowerCase().trim();
  const catSlug = GYG_CATEGORY_MAP[category] || category;
  const query = `${city} ${catSlug.replace(/-/g, ' ')}`;

  const url = `https://www.getyourguide.com/s/?q=${encodeURIComponent(query)}&partner_id=${GYG_PARTNER_ID}&utm_medium=online_publisher&utm_source=andartravel`;

  console.log('[GYGLinks] Built category URL:', { category, city, url });
  return url;
}

export function buildGYGSearchUrl(params: {
  destination: string;
  category?: string;
  date?: string;
  guests?: number;
}): string {
  const { destination, category, date, guests } = params;

  let url: string;
  if (category) {
    url = buildGYGCategoryUrl(category, destination);
  } else {
    url = buildGYGDestinationUrl(destination);
  }

  const separator = url.includes('?') ? '&' : '?';
  const extras: string[] = [];
  if (date) extras.push(`date_from=${encodeURIComponent(date)}`);
  if (guests) extras.push(`adults=${guests}`);
  if (extras.length > 0) {
    url += separator + extras.join('&');
  }

  console.log('[GYGLinks] Built search URL:', { destination, category, date, guests, url });
  return url;
}

export { GYG_PARTNER_ID };
