import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  CircleX,
  RefreshCw,
  Share2,
  Terminal,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useRouter } from "expo-router";
import {
  CheckOutcome,
  DiagnosticCheck,
  DiagnosticReport,
  formatReport,
  runDiagnostics,
} from "@/lib/deploymentDiagnostics";
import { createAppDiagnostics } from "@/services/appDiagnostics";

interface ConsoleLine {
  id: number;
  text: string;
}

export default function DiagnosticsScreen() {
  const router = useRouter();
  const [outcomes, setOutcomes] = useState<CheckOutcome[]>([]);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const lineIdRef = useRef(0);
  const consoleRef = useRef<ScrollView>(null);
  const startedRef = useRef(false);

  const checks = useMemo<DiagnosticCheck[]>(() => createAppDiagnostics(), []);

  const appendLine = useCallback((text: string) => {
    lineIdRef.current += 1;
    const line: ConsoleLine = { id: lineIdRef.current, text };
    setLines((prev) => [...prev.slice(-199), line]);
  }, []);

  const runAll = useCallback(async () => {
    setOutcomes([]);
    setReport(null);
    setLines([]);
    lineIdRef.current = 0;
    appendLine(`▸ AndarTravel diagnostics — ${new Date().toLocaleTimeString()}`);

    const result = await runDiagnostics(checks, {
      onCheckStart: (check) => {
        setRunningId(check.id);
        appendLine(`RUN ${check.label}…`);
      },
      onLog: appendLine,
      onCheckDone: (outcome) => {
        setOutcomes((prev) => [...prev, outcome]);
        setRunningId((current) => (current === outcome.id ? null : current));
      },
      onDone: (r) => {
        setReport(r);
        setRunningId(null);
        appendLine(
          `▸ DONE — ${r.passed} passed, ${r.warned} warnings, ${r.failed} failures (${(r.totalMs / 1000).toFixed(1)}s)`
        );
      },
    });
    return result;
  }, [checks, appendLine]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void runAll();
  }, [runAll]);

  useEffect(() => {
    // Auto-scroll the console as new lines stream in.
    const timer = setTimeout(() => consoleRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(timer);
  }, [lines]);

  const handleShare = useCallback(() => {
    if (!report) return;
    void Share.share({ message: formatReport(report) });
  }, [report]);

  const completed = outcomes.length;
  const progress = checks.length > 0 ? completed / checks.length : 0;
  const overallLabel = report
    ? report.overall === "pass"
      ? "ALL CLEAR"
      : report.overall === "warn"
        ? "PASSED WITH WARNINGS"
        : "BLOCKED"
    : "RUNNING…";

  const statusColor = report
    ? report.overall === "fail"
      ? Colors.error
      : report.overall === "warn"
        ? Colors.warning
        : Colors.success
    : Colors.primaryLight;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ChevronLeft size={24} color="#E2E8F0" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Deployment Diagnostics</Text>
          <Text style={[styles.headerStatus, { color: statusColor }]}>{overallLabel}</Text>
        </View>
        <Pressable
          onPress={() => void runAll()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Re-run diagnostics"
        >
          <RefreshCw size={22} color={Colors.primaryLight} />
        </Pressable>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {checks.map((check, index) => {
          const outcome = outcomes.find((o) => o.id === check.id);
          const isRunning = runningId === check.id;
          return (
            <View key={check.id} style={styles.stageRow}>
              <View style={styles.stageIcon}>
                {outcome ? (
                  outcome.status === "pass" ? (
                    <CheckCircle2 size={20} color={Colors.success} />
                  ) : outcome.status === "warn" ? (
                    <AlertTriangle size={20} color={Colors.warning} />
                  ) : (
                    <CircleX size={20} color={Colors.error} />
                  )
                ) : isRunning ? (
                  <ActivityIndicator size="small" color={Colors.primaryLight} />
                ) : (
                  <View style={styles.pendingDot} />
                )}
              </View>
              <View style={styles.stageText}>
                <Text style={styles.stageLabel}>
                  {String(index + 1).padStart(2, "0")} · {check.label}
                </Text>
                {outcome ? (
                  <Text
                    style={[
                      styles.stageDetail,
                      outcome.status === "fail"
                        ? { color: Colors.error }
                        : outcome.status === "warn"
                          ? { color: Colors.warning }
                          : { color: "#64748B" },
                    ]}
                    numberOfLines={3}
                  >
                    {outcome.detail}
                  </Text>
                ) : (
                  <Text style={styles.stageDetail}>{isRunning ? "Running…" : "Queued"}</Text>
                )}
              </View>
              {outcome ? (
                <Text style={styles.stageTime}>{outcome.durationMs}ms</Text>
              ) : null}
            </View>
          );
        })}

        <View style={styles.consolePanel}>
          <View style={styles.consoleHeader}>
            <Terminal size={14} color="#4ADE80" />
            <Text style={styles.consoleHeaderText}>CONSOLE OUTPUT</Text>
          </View>
          <ScrollView
            ref={consoleRef}
            style={styles.consoleScroll}
            contentContainerStyle={styles.consoleContent}
          >
            {lines.map((line) => (
              <Text key={line.id} style={styles.consoleLine}>
                {line.text}
              </Text>
            ))}
            {lines.length === 0 ? (
              <Text style={styles.consoleLine}>waiting for output…</Text>
            ) : null}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.footerButton, pressed && { opacity: 0.7 }]}
          onPress={() => void runAll()}
          accessibilityRole="button"
          accessibilityLabel="Run diagnostics again"
        >
          <RefreshCw size={18} color="#E2E8F0" />
          <Text style={styles.footerButtonText}>Re-run</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.footerButton,
            styles.footerButtonPrimary,
            pressed && { opacity: 0.7 },
            !report && { opacity: 0.4 },
          ]}
          onPress={handleShare}
          disabled={!report}
          accessibilityRole="button"
          accessibilityLabel="Share diagnostics report"
        >
          <Share2 size={18} color="#0B1220" />
          <Text style={[styles.footerButtonText, { color: "#0B1220" }]}>Share report</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0B1220",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#E2E8F0",
  },
  headerStatus: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  progressTrack: {
    height: 4,
    backgroundColor: "rgba(148,163,184,0.2)",
    marginHorizontal: 16,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primaryLight,
    borderRadius: 2,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
    gap: 8,
  },
  stageRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30,41,59,0.6)",
    borderRadius: 12,
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.12)",
  },
  stageIcon: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(148,163,184,0.35)",
  },
  stageText: {
    flex: 1,
  },
  stageLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#E2E8F0",
  },
  stageDetail: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  stageTime: {
    fontSize: 11,
    color: "#475569",
    fontVariant: ["tabular-nums"],
  },
  consolePanel: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "#060B14",
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.2)",
    overflow: "hidden",
  },
  consoleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.1)",
  },
  consoleHeaderText: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1.5,
    color: "#4ADE80",
  },
  consoleScroll: {
    height: 200,
  },
  consoleContent: {
    padding: 12,
  },
  consoleLine: {
    fontFamily: "Menlo",
    fontSize: 10.5,
    lineHeight: 16,
    color: "#86EFAC",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  footerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "rgba(148,163,184,0.15)",
    minHeight: 48,
  },
  footerButtonPrimary: {
    backgroundColor: Colors.primaryLight,
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#E2E8F0",
  },
});
