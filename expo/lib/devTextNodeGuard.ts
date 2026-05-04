/**
 * Development-only guard for the "Unexpected text node" warning.
 *
 * React Native logs:
 *   "Unexpected text node: <X>. A text node cannot be a child of a <View>."
 * as a console.error, which makes it nearly impossible to trace because no
 * component stack is attached.
 *
 * In __DEV__ we monkey-patch console.error to:
 *   1. Print a clear, attention-grabbing banner.
 *   2. Throw a real Error so the nearest <ErrorBoundary> renders with the full
 *      component stack — which tells you exactly which file/component is
 *      leaking a raw text node into a <View>/<TouchableOpacity>/<Pressable>.
 *
 * This is a no-op in production builds.
 */

let installed = false;

export function installTextNodeGuard(): void {
  if (installed) return;
  if (!__DEV__) return;
  installed = true;

  const originalError = console.error.bind(console);

  console.error = (...args: unknown[]) => {
    try {
      const first = args[0];
      const message =
        typeof first === 'string'
          ? first
          : first instanceof Error
            ? first.message
            : '';

      // React Native uses the format string with %s placeholders; the actual
      // offending text is usually args[1].
      if (
        typeof message === 'string' &&
        message.includes('Unexpected text node')
      ) {
        const offending = typeof args[1] === 'string' ? args[1] : '';
        const formatted = message
          .replace('%s', JSON.stringify(offending))
          .replace('%s', '<View>');

        originalError(
          '\n[devTextNodeGuard] Stray text rendered as a child of a non-text container.',
        );
        originalError(`[devTextNodeGuard] Offending text node: ${JSON.stringify(offending)}`);
        originalError('[devTextNodeGuard] Common causes:');
        originalError('  • {someValue} where someValue is a string, but rendered inside <View>.');
        originalError('  • {cond && "string"} or {cond ? "a" : "b"} as a child of <View>.');
        originalError('  • A trailing "." or whitespace accidentally typed in JSX between tags.');
        originalError('  • A i18n/translation key that returns "." or an empty string.');
        originalError(formatted);

        // Throw so the nearest ErrorBoundary catches it WITH a component stack.
        throw new Error(
          `[devTextNodeGuard] ${formatted}\nWrap the value in <Text>...</Text>.`,
        );
      }
    } catch (e) {
      // Re-throw so ErrorBoundary can render the component stack.
      throw e;
    }

    originalError(...(args as Parameters<typeof console.error>));
  };
}
