import { getApiBaseUrl } from '../lib/env';

const API_BASE = getApiBaseUrl() || 'http://localhost:3000';

interface SearchResponse {
  success: boolean;
  request_id?: string;
  cached_results?: unknown[];
  status?: string;
  error?: string;
  params?: Record<string, unknown>;
}

interface StatusResponse {
  success: boolean;
  request_id?: string;
  status?: string;
  cached_results?: unknown[];
  resultCount?: number;
  partnerResults?: Record<string, number>;
  completedAt?: string | null;
  error?: string;
}

interface RedirectResponse {
  success: boolean;
  clickId?: string;
  redirectUrl?: string | null;
  clickRecord?: Record<string, unknown>;
  status?: string;
  next?: string;
  error?: string;
}

interface ClickResponse {
  success: boolean;
  click?: Record<string, unknown>;
  error?: string;
}

interface StatsResponse {
  success: boolean;
  clicks?: { total: number; converted: number; rate: number };
  worker?: { queueDepth: number; isProcessing: boolean; totalJobs: number };
  flags?: Record<string, boolean>;
}

interface FlagsResponse {
  success: boolean;
  flags?: Record<string, boolean>;
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<{ status: number; body: T }> {
  const res = await fetch(url, options);
  const body = await res.json() as T;
  return { status: res.status, body };
}

async function testSearchReturnsRequestId(): Promise<boolean> {
  console.log('[TEST] POST /api/activities/search returns request_id and status queued');
  try {
    const { status, body } = await fetchJSON<SearchResponse>(`${API_BASE}/api/activities/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: 'Dublin',
        date: '2026-04-15',
        guests: 2,
        strictLocation: true,
      }),
    });

    if (status !== 200) {
      console.error(`[FAIL] Expected 200, got ${status}`);
      return false;
    }
    if (!body.success) {
      console.error('[FAIL] Expected success: true, got', body);
      return false;
    }
    if (!body.request_id || typeof body.request_id !== 'string') {
      console.error('[FAIL] Missing or invalid request_id:', body.request_id);
      return false;
    }
    if (body.status !== 'queued') {
      console.error('[FAIL] Expected status: queued, got:', body.status);
      return false;
    }
    if (!Array.isArray(body.cached_results)) {
      console.error('[FAIL] cached_results should be an array');
      return false;
    }

    console.log('[PASS] Search returns request_id:', body.request_id);
    return true;
  } catch (err) {
    console.error('[FAIL] Fetch error:', err);
    return false;
  }
}

async function testSearchRejects400WhenNoLocation(): Promise<boolean> {
  console.log('[TEST] POST /api/activities/search returns 400 when no location');
  try {
    const { status, body } = await fetchJSON<SearchResponse>(`${API_BASE}/api/activities/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2026-04-15',
        guests: 2,
      }),
    });

    if (status !== 400) {
      console.error(`[FAIL] Expected 400, got ${status}`);
      return false;
    }
    if (body.success !== false) {
      console.error('[FAIL] Expected success: false');
      return false;
    }

    console.log('[PASS] 400 returned for missing location');
    return true;
  } catch (err) {
    console.error('[FAIL] Fetch error:', err);
    return false;
  }
}

