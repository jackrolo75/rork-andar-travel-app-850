#!/usr/bin/env bun
/**
 * Deployment diagnostics — terminal edition.
 *
 * Usage:  bun scripts/deploy-diagnostics.js   (from the expo/ folder)
 *
 * Runs filesystem/build-side checks that the in-app diagnostics screen cannot
 * reach (app.json, eas.json, .env, patch wiring) and streams a live console
 * feed with clear PASS / WARN / FAIL status per stage.
 */

const fs = require('fs');
const path = require('path');
const { runDiagnostics, formatReport } = require('../lib/deploymentDiagnostics.ts');

const ROOT = path.join(__dirname, '..');

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  amber: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function readJson(file) {
  const raw = fs.readFileSync(path.join(ROOT, file), 'utf8');
  return JSON.parse(raw.replace(/^\uFEFF/, ''));
}

function envKeys(file) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) return null;
  const keys = new Set();
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=/);
    if (m) keys.add(m[1]);
  }
  return keys;
}

const REQUIRED_ENV_KEYS = [
  'PAYMENT_CALLBACK_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'EXPO_PUBLIC_STRIPE_PAYMENT_LINK',
  'EXPO_PUBLIC_ADMIN_EMAIL',
];

const checks = [
  {
    id: 'app-config',
    label: 'app.json identity',
    run: async (log) => {
      const cfg = readJson('app.json');
      const expo = cfg.expo || cfg;
      const name = expo.name;
      const pkg = expo.android && expo.android.package;
      const versionCode = expo.android && expo.android.versionCode;
      log(`name=${name} package=${pkg} versionCode=${versionCode}`);

      if (name !== 'AndarTravel') return { status: 'warn', detail: `name is "${name}"` };
      if (pkg !== 'com.andartravel.app') {
        return { status: 'fail', detail: `package is ${pkg}, expected com.andartravel.app` };
      }
      if (!Number.isInteger(versionCode) || versionCode < 1) {
        return { status: 'fail', detail: `android.versionCode invalid (${versionCode})` };
      }
      for (const asset of ['assets/images/icon.png', 'assets/images/adaptive-icon.png']) {
        if (!fs.existsSync(path.join(ROOT, asset))) {
          return { status: 'fail', detail: `missing asset ${asset}` };
        }
      }
      log('icon + adaptive-icon present');
      return { status: 'pass', detail: `${name} v${expo.version} · ${pkg} · code ${versionCode}` };
    },
  },
  {
    id: 'eas-profile',
    label: 'EAS production profile',
    run: async (log) => {
      const cfg = readJson('eas.json');
      const prod = cfg.build && cfg.build.production;
      if (!prod) return { status: 'fail', detail: 'eas.json has no build.production profile' };
      const android = prod.android || {};
      log(`buildType=${android.buildType} distribution=${prod.distribution}`);
      if (android.buildType !== 'app-bundle') {
        return { status: 'fail', detail: `production buildType is "${android.buildType}", expected "app-bundle" (AAB)` };
      }
      if (prod.distribution !== 'store') {
        return { status: 'warn', detail: `distribution is "${prod.distribution}"` };
      }
      return { status: 'pass', detail: 'production profile builds AAB for store distribution' };
    },
  },
  {
    id: 'env',
    label: 'Environment (.env)',
    run: async (log) => {
      const keys = envKeys('.env');
      if (!keys) return { status: 'fail', detail: '.env file not found in expo/' };
      const missing = REQUIRED_ENV_KEYS.filter((k) => !keys.has(k));
      log(`present: ${REQUIRED_ENV_KEYS.length - missing.length}/${REQUIRED_ENV_KEYS.length} required keys`);
      if (missing.length > 0) log(`missing: ${missing.join(', ')}`);
      if (missing.length > 0) {
        return { status: 'fail', detail: `missing required keys: ${missing.join(', ')}` };
      }
      return { status: 'pass', detail: 'all required keys present (values never printed)' };
    },
  },
  {
    id: 'affiliate',
    label: 'Affiliate source of truth',
    run: async (log) => {
      const file = path.join(ROOT, 'constants', 'affiliateLinks.ts');
      if (!fs.existsSync(file)) return { status: 'fail', detail: 'constants/affiliateLinks.ts missing' };
      const src = fs.readFileSync(file, 'utf8');
      if (!src.includes("D82WHJ5") && !src.includes('GYG_PARTNER_ID')) {
        return { status: 'fail', detail: 'affiliateLinks.ts does not reference the GYG partner id' };
      }
      for (const legacy of ['travelpayoutsLinks.ts', 'partnerRouting.ts']) {
        const p = path.join(ROOT, 'constants', legacy);
        if (fs.existsSync(p)) {
          return { status: 'warn', detail: `legacy shim still present: constants/${legacy}` };
        }
      }
      log('no legacy shims detected');
      return { status: 'pass', detail: 'canonical builder active, partner D82WHJ5, legacy shims removed' };
    },
  },
  {
    id: 'patches',
    label: 'expo-router patch wiring',
    run: async (log) => {
      const patch = path.join(ROOT, 'patches', 'expo-router+6.0.23.patch');
      const script = path.join(ROOT, 'scripts', 'patch-expo-router.js');
      if (!fs.existsSync(script)) return { status: 'fail', detail: 'scripts/patch-expo-router.js missing' };
      if (!fs.existsSync(patch)) log('note: patches/expo-router+6.0.23.patch missing (script-only patching)');

      const pkg = readJson('package.json');
      const postinstall = pkg.scripts && pkg.scripts.postinstall;
      log(`postinstall=${postinstall || '(not set)'}`);
      if (!postinstall || !/patch-expo-router/.test(postinstall)) {
        return { status: 'warn', detail: 'package.json postinstall does not run patch-expo-router.js' };
      }
      return { status: 'pass', detail: 'postinstall wired to patch-expo-router.js' };
    },
  },
  {
    id: 'deps',
    label: 'Dependencies installed',
    run: async (log) => {
      const nm = path.join(ROOT, 'node_modules');
      if (!fs.existsSync(nm)) return { status: 'fail', detail: 'node_modules missing — run: bun install' };
      const router = path.join(nm, 'expo-router');
      if (!fs.existsSync(router)) return { status: 'fail', detail: 'expo-router not installed' };
      const count = fs.readdirSync(nm).filter((d) => !d.startsWith('.')).length;
      log(`top-level packages: ${count}`);
      return { status: 'pass', detail: `node_modules present (${count} top-level packages)` };
    },
  },
];

