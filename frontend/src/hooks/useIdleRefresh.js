import { useEffect, useRef } from 'react';

const REFRESH_INTERVAL_MS = 60_000;
const IDLE_THRESHOLD_MS = 60_000;

export default function useIdleRefresh(refresh) {
  const refreshRef = useRef(refresh);
  const lastActivityRef = useRef(Date.now());
  const inFlightRef = useRef(false);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(() => {
    const markActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const refreshIfIdle = async () => {
      if (
        document.visibilityState !== 'visible' ||
        Date.now() - lastActivityRef.current < IDLE_THRESHOLD_MS ||
        inFlightRef.current
      ) {
        return;
      }

      inFlightRef.current = true;
      try {
        await refreshRef.current();
      } catch (error) {
        console.error('Automatic data refresh failed:', error);
      } finally {
        inFlightRef.current = false;
      }
    };

    const activityEvents = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, markActivity, { passive: true }));
    document.addEventListener('visibilitychange', refreshIfIdle);
    const intervalId = window.setInterval(refreshIfIdle, REFRESH_INTERVAL_MS);

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, markActivity));
      document.removeEventListener('visibilitychange', refreshIfIdle);
      window.clearInterval(intervalId);
    };
  }, []);
}