async function testSearchStatusEndpoint(): Promise<boolean> {
  console.log('[TEST] GET /api/activities/search/status returns search record');
  try {
    const { body: searchBody } = await fetchJSON<SearchResponse>(`${API_BASE}/api/activities/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: 'Tokyo',
        date: '2026-05-01',
        guests: 1,
        strictLocation: true,
        radiusKm: 30,
      }),
    });

    if (!searchBody.request_id) {
      console.error('[FAIL] No request_id from search');
      return false;
    }

    const { status, body } = await fetchJSON<StatusResponse>(
      `${API_BASE}/api/activities/search/status?request_id=${searchBody.request_id}`,
    );

    if (status !== 200) {
      console.error(`[FAIL] Expected 200, got ${status}`);
      return false;
    }
    if (!body.success) {
      console.error('[FAIL] Expected success: true');
      return false;
    }
    if (body.request_id !== searchBody.request_id) {
      console.error('[FAIL] request_id mismatch');
      return false;
    }

    console.log('[PASS] Status endpoint returns valid record for', body.request_id);
    return true;
  } catch (err) {
    console.error('[FAIL] Fetch error:', err);
    return false;
  }
}

async function testSearchStatusMissingId(): Promise<boolean> {
  console.log('[TEST] GET /api/activities/search/status returns 400 without request_id');
  try {
    const { status } = await fetchJSON<StatusResponse>(
      `${API_BASE}/api/activities/search/status`,
    );

    if (status !== 400) {
      console.error(`[FAIL] Expected 400, got ${status}`);
      return false;
    }

    console.log('[PASS] 400 returned for missing request_id');
    return true;
  } catch (err) {
    console.error('[FAIL] Fetch error:', err);
    return false;
  }
}

async function testSearchWithPlaceId(): Promise<boolean> {
  console.log('[TEST] POST /api/activities/search accepts place_id instead of destination');
  try {
    const { status, body } = await fetchJSON<SearchResponse>(`${API_BASE}/api/activities/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        placeId: 'place_dublin',
        date: '2026-04-20',
        guests: 3,
      }),
    });

    if (status !== 200) {
      console.error(`[FAIL] Expected 200, got ${status}`);
      return false;
    }
    if (!body.request_id) {
      console.error('[FAIL] Missing request_id');
      return false;
    }

    console.log('[PASS] Search with place_id returns request_id:', body.request_id);
    return true;
  } catch (err) {
    console.error('[FAIL] Fetch error:', err);
    return false;
  }
}

async function testGeocoderService(): Promise<boolean> {
  console.log('[TEST] Mock geocoder resolves known places');
  try {
    const { resolvePlace } = await import('../services/GeocodingService');

    const dublin = resolvePlace('Dublin');
    if (!dublin) {
      console.error('[FAIL] resolvePlace("Dublin") returned null');
      return false;
    }
    if (dublin.name !== 'Dublin') {
      console.error('[FAIL] Expected name "Dublin", got:', dublin.name);
      return false;
    }
    if (typeof dublin.centroid.lat !== 'number' || typeof dublin.centroid.lon !== 'number') {
      console.error('[FAIL] Centroid missing lat/lon');
      return false;
    }
    if (!dublin.bbox || typeof dublin.bbox.north !== 'number') {
      console.error('[FAIL] BBox missing or malformed');
      return false;
    }

    const unknown = resolvePlace('Atlantis');
    if (!unknown) {
      console.error('[FAIL] resolvePlace("Atlantis") should return approximate');
      return false;
    }
    if (unknown.placeId.indexOf('approx') === -1) {
      console.error('[FAIL] Unknown place should have approx in placeId');
      return false;
    }

    console.log('[PASS] Geocoder resolves known and unknown places');
    return true;
  } catch (err) {
    console.error('[FAIL] Geocoder test error:', err);
    return false;
  }
}

async function testGeocoderProviderPipeline(): Promise<boolean> {
  console.log('[TEST] Geocoder provider pipeline resolves via static then approx');
  try {
    const { StaticGeocoderProvider, ApproximateGeocoderProvider } = await import('../services/geocoder/StaticGeocoderProvider');
    const { createGeocoderPipeline } = await import('../services/geocoder/GeocoderProvider');

    const pipeline = createGeocoderPipeline([
      new StaticGeocoderProvider(),
      new ApproximateGeocoderProvider(),
    ]);

    const paris = await pipeline.resolve('Paris');
    if (!paris) {
      console.error('[FAIL] Pipeline failed to resolve Paris');
      return false;
    }
    if (paris.name !== 'Paris') {
      console.error('[FAIL] Expected Paris, got:', paris.name);
      return false;
    }
    if (!paris.placeId.startsWith('place_')) {
      console.error('[FAIL] placeId should start with place_:', paris.placeId);
      return false;
    }

    const nyc = await pipeline.resolve('nyc');
    if (!nyc) {
      console.error('[FAIL] Pipeline failed to resolve "nyc" alias');
      return false;
    }
    if (nyc.name !== 'New York') {
      console.error('[FAIL] Expected New York for "nyc", got:', nyc.name);
      return false;
    }

    const unknown = await pipeline.resolve('ZzzNonexistentPlace');
    if (!unknown) {
      console.error('[FAIL] Pipeline should return approximate for unknown places');
      return false;
    }
    if (!unknown.placeId.includes('approx')) {
      console.error('[FAIL] Unknown place should have approx in placeId');
      return false;
    }

    console.log('[PASS] Geocoder provider pipeline works correctly');
    return true;
  } catch (err) {
    console.error('[FAIL] Pipeline test error:', err);
    return false;
  }
}

