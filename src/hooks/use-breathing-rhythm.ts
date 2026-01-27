import { useState, useEffect } from 'react';

/**
 * Returns a value between 0 and 1 that follows a rhythmic breathing pattern.
 * Default cycle: 4s inhale, 4s hold, 4s exhale, 4s hold.
 * 
 * @param enabled Whether the rhythm is active
 * @param periodSeconds Total duration of one breath cycle in seconds
 */
export function useBreathingRhythm(enabled: boolean = false, periodSeconds: number = 12) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue(0);
      return;
    }

    let startTime = Date.now();
    let animationFrameId: number;

    const animate = () => {
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      
      const cycleTime = elapsed % 12; // Fixed 12s cycle for now (3s per phase)
      
      // Box breathing: Inhale (3s) -> Hold (3s) -> Exhale (3s) -> Hold (3s)
      let newValue = 0;
      if (cycleTime < 3) {
        // Inhale: 0 -> 1 (using sine ease for smoothness)
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
      
      setValue(newValue);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [enabled, periodSeconds]);

  return value;
}
