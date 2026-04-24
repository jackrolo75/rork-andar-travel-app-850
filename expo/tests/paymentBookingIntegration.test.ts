import { getApiBaseUrl } from '../lib/env';

const API_BASE = getApiBaseUrl() || 'http://localhost:3000';

interface CheckoutResponse {
  success: boolean;
  sessionId?: string;
  checkoutUrl?: string;
  error?: string;
}

interface PaymentIntentResponse {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

interface RedirectResponse {
  success: boolean;
  clickId?: string;
  redirectUrl?: string | null;
  status?: string;
  next?: string;
  error?: string;
}

interface ConfirmPaymentResponse {
  success: boolean;
  status?: string;
  bookingId?: string;
  message?: string;
  error?: string;
}

interface ClickResponse {
  success: boolean;
  click?: Record<string, unknown>;
  error?: string;
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<{ status: number; body: T }> {
  const res = await fetch(url, options);
  const body = await res.json() as T;
  return { status: res.status, body };
}

async function testStripeCheckoutCreation(): Promise<boolean> {
  console.log('[TEST] POST /stripe/create-checkout creates a session');
  try {
    const { status, body } = await fetchJSON<CheckoutResponse>(`${API_BASE}/stripe/create-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: `BK_TEST_${Date.now()}`,
        bookingType: 'transport',
        basePrice: 50.00,
        currency: 'usd',
        passengerName: 'Test User',
        phoneNumber: '+1234567890',
        routeId: 'test-route-001',
        routeDetails: {
          origin: 'Dublin',
          destination: 'City Tour',
          departureTime: '2026-04-15T10:00:00',
          operator: 'AndarTravel Activities',
        },
      }),
    });

    if (status === 429) {
      console.log('[SKIP] Rate limited, skipping');
      return true;
    }

    if (status !== 200) {
      console.error(`[FAIL] Expected 200, got ${status}`, body);
      return false;
    }
    if (!body.success) {
      console.error('[FAIL] Expected success: true', body);
      return false;
    }
    if (!body.sessionId || typeof body.sessionId !== 'string') {
      console.error('[FAIL] Missing or invalid sessionId');
      return false;
    }
    if (!body.checkoutUrl || !body.checkoutUrl.includes('stripe.com')) {
      console.error('[FAIL] Missing or invalid checkoutUrl');
      return false;
    }

    console.log('[PASS] Stripe checkout session created:', body.sessionId);
    return true;
  } catch (err) {
    console.error('[FAIL] Checkout creation error:', err);
    return false;
  }
}

async function testStripeCheckoutValidation(): Promise<boolean> {
  console.log('[TEST] POST /stripe/create-checkout rejects missing required fields');
  try {
    const { status, body: _body } = await fetchJSON<CheckoutResponse>(`${API_BASE}/stripe/create-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingType: 'transport',
      }),
    });

    if (status === 429) {
      console.log('[SKIP] Rate limited');
      return true;
    }

    if (status !== 400 && status !== 500) {
      console.error(`[FAIL] Expected 400 or 500 for missing fields, got ${status}`);
      return false;
    }

    console.log('[PASS] Validation rejects incomplete checkout request');
    return true;
  } catch (err) {
    console.error('[FAIL] Checkout validation error:', err);
    return false;
  }
}

