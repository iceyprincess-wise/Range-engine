import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || "";

/** Polls the live scoreboard only while `enabled`. Backs off hard when nothing is live. */
export const useLiveSync = (enabled: boolean = false) => {
  const [scores, setScores] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const pulse = async () => {
      let anyLive = false;
      try {
        const response = await fetch(`${API_BASE}/api/basket/live`);
        if (!response.ok) throw new Error(`Backend live fetch failed: ${response.status}`);
        const json = await response.json();
        const events = json?.events || [];
        const combined: Record<string, any> = {};
        events.forEach((g: any) => {
          const finished = g.status?.type === 'finished';
          if (!finished) anyLive = true;
          combined[g.homeTeam.name] = {
            home: g.homeScore?.current || 0,
            away: g.awayScore?.current || 0,
            status: finished ? 'FT' : 'LIVE',
          };
        });
        setScores(combined); // empty feed = empty board (no fabricated scores)
      } catch (err) {
        console.error("Pulse Failed", err);
      }
      if (!stopped) timer = setTimeout(pulse, anyLive ? 270_000 : 15 * 60_000);
    };

    pulse();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, [enabled]);

  return scores;
};
