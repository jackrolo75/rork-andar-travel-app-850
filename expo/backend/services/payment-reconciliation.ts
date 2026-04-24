import { activitiesStore } from './activities-store';
import { bookingStore } from './booking-store';

interface ReconciliationEntry {
  id: string;
  clickId: string;
  paymentIntentId: string | null;
  activityId: string;
  partnerId: string | null;
  amount: number;
  currency: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  clickStatus: 'pending' | 'clicked' | 'converted' | 'expired';
  bookingStatus: 'pending' | 'confirmed' | 'cancelled' | 'failed' | 'not_found';
  reconciled: boolean;
  discrepancy: string | null;
  reconciledAt: string | null;
  createdAt: string;
}

interface ReconciliationReport {
  runId: string;
  runAt: string;
  totalClicks: number;
  totalReconciled: number;
  totalDiscrepancies: number;
  totalOrphaned: number;
  entries: ReconciliationEntry[];
  discrepancies: ReconciliationEntry[];
  summary: {
    clicksWithPayment: number;
    clicksWithoutPayment: number;
    confirmedBookings: number;
    failedBookings: number;
    conversionRate: number;
    totalRevenue: number;
    currency: string;
  };
}

const DB_ENDPOINT = process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT;
const DB_NAMESPACE = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;
const DB_TOKEN = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;

function useDb(): boolean {
  return !!(DB_ENDPOINT && DB_NAMESPACE && DB_TOKEN);
}

async function persistReport(report: ReconciliationReport): Promise<boolean> {
  if (!useDb()) {
    console.log('[Reconciliation] No DB configured, report logged to console only');
    return true;
  }

  try {
    const response = await fetch(
      `${DB_ENDPOINT}/${DB_NAMESPACE}/reconciliation_reports/${report.runId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DB_TOKEN}`,
        },
        body: JSON.stringify(report),
      },
    );

    if (!response.ok) {
      console.error('[Reconciliation] Failed to persist report:', response.statusText);
      return false;
    }

    console.log(`[Reconciliation] Report ${report.runId} persisted to DB`);
    return true;
  } catch (error) {
    console.error('[Reconciliation] Persist error:', error);
    return false;
  }
}

export async function runReconciliation(): Promise<ReconciliationReport> {
  const runId = `recon_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  console.log(`[Reconciliation] Starting run: ${runId}`);

  const allClicks = activitiesStore.getAllClicksInMemory();
  const entries: ReconciliationEntry[] = [];
  const discrepancies: ReconciliationEntry[] = [];

  let clicksWithPayment = 0;
  let clicksWithoutPayment = 0;
  let confirmedBookings = 0;
  let failedBookings = 0;
  let totalRevenue = 0;

  for (const click of allClicks) {
    const booking = await bookingStore.get(click.clickId);

    const entry: ReconciliationEntry = {
      id: `entry_${click.clickId}`,
      clickId: click.clickId,
      paymentIntentId: booking?.paymentIntentId ?? null,
      activityId: click.activityId,
      partnerId: click.partnerId,
      amount: booking?.amount ?? 0,
      currency: booking?.currency ?? 'USD',
      paymentStatus: booking?.paymentStatus ?? 'pending',
      clickStatus: click.status,
      bookingStatus: booking ? booking.status : 'not_found',
      reconciled: false,
      discrepancy: null,
      reconciledAt: null,
      createdAt: click.timestamp,
    };

    if (booking) {
      clicksWithPayment++;

      if (booking.paymentStatus === 'completed' && click.status !== 'converted') {
        entry.discrepancy = 'Payment completed but click not marked as converted';
        discrepancies.push(entry);

        await activitiesStore.updateClickStatus(click.clickId, 'converted');
        entry.clickStatus = 'converted';
        entry.reconciled = true;
        entry.reconciledAt = new Date().toISOString();
        console.log(`[Reconciliation] Auto-reconciled click ${click.clickId}: marked as converted`);
      } else if (booking.paymentStatus === 'failed' && click.status === 'converted') {
        entry.discrepancy = 'Click marked as converted but payment failed';
        discrepancies.push(entry);
      } else if (booking.status === 'confirmed' && booking.paymentStatus === 'completed') {
        entry.reconciled = true;
        entry.reconciledAt = new Date().toISOString();
        confirmedBookings++;
        totalRevenue += booking.amount ?? 0;
      } else if (booking.status === 'failed') {
        failedBookings++;
      }
    } else {
      clicksWithoutPayment++;

      const clickAge = Date.now() - new Date(click.timestamp).getTime();
      const ONE_HOUR = 60 * 60 * 1000;

      if (clickAge > ONE_HOUR && click.status === 'pending') {
        entry.discrepancy = 'Click older than 1 hour with no booking record';
        discrepancies.push(entry);

        await activitiesStore.updateClickStatus(click.clickId, 'expired');
        entry.clickStatus = 'expired';
        entry.reconciled = true;
        entry.reconciledAt = new Date().toISOString();
        console.log(`[Reconciliation] Expired stale click: ${click.clickId}`);
      }
    }

    entries.push(entry);
  }

  const totalReconciled = entries.filter(e => e.reconciled).length;
  const conversionRate = allClicks.length > 0
    ? confirmedBookings / allClicks.length
    : 0;

  const report: ReconciliationReport = {
    runId,
    runAt: new Date().toISOString(),
    totalClicks: allClicks.length,
    totalReconciled,
    totalDiscrepancies: discrepancies.length,
    totalOrphaned: clicksWithoutPayment,
    entries,
    discrepancies,
    summary: {
      clicksWithPayment,
      clicksWithoutPayment,
      confirmedBookings,
      failedBookings,
      conversionRate,
      totalRevenue,
      currency: 'USD',
    },
  };

  await persistReport(report);

  console.log('[Reconciliation] Run complete:', {
    runId,
    totalClicks: allClicks.length,
    reconciled: totalReconciled,
    discrepancies: discrepancies.length,
    orphaned: clicksWithoutPayment,
    revenue: totalRevenue,
    conversionRate: `${(conversionRate * 100).toFixed(1)}%`,
  });

  return report;
}

export function getReconciliationSummary(report: ReconciliationReport): string {
  const lines = [
    `Reconciliation Report: ${report.runId}`,
    `Run at: ${report.runAt}`,
    `---`,
    `Total clicks: ${report.totalClicks}`,
    `Reconciled: ${report.totalReconciled}`,
    `Discrepancies: ${report.totalDiscrepancies}`,
    `Orphaned clicks: ${report.totalOrphaned}`,
    `---`,
    `Clicks with payment: ${report.summary.clicksWithPayment}`,
    `Clicks without payment: ${report.summary.clicksWithoutPayment}`,
    `Confirmed bookings: ${report.summary.confirmedBookings}`,
    `Failed bookings: ${report.summary.failedBookings}`,
    `Conversion rate: ${(report.summary.conversionRate * 100).toFixed(1)}%`,
    `Total revenue: ${report.summary.currency} ${report.summary.totalRevenue.toFixed(2)}`,
  ];

  if (report.discrepancies.length > 0) {
    lines.push('---');
    lines.push('Discrepancies:');
    for (const d of report.discrepancies) {
      lines.push(`  - ${d.clickId}: ${d.discrepancy}`);
    }
  }

  return lines.join('\n');
}

export type { ReconciliationReport, ReconciliationEntry };
