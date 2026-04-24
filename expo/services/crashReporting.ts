import { Platform } from 'react-native';

type Severity = 'info' | 'warning' | 'error' | 'fatal';

interface CrashReport {
  id: string;
  message: string;
  stack?: string;
  severity: Severity;
  context: Record<string, string | number | boolean | null>;
  platform: string;
  timestamp: string;
  sessionId: string;
  appVersion: string;
  componentStack?: string;
}

let currentSessionId = `crash_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
const reportBuffer: CrashReport[] = [];
const MAX_BUFFER = 20;
const APP_VERSION = '1.0.0';

export function initCrashReporting(): void {
  currentSessionId = `crash_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  console.log('[CrashReporting] Initialized, session:', currentSessionId);

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('error', (event: ErrorEvent) => {
      captureException(new Error(event.message), {
        source: 'window.onerror',
        filename: event.filename ?? 'unknown',
        lineno: String(event.lineno ?? 0),
        colno: String(event.colno ?? 0),
      });
    });

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));
      captureException(reason, { source: 'unhandledrejection' });
    });
  }

  if (typeof ErrorUtils !== 'undefined' && Platform.OS !== 'web') {
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      captureException(error, {
        source: 'globalHandler',
        isFatal: String(isFatal ?? false),
      }, isFatal ? 'fatal' : 'error');

      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });
  }
}

export function captureException(
  error: Error,
  context: Record<string, string | number | boolean | null> = {},
  severity: Severity = 'error',
): void {
  const report: CrashReport = {
    id: `rpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    message: error.message || 'Unknown error',
    stack: error.stack,
    severity,
    context: {
      ...context,
      errorName: error.name || 'Error',
    },
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
    sessionId: currentSessionId,
    appVersion: APP_VERSION,
  };

  reportBuffer.push(report);
  console.error(`[CrashReporting] [${severity.toUpperCase()}] ${error.message}`, context);

  if (reportBuffer.length >= MAX_BUFFER) {
    void flushReports();
  }
}

export function captureMessage(
  message: string,
  severity: Severity = 'info',
  context: Record<string, string | number | boolean | null> = {},
): void {
  const report: CrashReport = {
    id: `rpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    message,
    severity,
    context,
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
    sessionId: currentSessionId,
    appVersion: APP_VERSION,
  };

  reportBuffer.push(report);
  console.log(`[CrashReporting] [${severity.toUpperCase()}] ${message}`, context);

  if (reportBuffer.length >= MAX_BUFFER) {
    void flushReports();
  }
}

export function captureComponentError(
  error: Error,
  componentStack: string,
  componentName?: string,
): void {
  const report: CrashReport = {
    id: `rpt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    message: error.message || 'Component render error',
    stack: error.stack,
    severity: 'error',
    context: {
      source: 'ErrorBoundary',
      componentName: componentName ?? 'unknown',
    },
    platform: Platform.OS,
    timestamp: new Date().toISOString(),
    sessionId: currentSessionId,
    appVersion: APP_VERSION,
    componentStack,
  };

  reportBuffer.push(report);
  console.error(`[CrashReporting] Component error in ${componentName ?? 'unknown'}:`, error.message);

  void flushReports();
}

export function setUserContext(userId: string, email?: string): void {
  console.log('[CrashReporting] User context set:', userId);
  captureMessage('User context set', 'info', {
    userId,
    email: email ?? null,
  });
}

async function flushReports(): Promise<void> {
  if (reportBuffer.length === 0) return;

  const reportsToFlush = [...reportBuffer];
  reportBuffer.length = 0;

  console.log(`[CrashReporting] Flushing ${reportsToFlush.length} reports`);

  try {
    const DB_ENDPOINT = process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT;
    const DB_NAMESPACE = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE;
    const DB_TOKEN = process.env.EXPO_PUBLIC_RORK_DB_TOKEN;

    if (!DB_ENDPOINT || !DB_NAMESPACE || !DB_TOKEN) {
      console.log('[CrashReporting] No DB configured, reports logged to console only');
      return;
    }

    const batchId = `crash_batch_${Date.now()}`;
    const response = await fetch(`${DB_ENDPOINT}/${DB_NAMESPACE}/crash_reports/${batchId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DB_TOKEN}`,
      },
      body: JSON.stringify({
        reports: reportsToFlush,
        count: reportsToFlush.length,
        flushedAt: new Date().toISOString(),
        sessionId: currentSessionId,
      }),
    });

    if (!response.ok) {
      console.error('[CrashReporting] Failed to persist reports:', response.statusText);
      reportBuffer.push(...reportsToFlush);
    } else {
      console.log(`[CrashReporting] ${reportsToFlush.length} reports persisted`);
    }
  } catch (flushError) {
    console.error('[CrashReporting] Flush error:', flushError);
    reportBuffer.push(...reportsToFlush);
  }
}

export function getBufferedReportCount(): number {
  return reportBuffer.length;
}

export { flushReports };
