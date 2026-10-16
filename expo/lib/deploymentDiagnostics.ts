/**
 * Shared deployment-diagnostics engine.
 *
 * Platform-agnostic (no react-native imports) so it runs both inside the app
 * (diagnostics screen) and in the terminal (scripts/deploy-diagnostics.js via bun).
 */

export type CheckStatus = "pass" | "warn" | "fail";

export interface CheckResult {
  status: CheckStatus;
  detail: string;
}

export interface DiagnosticCheck {
  id: string;
  label: string;
  /** Executes the check; use the provided log fn to stream console lines. */
  run: (log: (line: string) => void) => Promise<CheckResult>;
}

export interface CheckOutcome {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  durationMs: number;
}

export interface DiagnosticReport {
  outcomes: CheckOutcome[];
  overall: CheckStatus;
  totalMs: number;
  passed: number;
  warned: number;
  failed: number;
}

export interface DiagnosticEvents {
  onCheckStart?: (check: DiagnosticCheck, index: number, total: number) => void;
  onLog?: (line: string) => void;
  onCheckDone?: (outcome: CheckOutcome) => void;
  onDone?: (report: DiagnosticReport) => void;
}

const OVERALL_ORDER: Record<CheckStatus, number> = { pass: 0, warn: 1, fail: 2 };

function worstStatus(statuses: CheckStatus[]): CheckStatus {
  return statuses.reduce<CheckStatus>(
    (worst, s) => (OVERALL_ORDER[s] > OVERALL_ORDER[worst] ? s : worst),
    "pass"
  );
}

/**
 * Runs checks sequentially, streaming lifecycle events so callers can render
 * live progress. A check that throws becomes a `fail` outcome, never a crash.
 */
export async function runDiagnostics(
  checks: DiagnosticCheck[],
  events: DiagnosticEvents = {}
): Promise<DiagnosticReport> {
  const startedAt = Date.now();
  const outcomes: CheckOutcome[] = [];

  for (let i = 0; i < checks.length; i++) {
    const check = checks[i];
    events.onCheckStart?.(check, i, checks.length);
    const checkStart = Date.now();

    let outcome: CheckOutcome;
    try {
      const result = await check.run((line) =>
        events.onLog?.(`[${check.id}] ${line}`)
      );
      outcome = { id: check.id, label: check.label, durationMs: Date.now() - checkStart, ...result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      outcome = {
        id: check.id,
        label: check.label,
        status: "fail",
        detail: message,
        durationMs: Date.now() - checkStart,
      };
    }

    outcomes.push(outcome);
    events.onCheckDone?.(outcome);
    events.onLog?.(
      `${outcome.status.toUpperCase()} ${check.label} (${outcome.durationMs}ms) — ${outcome.detail}`
    );
  }

  const report: DiagnosticReport = {
    outcomes,
    overall: worstStatus(outcomes.map((o) => o.status)),
    totalMs: Date.now() - startedAt,
    passed: outcomes.filter((o) => o.status === "pass").length,
    warned: outcomes.filter((o) => o.status === "warn").length,
    failed: outcomes.filter((o) => o.status === "fail").length,
  };

  events.onDone?.(report);
  return report;
}

/** Human-readable one-page summary, used by both the screen and the CLI. */
export function formatReport(report: DiagnosticReport, title = "AndarTravel Diagnostics"): string {
  const lines: string[] = [`== ${title} ==`];
  for (const o of report.outcomes) {
    const mark = o.status === "pass" ? "✓" : o.status === "warn" ? "!" : "✗";
    lines.push(`${mark} ${o.label}: ${o.detail}`);
  }
  lines.push(
    `Overall: ${report.overall.toUpperCase()} — ${report.passed} passed, ${report.warned} warnings, ${report.failed} failures in ${(report.totalMs / 1000).toFixed(1)}s`
  );
  return lines.join("\n");
}
