import { getLeagueDNA } from "./leagueDna";
export const TEAM_DB: Record<
  string,
  {
    avg_pts: number;
    avg_allowed: number;
    def_rating: number;
    ft_pct: number;
    pt2_pct: number;
    pt3_pct: number;
    pace: number;
    games: number;
  }
> = {
  lakers: {
    avg_pts: 114.2,
    avg_allowed: 113.6,
    def_rating: 1.1,
    ft_pct: 0.77,
    pt2_pct: 0.54,
    pt3_pct: 0.36,
    pace: 100.1,
    games: 12,
  },
  celtics: {
    avg_pts: 120.6,
    avg_allowed: 108.9,
    def_rating: 1.05,
    ft_pct: 0.8,
    pt2_pct: 0.56,
    pt3_pct: 0.38,
    pace: 100.8,
    games: 14,
  },
  warriors: {
    avg_pts: 116.3,
    avg_allowed: 112.4,
    def_rating: 1.08,
    ft_pct: 0.78,
    pt2_pct: 0.55,
    pt3_pct: 0.39,
    pace: 101.5,
    games: 11,
  },
  heat: {
    avg_pts: 110.4,
    avg_allowed: 109.2,
    def_rating: 1.06,
    ft_pct: 0.76,
    pt2_pct: 0.53,
    pt3_pct: 0.35,
    pace: 98.4,
    games: 10,
  },
  nuggets: {
    avg_pts: 115.8,
    avg_allowed: 111.3,
    def_rating: 1.07,
    ft_pct: 0.79,
    pt2_pct: 0.55,
    pt3_pct: 0.36,
    pace: 100.3,
    games: 13,
  },
  bucks: {
    avg_pts: 118.1,
    avg_allowed: 114.2,
    def_rating: 1.11,
    ft_pct: 0.75,
    pt2_pct: 0.56,
    pt3_pct: 0.37,
    pace: 101.9,
    games: 12,
  },
  "76ers": {
    avg_pts: 113.7,
    avg_allowed: 115.4,
    def_rating: 1.12,
    ft_pct: 0.81,
    pt2_pct: 0.54,
    pt3_pct: 0.35,
    pace: 99.6,
    games: 11,
  },
  sixers: {
    avg_pts: 113.7,
    avg_allowed: 115.4,
    def_rating: 1.12,
    ft_pct: 0.81,
    pt2_pct: 0.54,
    pt3_pct: 0.35,
    pace: 99.6,
    games: 11,
  },
  clippers: {
    avg_pts: 112.8,
    avg_allowed: 110.7,
    def_rating: 1.07,
    ft_pct: 0.77,
    pt2_pct: 0.53,
    pt3_pct: 0.36,
    pace: 99.1,
    games: 10,
  },
  suns: {
    avg_pts: 116.9,
    avg_allowed: 117.1,
    def_rating: 1.14,
    ft_pct: 0.79,
    pt2_pct: 0.55,
    pt3_pct: 0.37,
    pace: 102.2,
    games: 12,
  },
  mavericks: {
    avg_pts: 117.4,
    avg_allowed: 112.9,
    def_rating: 1.09,
    ft_pct: 0.8,
    pt2_pct: 0.55,
    pt3_pct: 0.38,
    pace: 100.7,
    games: 13,
  },
  mavs: {
    avg_pts: 117.4,
    avg_allowed: 112.9,
    def_rating: 1.09,
    ft_pct: 0.8,
    pt2_pct: 0.55,
    pt3_pct: 0.38,
    pace: 100.7,
    games: 13,
  },
  knicks: {
    avg_pts: 113.5,
    avg_allowed: 109.8,
    def_rating: 1.06,
    ft_pct: 0.76,
    pt2_pct: 0.53,
    pt3_pct: 0.36,
    pace: 98.8,
    games: 11,
  },
  nets: {
    avg_pts: 109.3,
    avg_allowed: 118.2,
    def_rating: 1.15,
    ft_pct: 0.74,
    pt2_pct: 0.52,
    pt3_pct: 0.34,
    pace: 99.3,
    games: 9,
  },
  bulls: {
    avg_pts: 111.6,
    avg_allowed: 113.7,
    def_rating: 1.1,
    ft_pct: 0.77,
    pt2_pct: 0.53,
    pt3_pct: 0.35,
    pace: 99.9,
    games: 10,
  },
  spurs: {
    avg_pts: 108.4,
    avg_allowed: 119.3,
    def_rating: 1.16,
    ft_pct: 0.73,
    pt2_pct: 0.52,
    pt3_pct: 0.34,
    pace: 100.5,
    games: 11,
  },
  raptors: {
    avg_pts: 111.2,
    avg_allowed: 116.4,
    def_rating: 1.13,
    ft_pct: 0.76,
    pt2_pct: 0.52,
    pt3_pct: 0.35,
    pace: 99.7,
    games: 12,
  },
  thunder: {
    avg_pts: 119.1,
    avg_allowed: 110.8,
    def_rating: 1.07,
    ft_pct: 0.78,
    pt2_pct: 0.56,
    pt3_pct: 0.37,
    pace: 101.1,
    games: 13,
  },
  timberwolves: {
    avg_pts: 112.4,
    avg_allowed: 108.6,
    def_rating: 1.05,
    ft_pct: 0.77,
    pt2_pct: 0.53,
    pt3_pct: 0.36,
    pace: 99.5,
    games: 11,
  },
  wolves: {
    avg_pts: 112.4,
    avg_allowed: 108.6,
    def_rating: 1.05,
    ft_pct: 0.77,
    pt2_pct: 0.53,
    pt3_pct: 0.36,
    pace: 99.5,
    games: 11,
  },
  pacers: {
    avg_pts: 121.3,
    avg_allowed: 119.4,
    def_rating: 1.15,
    ft_pct: 0.82,
    pt2_pct: 0.57,
    pt3_pct: 0.37,
    pace: 103.8,
    games: 12,
  },
  hawks: {
    avg_pts: 116.7,
    avg_allowed: 119.2,
    def_rating: 1.15,
    ft_pct: 0.79,
    pt2_pct: 0.55,
    pt3_pct: 0.37,
    pace: 102.4,
    games: 10,
  },
  magic: {
    avg_pts: 107.3,
    avg_allowed: 108.9,
    def_rating: 1.05,
    ft_pct: 0.73,
    pt2_pct: 0.52,
    pt3_pct: 0.34,
    pace: 98.1,
    games: 11,
  },
  grizzlies: {
    avg_pts: 113.8,
    avg_allowed: 112.4,
    def_rating: 1.08,
    ft_pct: 0.76,
    pt2_pct: 0.54,
    pt3_pct: 0.35,
    pace: 100.2,
    games: 10,
  },
  pelicans: {
    avg_pts: 112.1,
    avg_allowed: 114.7,
    def_rating: 1.11,
    ft_pct: 0.74,
    pt2_pct: 0.53,
    pt3_pct: 0.35,
    pace: 99.8,
    games: 9,
  },
  jazz: {
    avg_pts: 114.5,
    avg_allowed: 118.3,
    def_rating: 1.14,
    ft_pct: 0.78,
    pt2_pct: 0.54,
    pt3_pct: 0.36,
    pace: 100.9,
    games: 10,
  },
  rockets: {
    avg_pts: 112.7,
    avg_allowed: 110.4,
    def_rating: 1.07,
    ft_pct: 0.74,
    pt2_pct: 0.53,
    pt3_pct: 0.36,
    pace: 99.6,
    games: 11,
  },
  kings: {
    avg_pts: 118.4,
    avg_allowed: 117.2,
    def_rating: 1.13,
    ft_pct: 0.8,
    pt2_pct: 0.56,
    pt3_pct: 0.38,
    pace: 102.1,
    games: 12,
  },
  pistons: {
    avg_pts: 108.1,
    avg_allowed: 116.9,
    def_rating: 1.14,
    ft_pct: 0.76,
    pt2_pct: 0.52,
    pt3_pct: 0.34,
    pace: 100.3,
    games: 10,
  },
  cavaliers: {
    avg_pts: 116.2,
    avg_allowed: 107.4,
    def_rating: 1.04,
    ft_pct: 0.77,
    pt2_pct: 0.54,
    pt3_pct: 0.36,
    pace: 99.2,
    games: 13,
  },
  cavs: {
    avg_pts: 116.2,
    avg_allowed: 107.4,
    def_rating: 1.04,
    ft_pct: 0.77,
    pt2_pct: 0.54,
    pt3_pct: 0.36,
    pace: 99.2,
    games: 13,
  },
  hornets: {
    avg_pts: 108.9,
    avg_allowed: 117.6,
    def_rating: 1.14,
    ft_pct: 0.76,
    pt2_pct: 0.52,
    pt3_pct: 0.34,
    pace: 100.0,
    games: 10,
  },
  wizards: {
    avg_pts: 106.4,
    avg_allowed: 120.1,
    def_rating: 1.16,
    ft_pct: 0.74,
    pt2_pct: 0.51,
    pt3_pct: 0.33,
    pace: 100.7,
    games: 9,
  },
  trailblazers: {
    avg_pts: 109.8,
    avg_allowed: 117.9,
    def_rating: 1.14,
    ft_pct: 0.77,
    pt2_pct: 0.53,
    pt3_pct: 0.35,
    pace: 100.5,
    games: 10,
  },
  blazers: {
    avg_pts: 109.8,
    avg_allowed: 117.9,
    def_rating: 1.14,
    ft_pct: 0.77,
    pt2_pct: 0.53,
    pt3_pct: 0.35,
    pace: 100.5,
    games: 10,
  },
};