async function testGeoFilterStrict(): Promise<boolean> {
  console.log('[TEST] GeoFilter strict mode excludes far offers');
  try {
    const { geoFilterOffers } = await import('../services/GeoFilterService');
    const { resolvePlace } = await import('../services/GeocodingService');

    const dublin = resolvePlace('Dublin');
    if (!dublin) {
      console.error('[FAIL] Could not resolve Dublin');
      return false;
    }

    const mockOffers = [
      {
        id: 'near-1',
        title: 'Dublin Castle Tour',
        city: 'Dublin',
        country: 'Ireland',
        geo: { lat: 53.3428, lon: -6.2674 },
        price: 30,
        rating: 4.5,
        reviewCount: 100,
      },
      {
        id: 'far-1',
        title: 'London Eye Tickets',
        city: 'London',
        country: 'UK',
        geo: { lat: 51.5033, lon: -0.1195 },
        price: 40,
        rating: 4.7,
        reviewCount: 200,
      },
    ] as any[];

    const strictResults = geoFilterOffers(mockOffers, dublin, true, 50);
    const hasNear = strictResults.some(r => r.offer.id === 'near-1');
    const hasFar = strictResults.some(r => r.offer.id === 'far-1');

    if (!hasNear) {
      console.error('[FAIL] Near offer should pass strict filter');
      return false;
    }
    if (hasFar) {
      console.error('[FAIL] Far offer should NOT pass strict filter');
      return false;
    }

    console.log('[PASS] Strict geo filter works correctly');
    return true;
  } catch (err) {
    console.error('[FAIL] GeoFilter test error:', err);
    return false;
  }
}

async function testGeoFilterBboxMatch(): Promise<boolean> {
  console.log('[TEST] GeoFilter bbox match returns high confidence');
  try {
    const { geoFilterOffers } = await import('../services/GeoFilterService');
    const { resolvePlace } = await import('../services/GeocodingService');

    const tokyo = resolvePlace('Tokyo');
    if (!tokyo) {
      console.error('[FAIL] Could not resolve Tokyo');
      return false;
    }

    const insideBbox = [
      {
        id: 'inside-1',
        title: 'Shibuya Walking Tour',
        city: 'Tokyo',
        country: 'Japan',
        geo: { lat: 35.6595, lon: 139.7004 },
        price: 25,
        rating: 4.8,
        reviewCount: 300,
      },
    ] as any[];

    const results = geoFilterOffers(insideBbox, tokyo, true, 50);
    if (results.length === 0) {
      console.error('[FAIL] Offer inside bbox should be included');
      return false;
    }
    if (results[0].matchMethod !== 'bbox') {
      console.error('[FAIL] Expected bbox match, got:', results[0].matchMethod);
      return false;
    }
    if (results[0].confidenceScore < 0.9) {
      console.error('[FAIL] Bbox match should have high confidence, got:', results[0].confidenceScore);
      return false;
    }

    console.log('[PASS] Bbox match returns high confidence');
    return true;
  } catch (err) {
    console.error('[FAIL] Bbox test error:', err);
    return false;
  }
}

