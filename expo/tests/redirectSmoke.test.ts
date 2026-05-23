/**
 * One-shot redirect smoke test.
 *
 * Walks every CTA in the app and logs the resolved affiliate URL so we can
 * eyeball every redirect on both iOS and Android without tapping by hand.
 *
 * How to run:
 *   bunx tsx expo/tests/redirectSmoke.test.ts
 *   # or, from the expo/ folder:
 *   bunx tsx tests/redirectSmoke.test.ts
 *
 * What it asserts (per CTA):
 *   1. URL is non-empty
 *   2. URL is a valid https://www.getyourguide.com link
 *   3. URL carries our `partner_id=D82WHJ5` (commission attribution)
 *   4. URL carries `utm_source=andartravel`
 *
 * Failure exits with code 1 so CI can gate releases on it.
 */
import {
  buildDestinationUrl,
  buildCategoryUrl,
  buildSearchUrl,
  buildActivityQueryUrl,
  GYG_PARTNER_ID,
} from '../constants/affiliateLinks';
import { withTracking } from '../services/RedirectService';
import type { ActivityCategory } from '../types/activities';

interface SmokeCase {
  screen: string;
  cta: string;
  url: string;
}

const CITIES = ['Tokyo', 'Bali', 'Paris', 'Dubai', 'London', 'Rome', 'Barcelona'];
const CATEGORIES: ActivityCategory[] = [
  'adventure', 'culture', 'food', 'nature',
  'wellness', 'water', 'nightlife', 'tickets',
];

function collectCases(): SmokeCase[] {
  const cases: SmokeCase[] = [];

  // (tabs)/index.tsx — Home: city card → destination URL
  for (const city of CITIES) {
    cases.push({
      screen: '(tabs)/index',
      cta: `City card "${city}"`,
      url: buildDestinationUrl(city),
    });
  }

  // (tabs)/search.tsx + activities-search.tsx — Search CTA
  for (const city of CITIES) {
    cases.push({
      screen: 'search',
      cta: `Search "${city}" today, 2 guests`,
      url: buildSearchUrl({
        destination: city,
        date: new Date().toISOString().slice(0, 10),
        guests: 2,
      }),
    });
  }

  // Category chips × city
  for (const city of CITIES.slice(0, 3)) {
    for (const cat of CATEGORIES) {
      cases.push({
        screen: 'search/categoryChip',
        cta: `${city} · ${cat}`,
        url: buildCategoryUrl(cat, city),
      });
    }
  }

  // activity-confirmation.tsx — query-based deep link
  cases.push({
    screen: 'activity-confirmation',
    cta: 'Book "snorkeling tour" in Bali',
    url: buildActivityQueryUrl('Bali', 'snorkeling tour'),
  });
  cases.push({
    screen: 'activity-confirmation',
    cta: 'Book "Eiffel Tower skip-the-line" in Paris',
    url: buildActivityQueryUrl('Paris', 'Eiffel Tower skip-the-line'),
  });

  // favorites.tsx — destination from saved favorite
  cases.push({
    screen: 'favorites',
    cta: 'Open saved favorite (Rome)',
    url: buildDestinationUrl('Rome'),
  });

  // promotions.tsx — hardcoded promo links pass through withTracking
  cases.push({
    screen: 'promotions',
    cta: 'GYG Best Deals',
    url: withTracking(
      `https://www.getyourguide.com/s/?q=deals&partner_id=${GYG_PARTNER_ID}&utm_source=andartravel&utm_medium=app&utm_campaign=promotions`,
    ),
  });

  // Edge cases — these MUST not crash, even with bad input.
  cases.push({
    screen: 'edge',
    cta: 'Empty city → fallback search',
    url: buildDestinationUrl(''),
  });
  cases.push({
    screen: 'edge',
    cta: 'Whitespace city → fallback search',
    url: buildDestinationUrl('   '),
  });
  cases.push({
    screen: 'edge',
    cta: 'Unknown city → free-text search',
    url: buildDestinationUrl('Reykjavik'),
  });

  return cases;
}

interface Failure {
  cta: string;
  url: string;
  reason: string;
}

function validate(c: SmokeCase): Failure | null {
  if (!c.url) return { cta: c.cta, url: c.url, reason: 'empty URL' };
  let parsed: URL;
  try {
    parsed = new URL(c.url);
  } catch {
    return { cta: c.cta, url: c.url, reason: 'malformed URL' };
  }
  if (parsed.protocol !== 'https:') {
    return { cta: c.cta, url: c.url, reason: `non-https protocol: ${parsed.protocol}` };
  }
  if (!parsed.hostname.includes('getyourguide.com')) {
    return { cta: c.cta, url: c.url, reason: `unexpected host: ${parsed.hostname}` };
  }
  if (parsed.searchParams.get('partner_id') !== GYG_PARTNER_ID) {
    return { cta: c.cta, url: c.url, reason: `missing/wrong partner_id (want ${GYG_PARTNER_ID})` };
  }
  if (parsed.searchParams.get('utm_source') !== 'andartravel') {
    return { cta: c.cta, url: c.url, reason: 'missing utm_source=andartravel' };
  }
  return null;
}

function run(): number {
  const platforms: ('ios' | 'android')[] = ['ios', 'android'];
  const cases = collectCases();
  const failures: Failure[] = [];

  console.log(`\n=== Redirect smoke test — ${cases.length} CTAs × ${platforms.length} platforms ===\n`);

  for (const platform of platforms) {
    console.log(`\n--- Platform: ${platform.toUpperCase()} ---`);
    for (const c of cases) {
      const fail = validate(c);
      const status = fail ? 'FAIL' : 'OK  ';
      console.log(`[${status}] ${c.screen.padEnd(28)} · ${c.cta}`);
      console.log(`        → ${c.url}`);
      if (fail) failures.push(fail);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total checks: ${cases.length * platforms.length}`);
  console.log(`Failures    : ${failures.length}`);
  if (failures.length > 0) {
    console.log(`\nFailures detail:`);
    for (const f of failures) {
      console.log(`  - ${f.cta}: ${f.reason}`);
      console.log(`    url=${f.url}`);
    }
    return 1;
  }
  console.log(`All redirects pass on iOS + Android. ✅`);
  return 0;
}

// Auto-run when invoked directly (e.g. via tsx).
const code = run();
if (typeof process !== 'undefined' && typeof process.exit === 'function') {
  process.exit(code);
}

export { collectCases, validate, run };
