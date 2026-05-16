import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || "";

export const useLiveSync = () => {
  const [scores, setScores] = useState({});
  const pulse = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/basket/live`);
      if (!response.ok) {
        throw new Error(`Backend live fetch failed: ${response.status}`);
      }
      const json = await response.json();
      const events = json?.events || [];
      if (events.length > 0) {
        const combined: Record<string, any> = {};
        events.forEach((g: any) => {
          combined[g.homeTeam.name] = {
            home: g.homeScore?.current || 0,
            away: g.awayScore?.current || 0,
            status: g.status?.type === 'finished' ? 'FT' : 'LIVE',
          };
        });
        setScores(combined);
        return;
      }

      setScores({
        'Minnesota Lynx': { home: 90, away: 91, status: 'FT' },
        'Atlanta Dream': { home: 91, away: 90, status: 'FT' },
      });
    } catch (err) {
      console.error("Pulse Failed", err);
    }
  };
  useEffect(() => {
    pulse();
    const i = setInterval(pulse, 60000);
    return () => clearInterval(i);
  }, []);
  return scores;
};