async function testRedirectBookPersistsClickId(): Promise<boolean> {
  console.log('[TEST] POST /api/activities/redirect-book persists click_id');
  try {
    const { status, body } = await fetchJSON<RedirectResponse>(`${API_BASE}/api/activities/redirect-book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityId: 'test-act-123',
        partnerId: 'tiqets',
        quoteId: 'qt_test_001',
        partnerBaseUrl: '',
        userHash: 'user_abc',
        requestId: 'search_test_001',
      }),
    });

    if (status !== 200) {
      console.error(`[FAIL] Expected 200, got ${status}`);
      return false;
    }
    if (!body.success) {
      console.error('[FAIL] Expected success: true');
      return false;
    }
    if (!body.clickId || typeof body.clickId !== 'string') {
      console.error('[FAIL] Missing or invalid clickId');
      return false;
    }
    if (!body.clickId.startsWith('clk_')) {
      console.error('[FAIL] clickId should start with clk_');
      return false;
    }
    if (body.status !== 'placeholder') {
      console.error('[FAIL] Expected placeholder status (no partner URL), got:', body.status);
      return false;
    }
    if (!body.next || !body.next.includes('click_id')) {
      console.error('[FAIL] Placeholder should have next URL with click_id');
      return false;
    }

    console.log('[PASS] redirect-book persists click_id:', body.clickId);
    return true;
  } catch (err) {
    console.error('[FAIL] Redirect book test error:', err);
    return false;
  }
}

async function testRedirectBookWithPartnerUrl(): Promise<boolean> {
  console.log('[TEST] POST /api/activities/redirect-book with partner URL returns redirect');
  try {
    const { status, body } = await fetchJSON<RedirectResponse>(`${API_BASE}/api/activities/redirect-book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityId: 'test-act-456',
        partnerId: 'tiqets',
        quoteId: 'qt_test_002',
        partnerBaseUrl: 'https://tp.media/r?marker=581079&trs=512489&p=2074&u=https%3A%2F%2Ftiqets.com&campaign_id=89',
        userHash: null,
        requestId: null,
      }),
    });

    if (status !== 200) {
      console.error(`[FAIL] Expected 200, got ${status}`);
      return false;
    }
    if (!body.success) {
      console.error('[FAIL] Expected success: true');
      return false;
    }
    if (!body.clickId) {
      console.error('[FAIL] Missing clickId');
      return false;
    }

    const hasRedirectUrl = body.status === 'redirect' && !!body.redirectUrl;
    const isPlaceholder = body.status === 'placeholder';

    if (!hasRedirectUrl && !isPlaceholder) {
      console.error('[FAIL] Expected either redirect or placeholder status');
      return false;
    }

    if (hasRedirectUrl && body.redirectUrl) {
      if (!body.redirectUrl.includes('sub_id=')) {
        console.error('[FAIL] Redirect URL should contain sub_id tracking param');
        return false;
      }
      if (!body.redirectUrl.includes('utm_source=andartravel')) {
        console.error('[FAIL] Redirect URL should contain utm_source');
        return false;
      }
    }

    console.log('[PASS] redirect-book with partner URL:', body.status, body.clickId);
    return true;
  } catch (err) {
    console.error('[FAIL] Redirect book with URL test error:', err);
    return false;
  }
}

async function testRedirectBookRejects400NoActivityId(): Promise<boolean> {
  console.log('[TEST] POST /api/activities/redirect-book returns 400 without activityId');
  try {
    const { status, body } = await fetchJSON<RedirectResponse>(`${API_BASE}/api/activities/redirect-book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partnerId: 'tiqets',
        quoteId: 'qt_test_bad',
      }),
    });

    if (status !== 400) {
      console.error(`[FAIL] Expected 400, got ${status}`);
      return false;
    }
    if (body.success !== false) {
      console.error('[FAIL] Expected success: false');
      return false;
    }

    console.log('[PASS] 400 returned for missing activityId');
    return true;
  } catch (err) {
    console.error('[FAIL] Validation test error:', err);
    return false;
  }
}

async function testClickRetrievalEndpoint(): Promise<boolean> {
  console.log('[TEST] GET /api/activities/click/:clickId retrieves persisted click');
  try {
    const { body: redirectBody } = await fetchJSON<RedirectResponse>(`${API_BASE}/api/activities/redirect-book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityId: 'test-act-retrieval',
        partnerId: 'viator',
        quoteId: 'qt_retrieve_001',
        partnerBaseUrl: '',
      }),
    });

    if (!redirectBody.clickId) {
      console.error('[FAIL] No clickId from redirect-book');
      return false;
    }

    const { status, body } = await fetchJSON<ClickResponse>(
      `${API_BASE}/api/activities/click/${redirectBody.clickId}`,
    );

    if (status !== 200) {
      console.error(`[FAIL] Expected 200, got ${status}`);
      return false;
    }
    if (!body.success || !body.click) {
      console.error('[FAIL] Expected success with click data');
      return false;
    }
    if (body.click.clickId !== redirectBody.clickId) {
      console.error('[FAIL] clickId mismatch');
      return false;
    }
    if (body.click.activityId !== 'test-act-retrieval') {
      console.error('[FAIL] activityId mismatch');
      return false;
    }

    console.log('[PASS] Click retrieval works for:', redirectBody.clickId);
    return true;
  } catch (err) {
    console.error('[FAIL] Click retrieval test error:', err);
    return false;
  }
}

