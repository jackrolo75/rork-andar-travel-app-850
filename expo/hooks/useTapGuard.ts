import { useCallback, useRef } from 'react';

/**
 * Debounces a tap handler so accidental double-taps fire the action only once.
 * Default cool-down is 600ms — enough to prevent re-entry while still feeling
 * instant for legitimate retaps.
 */
export function useTapGuard<T extends (...args: any[]) => any>(
  fn: T,
  cooldownMs: number = 600,
): (...args: Parameters<T>) => void {
  const lastRef = useRef<number>(0);
  const inFlightRef = useRef<boolean>(false);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (inFlightRef.current) return;
      if (now - lastRef.current < cooldownMs) return;
      lastRef.current = now;
      inFlightRef.current = true;

      try {
        const result = fn(...args);
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          (result as Promise<unknown>).finally(() => {
            inFlightRef.current = false;
          });
        } else {
          // Release after cooldown for sync handlers.
          setTimeout(() => { inFlightRef.current = false; }, cooldownMs);
        }
      } catch (err) {
        inFlightRef.current = false;
        throw err;
      }
    },
    [fn, cooldownMs],
  );
}