async function main() {
  const stamp = () =>
    new Date().toLocaleTimeString('en-GB', { hour12: false });

  console.log(`\n${COLORS.bold}${COLORS.cyan}  ▲ AndarTravel — Deployment Diagnostics${COLORS.reset}`);
  console.log(`${COLORS.dim}  ${new Date().toISOString()}${COLORS.reset}\n`);

  const report = await runDiagnostics(checks, {
    onCheckStart: (check, i, total) => {
      console.log(
        `${COLORS.dim}[${stamp()}]${COLORS.reset} ${COLORS.cyan}▸${COLORS.reset} (${i + 1}/${total}) ${COLORS.bold}${check.label}${COLORS.reset}`
      );
    },
    onLog: (line) => {
      console.log(`  ${COLORS.dim}${line}${COLORS.reset}`);
    },
  });

  const statusColor =
    report.overall === 'fail' ? COLORS.red : report.overall === 'warn' ? COLORS.amber : COLORS.green;

  for (const o of report.outcomes) {
    const mark = o.status === 'pass' ? '✓' : o.status === 'warn' ? '!' : '✗';
    const color = o.status === 'pass' ? COLORS.green : o.status === 'warn' ? COLORS.amber : COLORS.red;
    console.log(`  ${color}${mark}${COLORS.reset} ${o.label.padEnd(28)} ${COLORS.dim}${o.detail}${COLORS.reset}`);
  }

  console.log(
    `\n  ${COLORS.bold}Result: ${statusColor}${report.overall.toUpperCase()}${COLORS.reset}` +
      `${COLORS.dim} — ${report.passed} passed · ${report.warned} warnings · ${report.failed} failures · ${(report.totalMs / 1000).toFixed(1)}s${COLORS.reset}\n`
  );

  if (report.overall === 'fail') {
    console.log(`  ${COLORS.amber}Fix the failures above, then re-run before building/uploading.${COLORS.reset}\n`);
    process.exit(1);
  }
  if (report.overall === 'warn') process.exit(2);
  process.exit(0);
}

main().catch((err) => {
  console.error(`${COLORS.red}diagnostics crashed:${COLORS.reset}`, err);
  process.exit(1);
});

// Keep formatReport referenced for potential --json/--report extension.
void formatReport;