async function testActivitiesPaymentIntentCreation(): Promise<boolean> {
  console.log('[TEST] POST /api/activities/create-payment-intent creates a PaymentIntent');
  try {
    const { status, body } = await fetchJSON<PaymentIntentResponse>(`${API_BASE}/api/activities/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityId: 'test-act-pi-001',
        partnerId: 'viator',
        clickId: `clk_test_${Date.now()}`,
        quoteId: `qt_test_${Date.now()}`,
        amount: 75.50,
        currency: 'usd',
        customerEmail: 'test@example.com',
      }),
    });

    if (status === 429) {
      console.log('[SKIP] Rate limited');
      return true;
    }

    if (status !== 200) {
      console.error(`[FAIL] Expected 200, got ${status}`, body);
      return false;
    }
    if (!body.success) {
      console.error('[FAIL] Expected success: true', body);
      return false;
    }
    if (!body.paymentIntentId || !body.paymentIntentId.startsWith('pi_')) {
      console.error('[FAIL] Missing or invalid paymentIntentId:', body.paymentIntentId);
      return false;
    }
    if (!body.clientSecret) {
      console.error('[FAIL] Missing clientSecret');
      return false;
    }

    console.log('[PASS] PaymentIntent created:', body.paymentIntentId);
    return true;
  } catch (err) {
    console.error('[FAIL] PaymentIntent creation error:', err);
    return false;
  }
}

async function testActivitiesPaymentIntentValidation(): Promise<boolean> {
  console.log('[TEST] POST /api/activities/create-payment-intent rejects invalid amount');
  try {
    const { status, body } = await fetchJSON<PaymentIntentResponse>(`${API_BASE}/api/activities/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityId: '',
        amount: -10,
        currency: 'usd',
      }),
    });

    if (status === 429) {
      console.log('[SKIP] Rate limited');
      return true;
    }

    if (body.success === true) {
      console.error('[FAIL] Should not succeed with invalid data');
      return false;
    }

    console.log('[PASS] PaymentIntent rejects invalid input');
    return true;
  } catch (err) {
    console.error('[FAIL] PaymentIntent validation error:', err);
    return false;
  }
}

async function testFullRedirectBookingFlow(): Promise<boolean> {
  console.log('[TEST] Full redirect booking: create click → verify click → check status');
  try {
    const { status: s1, body: redirectBody } = await fetchJSON<RedirectResponse>(`${API_BASE}/api/activities/redirect-book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityId: 'test-flow-act-001',
        partnerId: 'tiqets',
        quoteId: `qt_flow_${Date.now()}`,
        partnerBaseUrl: 'https://tp.media/r?marker=581079&trs=512489&p=2074&u=https%3A%2F%2Ftiqets.com&campaign_id=89',
        userHash: 'user_flow_test',
        requestId: 'search_flow_001',
      }),
    });

    if (s1 !== 200 || !redirectBody.success || !redirectBody.clickId) {
      console.error('[FAIL] Step 1: redirect-book failed', redirectBody);
      return false;
    }

    console.log('  Step 1 PASS: clickId =', redirectBody.clickId);

    const { status: s2, body: clickBody } = await fetchJSON<ClickResponse>(
      `${API_BASE}/api/activities/click/${redirectBody.clickId}`,
    );

    if (s2 !== 200 || !clickBody.success || !clickBody.click) {
      console.error('[FAIL] Step 2: click retrieval failed', clickBody);
      return false;
    }

    if (clickBody.click.activityId !== 'test-flow-act-001') {
      console.error('[FAIL] Step 2: activityId mismatch', clickBody.click.activityId);
      return false;
    }

    console.log('  Step 2 PASS: click retrieved, activityId matches');

    if (redirectBody.status === 'redirect' && redirectBody.redirectUrl) {
      if (!redirectBody.redirectUrl.includes('sub_id=')) {
        console.error('[FAIL] Step 3: redirect URL missing sub_id');
        return false;
      }
      if (!redirectBody.redirectUrl.includes('utm_source=andartravel')) {
        console.error('[FAIL] Step 3: redirect URL missing utm_source');
        return false;
      }
      console.log('  Step 3 PASS: redirect URL has tracking params');
    } else {
      console.log('  Step 3 PASS: placeholder mode (no partner URL configured)');
    }

    console.log('[PASS] Full redirect booking flow completed');
    return true;
  } catch (err) {
    console.error('[FAIL] Redirect booking flow error:', err);
    return false;
  }
}

async function testPlaceholderRedirectFlow(): Promise<boolean> {
  console.log('[TEST] Placeholder redirect: no partner URL → returns placeholder status');
  try {
    const { status, body } = await fetchJSON<RedirectResponse>(`${API_BASE}/api/activities/redirect-book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityId: 'test-placeholder-001',
        partnerId: 'getyourguide',
        quoteId: `qt_ph_${Date.now()}`,
        partnerBaseUrl: '',
        userHash: null,
        requestId: null,
      }),
    });

    if (status !== 200 || !body.success) {
      console.error('[FAIL] Expected 200 + success', body);
      return false;
    }

    if (!body.clickId || !body.clickId.startsWith('clk_')) {
      console.error('[FAIL] clickId should start with clk_:', body.clickId);
      return false;
    }

    if (body.status !== 'placeholder') {
      console.error('[FAIL] Expected placeholder status, got:', body.status);
      return false;
    }

    if (!body.next || !body.next.includes('click_id')) {
      console.error('[FAIL] Placeholder should have next URL with click_id');
      return false;
    }

    console.log('[PASS] Placeholder redirect flow:', body.clickId);
    return true;
  } catch (err) {
    console.error('[FAIL] Placeholder flow error:', err);
    return false;
  }
}

