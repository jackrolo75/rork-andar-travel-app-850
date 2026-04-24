const GYG_PARTNER_ID = 'D82WHJ5';

const PARTNER_BASE_URLS: Record<string, string> = {
  getyourguide: 'https://www.getyourguide.com/s/',
  tiqets: 'https://www.getyourguide.com/s/',
  wegotrip: 'https://www.getyourguide.com/s/',
  searadar: 'https://www.getyourguide.com/s/',
  ticketnetwork: 'https://www.getyourguide.com/s/',
};

const PARTNER_AFF_PARAMS: Record<string, { affParam: string; affValue: string }> = {
  getyourguide: { affParam: 'partner_id', affValue: GYG_PARTNER_ID },
  tiqets: { affParam: 'partner_id', affValue: GYG_PARTNER_ID },
  wegotrip: { affParam: 'partner_id', affValue: GYG_PARTNER_ID },
  searadar: { affParam: 'partner_id', affValue: GYG_PARTNER_ID },
  ticketnetwork: { affParam: 'partner_id', affValue: GYG_PARTNER_ID },
};

export interface RedirectParams {
  activityId: string;
  partnerUrl: string;
  clickId: string;
  partnerId?: string;
  quoteId?: string;
  userHash?: string;
  requestId?: string;
}

export function buildTrackedRedirectUrl(params: RedirectParams): string {
  const { partnerUrl, clickId, quoteId, partnerId } = params;

  const url = new URL(partnerUrl);

  url.searchParams.set('sub_id', clickId);

  const partnerAff = partnerId ? PARTNER_AFF_PARAMS[partnerId] : null;
  if (partnerAff) {
    url.searchParams.set(partnerAff.affParam, partnerAff.affValue);
  } else {
    url.searchParams.set('aff_id', GYG_PARTNER_ID);
  }

  url.searchParams.set('utm_source', 'andartravel');
  url.searchParams.set('utm_medium', 'app');

  if (quoteId) {
    url.searchParams.set('sub_id2', quoteId);
  }

  return url.toString();
}

export function resolvePartnerUrl(partnerId: string | undefined, partnerUrl: string | undefined): string | null {
  if (partnerUrl && partnerUrl.length > 0) {
    try {
      new URL(partnerUrl);
      return partnerUrl;
    } catch {
      console.warn(`[RedirectBuilder] Invalid partner_url: ${partnerUrl}`);
    }
  }

  if (partnerId && PARTNER_BASE_URLS[partnerId]) {
    return PARTNER_BASE_URLS[partnerId];
  }

  return null;
}

export function generateClickId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `clk_${timestamp}_${random}`;
}

export { GYG_PARTNER_ID };
