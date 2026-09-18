'use client';
import { useEffect, useState } from 'react';
import { createGameEvents, gameEnvironment, type GameId } from './game-events';
import { CONSENT_EVENT, hasConsent, track } from './track';

export function useGameEvents(game: GameId) {
  const [events] = useState(() => createGameEvents({
    game,
    environment: () => gameEnvironment(window.location.hostname, process.env.NEXT_PUBLIC_GAME_ENV),
    enabled: () => hasConsent() && !!process.env.NEXT_PUBLIC_TRACK_URL,
    send: track,
  }));
  useEffect(() => {
    events.view();
    const changed = () => events.consentChanged();
    const storage = (e: StorageEvent) => { if (e.key === 'cce_track_consent_v1' || e.key === null) changed(); };
    window.addEventListener(CONSENT_EVENT, changed);
    window.addEventListener('storage', storage);
    return () => { window.removeEventListener(CONSENT_EVENT, changed); window.removeEventListener('storage', storage); };
  }, [events]);
  return events;
}
