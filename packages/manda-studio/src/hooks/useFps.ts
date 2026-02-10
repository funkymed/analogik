import { useEffect, useRef, useState } from "react";

/**
 * Track frames per second using requestAnimationFrame.
 *
 * Updates the returned value every 500ms for a smooth, readable
 * display without excessive re-renders.
 */
export function useFps(): number {
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastUpdateRef = useRef(0);
  const rafIdRef = useRef(0);

  useEffect(() => {
    lastUpdateRef.current = performance.now();

    function tick() {
      frameCountRef.current += 1;

      const now = performance.now();
      const elapsed = now - lastUpdateRef.current;

      if (elapsed >= 500) {
        const currentFps = Math.round(
          (frameCountRef.current / elapsed) * 1000,
        );
        setFps(currentFps);
        frameCountRef.current = 0;
        lastUpdateRef.current = now;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    }

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return fps;
}
