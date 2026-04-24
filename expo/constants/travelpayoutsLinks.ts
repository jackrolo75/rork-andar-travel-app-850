import { ActivityCategory } from '@/types/activities';

const TP_MARKER = '581079';
const TP_TRS = '491382';

const CATEGORY_TO_TP_QUERY: Record<ActivityCategory, string> = {
  adventure: 'adventure tours',
  culture: 'cultural tours sightseeing',
  food: 'food tours tastings',
  nature: 'nature tours excursions',
  wellness: 'spa wellness',
  water: 'water activities boat tours',
  nightlife: 'nightlife tours pub crawl',
  tickets: 'tickets attractions',
};

export function buildTravelpayoutsSearchUrl(params: {
  destination: string;
  date?: string;
  endDate?: string;
  guests?: number;
  category?: ActivityCategory;
}): string {
  const { destination, date, guests, category } = params;

  const cityTrimmed = destination.trim();
  if (!cityTrimmed) {
    console.warn('[TravelpayoutsLinks] Empty destination provided');
    return '';
  }

  const query = category
    ? `${cityTrimmed} ${CATEGORY_TO_TP_QUERY[category] || category}`
    : cityTrimmed;

  const baseUrl = 'https://www.viator.com/searchResults/all';
  const destParts: string[] = [
    `text=${encodeURIComponent(query)}`,
  ];
  if (date) destParts.push(`startDate=${encodeURIComponent(date)}`);
  if (guests && guests > 0) destParts.push(`adults=${encodeURIComponent(String(guests))}`);

  const destinationUrl = `${baseUrl}?${destParts.join('&')}`;
  const encodedUrl = encodeURIComponent(destinationUrl);

  const affiliateUrl = `https://tp.media/click?shmarker=${TP_MARKER}&promo_id=4497&source_type=link&type=10&campaign_id=137&trs=${TP_TRS}&search_destination=${encodeURIComponent(cityTrimmed)}&url=${encodedUrl}`;

  console.log('[TravelpayoutsLinks] Built search URL:', { destination: cityTrimmed, category, date, guests, finalUrl: affiliateUrl });
  return affiliateUrl;
}

export function buildTravelpayoutsCategoryUrl(category: ActivityCategory, city: string): string {
  const query = `${city} ${CATEGORY_TO_TP_QUERY[category] || category}`;

  const baseUrl = 'https://www.viator.com/searchResults/all';
  const searchParams = new URLSearchParams();
  searchParams.set('text', query);

  const destinationUrl = `${baseUrl}?${searchParams.toString()}`;
  const encodedUrl = encodeURIComponent(destinationUrl);

  const affiliateUrl = `https://tp.media/click?shmarker=${TP_MARKER}&promo_id=4497&source_type=link&type=10&campaign_id=137&trs=${TP_TRS}&search_destination=${encodeURIComponent(city)}&url=${encodedUrl}`;

  console.log('[TravelpayoutsLinks] Built category URL:', { category, city, url: affiliateUrl });
  return affiliateUrl;
}

export function buildTravelpayoutsDestinationUrl(city: string): string {
  const baseUrl = 'https://www.viator.com/searchResults/all';
  const searchParams = new URLSearchParams();
  searchParams.set('text', city);

  const destinationUrl = `${baseUrl}?${searchParams.toString()}`;
  const encodedUrl = encodeURIComponent(destinationUrl);

  const affiliateUrl = `https://tp.media/click?shmarker=${TP_MARKER}&promo_id=4497&source_type=link&type=10&campaign_id=137&trs=${TP_TRS}&search_destination=${encodeURIComponent(city)}&url=${encodedUrl}`;

  console.log('[TravelpayoutsLinks] Built destination URL:', { city, url: affiliateUrl });
  return affiliateUrl;
}
