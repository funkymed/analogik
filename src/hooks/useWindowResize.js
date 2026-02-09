import { useEffect } from 'react';

export function useWindowResize(callback) {
  useEffect(() => {
    const handler = () => callback();
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, [callback]);
}
