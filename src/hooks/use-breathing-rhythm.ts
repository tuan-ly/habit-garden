import { useState, useEffect, useRef } from 'react';

// CSS custom property name used by consumers that prefer not to cause re-renders
const CSS_VAR = '--breathing-value';

// How often to push updates to React state (JS consumers) — ~4fps
const JS_UPDATE_INTERVAL_MS = 250;
// How often to update the CSS custom property — ~15fps
const CSS_UPDATE_INTERVAL_MS = 66;

/**
 * Returns a value between 0 and 1 that follows a rhythmic breathing pattern.
 * Default cycle: 4s inhale, 4s hold, 4s exhale, 4s hold.
 *
 * Performance: updates are throttled so React re-renders occur at ~4fps instead
 * of 60fps. The CSS custom property `--breathing-value` is kept in sync at ~15fps
 * for any CSS consumers that want to avoid re-renders entirely.
 *
 * @param enabled Whether the rhythm is active
 * @param periodSeconds Total duration of one breath cycle in seconds
 */
export function useBreathingRhythm(enabled: boolean = false, periodSeconds: number = 12) {
  const [value, setValue] = useState(0);

  // Refs so the rAF callback never becomes stale
  const lastCssUpdateRef = useRef(0);
  const lastJsUpdateRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      setValue(0);
      document.documentElement.style.setProperty(CSS_VAR, '0');
      return;
    }

    const startTime = Date.now();
    let animationFrameId: number;

    const animate = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;

      const cycleTime = elapsed % 12; // Fixed 12s cycle (3s per phase)

      // Box breathing: Inhale (3s) -> Hold (3s) -> Exhale (3s) -> Hold (3s)
      let newValue = 0;
      if (cycleTime < 3) {
        // Inhale: 0 -> 1 (sine ease)
        const progress = cycleTime / 3;
        newValue = -(Math.cos(Math.PI * progress) - 1) / 2;
      } else if (cycleTime < 6) {
        // Hold full: 1
        newValue = 1;
      } else if (cycleTime < 9) {
        // Exhale: 1 -> 0
        const progress = (cycleTime - 6) / 3;
        newValue = 1 - (-(Math.cos(Math.PI * progress) - 1) / 2);
      } else {
        // Hold empty: 0
        newValue = 0;
      }

      // Update CSS custom property at ~15fps — no React re-render
      if (now - lastCssUpdateRef.current >= CSS_UPDATE_INTERVAL_MS) {
        document.documentElement.style.setProperty(CSS_VAR, newValue.toString());
        lastCssUpdateRef.current = now;
      }

      // Update React state at ~4fps — triggers re-render only for JS consumers
      if (now - lastJsUpdateRef.current >= JS_UPDATE_INTERVAL_MS) {
        setValue(newValue);
        lastJsUpdateRef.current = now;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [enabled, periodSeconds]);

  return value;
}
