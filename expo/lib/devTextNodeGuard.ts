/**
 * Development-only guard for the "Unexpected text node" warning.
 *
 * React Native logs:
 *   "Unexpected text node: <X>. A text node cannot be a child of a <View>."
 * as a console.error, which makes it nearly impossible to trace because no
 * component stack is attached.
 *
 * In __DEV__ we wrap console.error to:
 *   1. Print a clear, attention-grabbing banner with the offending text.
 *   2. Print a JS stack trace so you can locate the file/line.
 *
 * IMPORTANT: This guard does NOT throw. Throwing here causes the nearest
 * <ErrorBoundary> to swallow the entire screen on every render, which is far
 * worse than the original warning. We just log loudly and let the app continue.
 *
 * This is a no-op in production builds.
 */

let installed = false;

export function installTextNodeGuard(): void {
  if (installed) return;
  if (!__DEV__) return;
  installed = true;

  const originalError = console.error.bind(console);
  const originalWarn = console.warn.bind(console);

  console.error = (...args: unknown[]) => {
    try {
      const first = args[0];
      const message =
        typeof first === 'string'
          ? first
          : first instanceof Error
            ? first.message
            : '';

      if (
        typeof message === 'string' &&
        message.includes('Unexpected text node')
      ) {
        const offending = typeof args[1] === 'string' ? args[1] : '';
        const formatted = message
          .replace('%s', JSON.stringify(offending))
          .replace('%s', '<View>');

        originalWarn(
          '\n[devTextNodeGuard] Stray text rendered as a child of a non-text container.',
        );
        originalWarn(
          `[devTextNodeGuard] Offending text node: ${JSON.stringify(offending)}`,
        );
        originalWarn('[devTextNodeGuard] Common causes:');
        originalWarn(
          '  • {someValue} where someValue is a string, but rendered inside <View>.',
        );
        originalWarn(
          '  • {cond && "string"} or {cond ? "a" : "b"} as a child of <View>.',
        );
        originalWarn(
          '  • A trailing "." or whitespace accidentally typed in JSX between tags.',
        );
        originalWarn(
          '  • A i18n/translation key that returns "." or an empty string.',
        );
        originalWarn(formatted);

        // Capture a stack trace so the developer can pinpoint the source.
        const stack = new Error('[devTextNodeGuard] trace').stack;
        if (stack) {
          originalWarn(stack);
        }

        // DO NOT throw — throwing escalates this warning into a fatal
        // ErrorBoundary render loop. Just log and continue.
        return;
      }
    } catch {
      // Swallow any guard internal error; never let logging break the app.
    }

    originalError(...(args as Parameters<typeof console.error>));
  };
}
