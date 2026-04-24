import { ActivityClickRecord, buildActivityRedirectUrl } from '@/types/activities';

const clickStore = new Map<string, ActivityClickRecord>();

export function generateClickId(): string {
  return `clk_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

export function storeClickRecord(record: ActivityClickRecord): void {
  clickStore.set(record.clickId, record);
  console.log(`[CommissionTracker] Click stored: ${record.clickId} for activity ${record.activityId}`);
}

export function getClickRecord(clickId: string): ActivityClickRecord | undefined {
  return clickStore.get(clickId);
}

export function updateClickStatus(clickId: string, status: ActivityClickRecord['status']): void {
  const record = clickStore.get(clickId);
  if (record) {
    record.status = status;
    clickStore.set(clickId, record);
    console.log(`[CommissionTracker] Click ${clickId} status updated to ${status}`);
  }
}

export function createRedirectBooking(params: {
  activityId: string;
  partnerId: string;
  quoteId: string;
  partnerBaseUrl: string;
}): { clickId: string; redirectUrl: string; clickRecord: ActivityClickRecord } {
  const clickId = generateClickId();
  const redirectUrl = buildActivityRedirectUrl(clickId, params.quoteId, params.partnerBaseUrl);

  const clickRecord: ActivityClickRecord = {
    clickId,
    activityId: params.activityId,
    partnerId: params.partnerId,
    quoteId: params.quoteId,
    timestamp: new Date().toISOString(),
    utmSource: 'andartravel',
    utmMedium: 'app',
    redirectUrl,
    status: 'pending',
  };

  storeClickRecord(clickRecord);

  return { clickId, redirectUrl, clickRecord };
}

export function reconcileCommission(clickId: string, conversionData: {
  orderId?: string;
  revenue?: number;
  currency?: string;
}): boolean {
  const record = getClickRecord(clickId);
  if (!record) {
    console.error(`[CommissionTracker] Click ${clickId} not found for reconciliation`);
    return false;
  }

  if (record.status === 'converted') {
    console.log(`[CommissionTracker] Click ${clickId} already reconciled (idempotent)`);
    return true;
  }

  updateClickStatus(clickId, 'converted');
  console.log(`[CommissionTracker] Commission reconciled for click ${clickId}:`, conversionData);
  return true;
}

export function getAllClicks(): ActivityClickRecord[] {
  return Array.from(clickStore.values());
}

export function getClicksByActivity(activityId: string): ActivityClickRecord[] {
  return Array.from(clickStore.values()).filter(c => c.activityId === activityId);
}

export function getConversionRate(): { total: number; converted: number; rate: number } {
  const all = Array.from(clickStore.values());
  const converted = all.filter(c => c.status === 'converted');
  return {
    total: all.length,
    converted: converted.length,
    rate: all.length > 0 ? converted.length / all.length : 0,
  };
}