export function lookupTeam(
  name: string,
  dna: ReturnType<typeof getLeagueDNA>,
): {
  stats: (typeof TEAM_DB)[string];
  source: "DB" | "PROXY" | "WAREHOUSE";
  proxyCapped: boolean;
  capValue: number;
} {
  const key = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
  for (const [k, v] of Object.entries(TEAM_DB)) {
    if (key.includes(k) || k.includes(key))
      return { stats: v, source: "DB", proxyCapped: false, capValue: 0 };
  }
  // Tier 2 Proxy — PPG STRICTLY capped at league DNA proxy PPG (anti-hallucination)
  const cap = dna.proxyPPG;
  const pace = cap >= 100 ? 73 : cap <= 75 ? 67 : 70;
  const ft = dna.grind ? 0.68 : 0.74; // Grind leagues have worse FT%
  const pt2 = dna.grind ? 0.49 : 0.52;
  const pt3 = dna.grind ? 0.32 : 0.35;
  return {
    stats: {
      avg_pts: cap,
      avg_allowed: cap,
      def_rating: dna.grind ? 1.12 : 1.1,
      ft_pct: ft,
      pt2_pct: pt2,
      pt3_pct: pt3,
      pace,
      games: 6,
    },
    source: "PROXY",
    proxyCapped: true,
    capValue: cap,
  };
}

// ─── Smart Paste Auto-Correct Engine ──────────────────────────────────────────
export function autoCorrectTeamName(input: string): string {
  const corrections: Record<string, string> = {
    LAL: "Los Angeles Lakers",
    Fener: "Fenerbahce Istanbul",
    GS: "Galatasaray",
    BJK: "Besiktas JK",
    "Zonkeys de Ti": "Zonkeys de Tijuana",
    "Halcones de C": "Halcones de Ciudad Victoria",
    Mavs: "Dallas Mavericks",
    "76ers": "Philadelphia 76ers",
  };
  const trimmed = input.trim();
  return corrections[trimmed] || trimmed;
}

// ─── Interfaces ───────────────────────────────────────────────────────────────
