#!/usr/bin/env node
/**
 * Patches expo-router to ignore ./+layout.tsx (invalid in Expo Router; use _layout.tsx).
 * Runs on postinstall so the fix applies on any package manager and on Rork.
 */

const fs = require('fs');
const path = require('path');

function main() {
  const pkgDir = path.join(__dirname, '..', 'node_modules', 'expo-router');
  if (!fs.existsSync(pkgDir)) {
    return;
  }

  let patched = 0;

  // 1) getRoutesCore.js, _ctx.js, _ctx.web.js, _ctx-shared.js: add |layout to (html|native-intent)
  const addLayoutToGroup = (content) => {
    if (content.includes('native-intent|layout')) return content;
    // Match (html|native-intent) and replace with (html|native-intent|layout)
    let next = content.replace(/\((html\|native-intent)\)(?!\|layout)/g, '($1|layout)');
    // Fallback: match native-intent) not followed by |layout (for minified/different format)
    if (next === content && content.includes('native-intent') && !content.includes('native-intent|layout')) {
      next = content.replace(/(\(html\|native-intent)\)/g, '$1|layout)');
    }
    return next;
  };

  // 2) _ctx.ios.js, _ctx.android.js: add |(?:\\+layout) before |(?:\\+middleware)
  const addLayoutToCtxPlatform = (content) => {
    if (content.includes('+layout)|(?:\\+middleware')) return content;
    // Match (?:\\+html)|(?:\\+middleware) - backslash is one char in file
    return content.replace(/(\(\?:\\\+html\))\|(\(\?:\\\+middleware\))/g, '$1|(?:\\+layout)|$2');
  };

  // getRoutesCore.js: ensure +layout is in ignore list (critical for route build)
  const getRoutesCorePath = path.join(pkgDir, 'build', 'getRoutesCore.js');
  if (fs.existsSync(getRoutesCorePath)) {
    let core = fs.readFileSync(getRoutesCorePath, 'utf8');
    if (!core.includes('native-intent|layout') && core.includes('html|native-intent)')) {
      core = core.replace(/html\|native-intent\)/g, 'html|native-intent|layout)');
      fs.writeFileSync(getRoutesCorePath, core);
      patched++;
    }
  }

  const files = [
    path.join(pkgDir, 'build', 'getRoutesCore.js'),
    path.join(pkgDir, '_ctx.js'),
    path.join(pkgDir, '_ctx.web.js'),
    path.join(pkgDir, '_ctx-shared.js'),
  ];

  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    const next = addLayoutToGroup(content);
    if (next !== content) {
      fs.writeFileSync(file, next);
      patched++;
    }
  }

  const platformFiles = [
    path.join(pkgDir, '_ctx.ios.js'),
    path.join(pkgDir, '_ctx.android.js'),
  ];

  for (const file of platformFiles) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    const next = addLayoutToCtxPlatform(content);
    if (next !== content) {
      fs.writeFileSync(file, next);
      patched++;
    }
  }

  if (patched > 0) {
    console.log('patch-expo-router: applied +layout ignore to expo-router');
  }
}

try {
  main();
} catch (err) {
  console.error('patch-expo-router:', err.message);
  process.exit(0); // don't fail install
}