async function testStatsEndpoint(): Promise<boolean> {
  console.log('[TEST] GET /api/activities/stats returns aggregated stats');
  try {
    const { status, body } = await fetchJSON<StatsResponse>(`${API_BASE}/api/activities/stats`);

    if (status !== 200) {
      console.error(`[FAIL] Expected 200, got ${status}`);
      return false;
    }
    if (!body.success) {
      console.error('[FAIL] Expected success: true');
      return false;
    }
    if (!body.clicks || typeof body.clicks.total !== 'number') {
      console.error('[FAIL] Missing clicks stats');
      return false;
    }
    if (!body.worker || typeof body.worker.totalJobs !== 'number') {
      console.error('[FAIL] Missing worker stats');
      return false;
    }
    if (!body.flags || typeof body.flags.activities_enabled !== 'boolean') {
      console.error('[FAIL] Missing feature flags');
      return false;
    }

    console.log('[PASS] Stats endpoint returns valid data:', {
      clicks: body.clicks.total,
      workerJobs: body.worker.totalJobs,
    });
    return true;
  } catch (err) {
    console.error('[FAIL] Stats test error:', err);
    return false;
  }
}

async function testFlagsEndpoint(): Promise<boolean> {
  console.log('[TEST] GET /api/activities/flags returns feature flags');
  try {
    const { status, body } = await fetchJSON<FlagsResponse>(`${API_BASE}/api/activities/flags`);

    if (status !== 200) {
      console.error(`[FAIL] Expected 200, got ${status}`);
      return false;
    }
    if (!body.success || !body.flags) {
      console.error('[FAIL] Expected success with flags');
      return false;
    }
    if (typeof body.flags.activities_enabled !== 'boolean') {
      console.error('[FAIL] activities_enabled flag missing or wrong type');
      return false;
    }
    if (typeof body.flags.activities_affiliate_redirect_enabled !== 'boolean') {
      console.error('[FAIL] activities_affiliate_redirect_enabled flag missing');
      return false;
    }

    console.log('[PASS] Flags endpoint returns:', body.flags);
    return true;
  } catch (err) {
    console.error('[FAIL] Flags test error:', err);
    return false;
  }
}

export async function runAllTests(): Promise<void> {
  console.log('============================================');
  console.log('  AndarTravel Activities — Test Suite');
  console.log('  Phase A: Core Platform Stabilization');
  console.log('============================================\n');

  const results: { name: string; passed: boolean }[] = [];

  const tests = [
    { name: 'POST /activities/search returns request_id', fn: testSearchReturnsRequestId },
    { name: 'POST /activities/search 400 on missing location', fn: testSearchRejects400WhenNoLocation },
    { name: 'GET /activities/search/status returns record', fn: testSearchStatusEndpoint },
    { name: 'GET /activities/search/status 400 without id', fn: testSearchStatusMissingId },
    { name: 'POST /activities/search accepts place_id', fn: testSearchWithPlaceId },
    { name: 'Mock geocoder resolves places', fn: testGeocoderService },
    { name: 'Geocoder provider pipeline (static + approx)', fn: testGeocoderProviderPipeline },
    { name: 'Strict geo filter excludes far offers', fn: testGeoFilterStrict },
    { name: 'Bbox match returns high confidence', fn: testGeoFilterBboxMatch },
    { name: 'redirect-book persists click_id (placeholder)', fn: testRedirectBookPersistsClickId },
    { name: 'redirect-book with partner URL', fn: testRedirectBookWithPartnerUrl },
    { name: 'redirect-book 400 on missing activityId', fn: testRedirectBookRejects400NoActivityId },
    { name: 'Click retrieval by clickId', fn: testClickRetrievalEndpoint },
    { name: 'Stats endpoint returns aggregated data', fn: testStatsEndpoint },
    { name: 'Flags endpoint returns feature flags', fn: testFlagsEndpoint },
  ];

  for (const test of tests) {
    const passed = await test.fn();
    results.push({ name: test.name, passed });
    console.log('');
  }

  console.log('============================================');
  console.log('  Results');
  console.log('============================================');

  let passCount = 0;
  let failCount = 0;
  for (const r of results) {
    const icon = r.passed ? 'PASS' : 'FAIL';
    console.log(`  [${icon}] ${r.name}`);
    if (r.passed) passCount++;
    else failCount++;
  }

  console.log(`\n  Total: ${results.length} | Passed: ${passCount} | Failed: ${failCount}`);
  console.log('============================================\n');

  if (failCount > 0) {
    console.error(`${failCount} test(s) failed.`);
  }
}

void runAllTests();
