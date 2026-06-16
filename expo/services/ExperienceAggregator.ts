import { ActivityOffer } from '@/types/activities';
import {
  PROVIDERS,
  ExperienceProvider,
  ExperienceCategoryId,
  EXPERIENCE_CATEGORIES,
  getCityPriority,
  GYG_PARTNER_ID,
} from '@/constants/experienceProviders';
import { isCategoryAllowedForCity, cityMatchesOffer } from '@/constants/locationValidation';
import { buildActivityUrl, isGenericAffiliateUrl } from '@/constants/affiliateLinks';

export interface NormalizedSearchInput {
  location: string;
  category: string;
  keywords: string[];
}

export interface RankedExperience extends ActivityOffer {
  rankScore: number;
  scarcityLabel?: string;
  providerDisplayName: string;
  affiliateUrl: string;
}

export function normalizeSearchInput(
  query: string,
  categoryFilter?: ExperienceCategoryId,
): NormalizedSearchInput {
  const trimmed = query.trim();
  const words = trimmed.toLowerCase().split(/[\s,]+/);

  let matchedCategory = '';
  const keywords: string[] = [];
  let location = trimmed;

  if (categoryFilter) {
    const catDef = EXPERIENCE_CATEGORIES.find(c => c.id === categoryFilter);
    if (catDef) {
      matchedCategory = catDef.label;
      keywords.push(...catDef.keywords.slice(0, 3));
    }
  }

  if (!matchedCategory) {
    for (const cat of EXPERIENCE_CATEGORIES) {
      for (const kw of cat.keywords) {
        if (words.includes(kw) || trimmed.toLowerCase().includes(kw)) {
          matchedCategory = cat.label;
          keywords.push(kw);
          location = trimmed.replace(new RegExp(kw, 'gi'), '').trim();
          break;
        }
      }
      if (matchedCategory) break;
    }
  }

  console.log('[ExperienceAggregator] Normalized input:', { location, category: matchedCategory, keywords });
  return { location: location || trimmed, category: matchedCategory, keywords };
}

function computeRankScore(
  offer: ActivityOffer,
  provider: ExperienceProvider,
  searchInput: NormalizedSearchInput,
): number {
  const relevance = computeRelevance(offer, searchInput);
  const conversionProbability = computeConversionProbability(offer);
  const commissionWeight = provider.commissionWeight;

  const score = (relevance * 0.5) + (conversionProbability * 0.3) + (commissionWeight * 0.2);
  return Math.round(score * 1000) / 1000;
}

function computeRelevance(offer: ActivityOffer, input: NormalizedSearchInput): number {
  let score = 0.5;

  const titleLower = offer.title.toLowerCase();
  const locationLower = offer.location.toLowerCase();
  const inputLocationLower = input.location.toLowerCase();

  if (locationLower.includes(inputLocationLower) || titleLower.includes(inputLocationLower)) {
    score += 0.25;
  }

  if (input.category) {
    const catLower = input.category.toLowerCase();
    if (titleLower.includes(catLower) || offer.category === catLower) {
      score += 0.15;
    }
  }

  for (const kw of input.keywords) {
    if (titleLower.includes(kw.toLowerCase())) {
      score += 0.05;
    }
  }

  return Math.min(score, 1);
}

function computeConversionProbability(offer: ActivityOffer): number {
  let score = 0;

  if (offer.rating >= 4.5) score += 0.35;
  else if (offer.rating >= 4.0) score += 0.25;
  else if (offer.rating >= 3.5) score += 0.15;

  if (offer.reviewCount >= 1000) score += 0.25;
  else if (offer.reviewCount >= 500) score += 0.2;
  else if (offer.reviewCount >= 100) score += 0.1;

  if (offer.discount && offer.discount > 10) score += 0.15;
  if (offer.isBestPrice) score += 0.1;
  if (offer.cancellationPolicy?.includes('Free')) score += 0.1;

  return Math.min(score, 1);
}

