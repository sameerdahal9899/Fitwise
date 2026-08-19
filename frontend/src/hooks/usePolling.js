import { useEffect, useRef } from "react";

/**
 * Calls `callback` immediately, then every `intervalMs` while `enabled` is
 * true. Pauses while the tab is hidden so we're not hammering the API from
 * a backgrounded browser tab. This is the "polling/API-based approach" the
 * project spec explicitly prefers over WebSockets for V1 messaging.
 */
export function usePolling(callback, intervalMs = 4000, enabled = true) {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;
    const tick = () => {
      if (!cancelled && document.visibilityState === "visible") {
        savedCallback.current();
      }
    };

    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs, enabled]);
}
