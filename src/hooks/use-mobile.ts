'use client';

import { useSyncExternalStore } from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect mobile viewport
 * Uses useSyncExternalStore for SSR-safe and lint-compliant media query detection.
 * @returns boolean - true if viewport width < 768px
 */
export function useIsMobile() {
  const isMobile = useSyncExternalStore(
    // Subscribe to media query changes
    (callback) => {
      const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    },
    // Get current value on client
    () => window.innerWidth < MOBILE_BREAKPOINT,
    // Get value during SSR (assume desktop)
    () => false
  );

  return isMobile;
}