function generateScarcityLabel(offer: ActivityOffer): string | undefined {
  const rand = Math.random();
  if (offer.rating >= 4.5 && offer.reviewCount >= 500) {
    return 'Likely to sell out';
  }
  if (rand > 0.6) {
    const bookedCount = 10 + Math.floor(Math.random() * 90);
    return `Booked ${bookedCount} times today`;
  }
  if (offer.discount && offer.discount >= 15) {
    return 'Limited time offer';
  }
  return undefined;
}

/**
 * Build the affiliate URL that opens when the user taps a specific experience card.
 *
 * IMPORTANT: must resolve to the EXACT activity page, not the GYG homepage.
 * Strategy:
 *   1. If the offer already has a usable activity-specific deepLink, keep it.
 *   2. Otherwise build a title+city query URL via the canonical builder.
 */
export function buildAffiliateUrl(
  _provider: ExperienceProvider,
  location: string,
  category?: string,
  activity?: string,
  existingDeepLink?: string,
): string {
  if (existingDeepLink && !isGenericAffiliateUrl(existingDeepLink)) {
    return existingDeepLink;
  }

  const url = buildActivityUrl(activity || location, location, category);
  console.log('[ExperienceAggregator] Built affiliate URL:', { location, category, activity, url });
  return url;
}

export interface AggregatedResults {
  topExperiences: RankedExperience[];
  categoryResults: RankedExperience[];
  allResults: RankedExperience[];
  cityBestCategories: ExperienceCategoryId[];
}

export function aggregateAndRank(
  offers: ActivityOffer[],
  searchInput: NormalizedSearchInput,
  city: string,
): AggregatedResults {
  console.log('[ExperienceAggregator] Aggregating', offers.length, 'offers for', city);

  const locationFiltered = offers.filter(offer => {
    if (!cityMatchesOffer(offer.city, city)) {
      return false;
    }
    if (!isCategoryAllowedForCity(offer.category, city)) {
      return false;
    }
    return true;
  });

  console.log(`[ExperienceAggregator] Location+category filter: ${offers.length} → ${locationFiltered.length}`);

  const ranked: RankedExperience[] = locationFiltered.map(offer => {
    const provider = PROVIDERS.find(p => p.id === offer.partnerId) || PROVIDERS[0];
    const rankScore = computeRankScore(offer, provider, searchInput);
    const scarcityLabel = generateScarcityLabel(offer);
    const affiliateUrl = buildAffiliateUrl(provider, city, offer.category, offer.title, offer.deepLink);

    return {
      ...offer,
      rankScore,
      scarcityLabel,
      providerDisplayName: provider.name,
      affiliateUrl,
    };
  });

  ranked.sort((a, b) => b.rankScore - a.rankScore);

  const gygBoosted = ranked.map(exp => {
    if (exp.partnerId === 'getyourguide' || exp.providerDisplayName === 'GetYourGuide') {
      return { ...exp, rankScore: exp.rankScore + 0.05 };
    }
    return exp;
  });
  gygBoosted.sort((a, b) => b.rankScore - a.rankScore);

  const topExperiences = gygBoosted.slice(0, 5);
  const cityPriority = getCityPriority(city);

  const categoryFiltered = gygBoosted.filter(exp => {
    if (!isCategoryAllowedForCity(exp.category, city)) return false;
    const catDef = EXPERIENCE_CATEGORIES.find(c => c.mapToActivityCategory === exp.category);
    if (!catDef) return true;
    return cityPriority.categories.includes(catDef.id);
  });

  console.log('[ExperienceAggregator] Ranked results:', {
    total: gygBoosted.length,
    top: topExperiences.length,
    categoryFiltered: categoryFiltered.length,
  });

  return {
    topExperiences,
    categoryResults: categoryFiltered.slice(0, 8),
    allResults: gygBoosted,
    cityBestCategories: cityPriority.categories,
  };
}

export function getTopForCategory(
  results: RankedExperience[],
  categoryId: ExperienceCategoryId,
  limit: number = 4,
): RankedExperience[] {
  const catDef = EXPERIENCE_CATEGORIES.find(c => c.id === categoryId);
  if (!catDef) return [];

  return results
    .filter(r => r.category === catDef.mapToActivityCategory)
    .slice(0, limit);
}