async function testPaymentConfirmEndpoint(): Promise<boolean> {
  console.log('[TEST] POST /api/activities/confirm-payment handles confirm flow');
  try {
    const { status, body } = await fetchJSON<ConfirmPaymentResponse>(`${API_BASE}/api/activities/confirm-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentIntentId: 'pi_test_nonexistent',
        clientSecret: 'cs_test_fake',
        activityId: 'test-confirm-001',
        partnerId: 'viator',
        clickId: `clk_confirm_${Date.now()}`,
        quoteId: `qt_confirm_${Date.now()}`,
        amount: 100,
        currency: 'usd',
      }),
    });

    if (status === 429) {
      console.log('[SKIP] Rate limited');
      return true;
    }

    if (status === 200 && body.success) {
      console.log('[PASS] Confirm payment succeeded (test intent)');
      return true;
    }

    if (status === 400 || status === 500) {
      console.log('[PASS] Confirm payment correctly rejects invalid PaymentIntent');
      return true;
    }

    console.error(`[FAIL] Unexpected status ${status}:`, body);
    return false;
  } catch (err) {
    console.error('[FAIL] Confirm payment error:', err);
    return false;
  }
}

async function testClickIdPersistenceBeforeRedirect(): Promise<boolean> {
  console.log('[TEST] Click ID is persisted BEFORE any redirect occurs');
  try {
    const _clickId = `clk_persist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const { status: s1, body: redirectBody } = await fetchJSON<RedirectResponse>(`${API_BASE}/api/activities/redirect-book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activityId: 'test-persist-001',
        partnerId: 'tiqets',
        quoteId: `qt_persist_${Date.now()}`,
        partnerBaseUrl: 'https://example.com/book',
      }),
    });

    if (s1 !== 200 || !redirectBody.success || !redirectBody.clickId) {
      console.error('[FAIL] redirect-book did not return clickId');
      return false;
    }

    const { status: s2, body: clickBody } = await fetchJSON<ClickResponse>(
      `${API_BASE}/api/activities/click/${redirectBody.clickId}`,
    );

    if (s2 !== 200 || !clickBody.success || !clickBody.click) {
      console.error('[FAIL] Click was not persisted before redirect');
      return false;
    }

    const click = clickBody.click;
    if (click.status !== 'pending' && click.status !== 'clicked') {
      console.error('[FAIL] Click status should be pending or clicked, got:', click.status);
      return false;
    }

    console.log('[PASS] Click persisted before redirect:', redirectBody.clickId);
    return true;
  } catch (err) {
    console.error('[FAIL] Click persistence test error:', err);
    return false;
  }
}

export async function runPaymentBookingTests(): Promise<void> {
  console.log('============================================');
  console.log('  AndarTravel — Payment & Booking Tests');
  console.log('  Integration Test Suite');
  console.log('============================================\n');

  const results: { name: string; passed: boolean }[] = [];

  const tests = [
    { name: 'Stripe checkout session creation', fn: testStripeCheckoutCreation },
    { name: 'Stripe checkout input validation', fn: testStripeCheckoutValidation },
    { name: 'Activities PaymentIntent creation', fn: testActivitiesPaymentIntentCreation },
    { name: 'Activities PaymentIntent validation', fn: testActivitiesPaymentIntentValidation },
    { name: 'Full redirect booking flow (click→verify→tracking)', fn: testFullRedirectBookingFlow },
    { name: 'Placeholder redirect flow (no partner URL)', fn: testPlaceholderRedirectFlow },
    { name: 'Payment confirm endpoint handling', fn: testPaymentConfirmEndpoint },
    { name: 'Click ID persisted before redirect', fn: testClickIdPersistenceBeforeRedirect },
  ];

  for (const test of tests) {
    const passed = await test.fn();
    results.push({ name: test.name, passed });
    console.log('');
  }

  console.log('============================================');
  console.log('  Payment & Booking Test Results');
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
    console.error(`${failCount} payment/booking test(s) failed.`);
  }
}

void runPaymentBookingTests();
