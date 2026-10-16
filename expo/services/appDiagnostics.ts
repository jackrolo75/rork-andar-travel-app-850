/**
 * In-app deployment diagnostics — the checks that can run inside the runtime
 * (no filesystem access). Filesystem/build checks live in scripts/deploy-diagnostics.js.
 */
import Constants from "expo-constants";
import { validateEnv, getApiBaseUrl } from "@/lib/env";
import { buildActivityUrl, isGenericAffiliateUrl, GYG_PARTNER_ID } from "@/constants/affiliateLinks";
import { buildFlightAffiliateUrl, TP_MARKER, TP_TRS } from "@/constants/flightLinks";
import type { DiagnosticCheck, CheckResult } from "@/lib/deploymentDiagnostics";

const EXPECTED_PACKAGE = "com.andartravel.app";
const EXPECTED_PARTNER_ID = "D82WHJ5";

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

export function createAppDiagnostics(): DiagnosticCheck[] {
  return [
    {
      id: "identity",
      label: "App identity",
      run: async (log): Promise<CheckResult> => {
        const config = Constants.expoConfig;
        const name = config?.name ?? "(missing)";
        const version = config?.version ?? "(missing)";
        const pkg = config?.android?.package ?? "(missing)";
        const versionCode = config?.android?.versionCode ?? "(missing)";
        log(`name=${name} version=${version}`);
        log(`android.package=${pkg} versionCode=${versionCode}`);

        if (pkg !== EXPECTED_PACKAGE) {
          return { status: "fail", detail: `package is ${pkg}, expected ${EXPECTED_PACKAGE}` };
        }
        if (typeof config?.android?.versionCode !== "number" || config.android.versionCode < 1) {
          return { status: "fail", detail: "android.versionCode missing or invalid" };
        }
        return { status: "pass", detail: `${name} v${version} (${pkg}) code ${versionCode}` };
      },
    },
    {
      id: "env",
      label: "Environment variables",
      run: async (log): Promise<CheckResult> => {
        const result = validateEnv();
        for (const item of result.missingRequired) log(`missing required: ${item}`);
        for (const item of result.missingOptional) log(`missing optional: ${item}`);
        if (!result.valid) {
          return { status: "fail", detail: `${result.missingRequired.length} required env var(s) missing` };
        }
        if (result.missingOptional.length > 0) {
          return { status: "warn", detail: `all required set; ${result.missingOptional.length} optional missing` };
        }
        return { status: "pass", detail: "all environment variables resolved" };
      },
    },
    {
      id: "affiliate",
      label: "Affiliate deep-links",
      run: async (log): Promise<CheckResult> => {
        if (GYG_PARTNER_ID !== EXPECTED_PARTNER_ID) {
          return { status: "fail", detail: `partner id is ${GYG_PARTNER_ID}, expected ${EXPECTED_PARTNER_ID}` };
        }
        const url = buildActivityUrl("Sunset Desert Safari", "Dubai");
        log(`sample: ${url}`);
        const parsed = new URL(url);
        const hasPartner = parsed.searchParams.get("partner_id") === EXPECTED_PARTNER_ID;
        const q = parsed.searchParams.get("q") ?? "";
        const titleScoped = q.includes("Sunset Desert Safari") && q.includes("Dubai");
        const generic = isGenericAffiliateUrl(url);
        log(`partner_id ok=${hasPartner} titleScoped=${titleScoped} generic=${generic}`);

        if (!hasPartner) return { status: "fail", detail: "partner_id missing/wrong on activity URL" };
        if (!titleScoped) return { status: "fail", detail: "activity URL lost its title-scoped q parameter" };
        if (generic) return { status: "warn", detail: "activity URL classified as generic landing page" };
        return { status: "pass", detail: "activity URLs are title-scoped and tagged with partner D82WHJ5" };
      },
    },
    {
      id: "flights",
      label: "Flight affiliate links",
      run: async (log): Promise<CheckResult> => {
        const url = buildFlightAffiliateUrl({
          origin: "Dubai",
          destination: "Istanbul",
          departDate: "2026-11-10",
          returnDate: "2026-11-17",
          passengers: 2,
        });
        if (!url) return { status: "fail", detail: "flight URL builder returned null for known cities" };
        log(`sample: ${url}`);
        const parsed = new URL(url);
        const okMarker = parsed.searchParams.get("marker") === TP_MARKER;
        const okTrs = parsed.searchParams.get("trs") === TP_TRS;
        const target = parsed.searchParams.get("u") ?? "";
        const okDeepLink = /aviasales\.com\/search\/DXB1011IST1711 2$/.test(target) || /aviasales\.com\/search\/DXB1011IST1711/.test(target);
        log(`marker ok=${okMarker} trs ok=${okTrs} deep-link ok=${okDeepLink}`);
        if (!okMarker || !okTrs) return { status: "fail", detail: "Travelpayouts marker/trs missing on flight URL" };
        if (!okDeepLink) return { status: "fail", detail: `unexpected Aviasales deep-link format: ${target}` };
        return { status: "pass", detail: "flight searches wrapped in tp.media tracking (marker 698160)" };
      },
    },
    {
      id: "backend",
      label: "Backend health",
      run: async (log): Promise<CheckResult> => {
        const base = getApiBaseUrl();
        if (!base) return { status: "fail", detail: "API base URL not configured" };
        const url = `${base.replace(/\/$/, "")}/health`;
        log(`GET ${url}`);
        try {
          const res = await fetchWithTimeout(url, 5000);
          log(`status ${res.status}`);
          if (res.ok) return { status: "pass", detail: "backend /health responded OK" };
          return { status: "warn", detail: `backend responded ${res.status}` };
        } catch {
          return { status: "warn", detail: "backend unreachable (network/timeout) — not blocking local build" };
        }
      },
    },
  ];
}
