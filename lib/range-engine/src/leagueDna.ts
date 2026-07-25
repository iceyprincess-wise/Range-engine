export const LEAGUE_DNA_PROFILES: Record<
  string,
  {
    name: string;
    proxyPPG: number;
    hbDNA: number;
    lbDNA: number;
    maxWidth: number;
    hammerEdge: number;
    buffer: number;
    grind: boolean;
  }
> = {
  NBA: {
    name: "High-Octane NBA",
    proxyPPG: 113.8,
    hbDNA: 0,
    lbDNA: 0,
    maxWidth: 22,
    hammerEdge: 8,
    buffer: 3.0,
    grind: false,
  },
  EUROLEAGUE: {
    name: "Structured EuroLeague",
    proxyPPG: 82.0,
    hbDNA: 0,
    lbDNA: 0,
    maxWidth: 18,
    hammerEdge: 8,
    buffer: 1.5,
    grind: false,
  },
  ACB: {
    name: "Technical ACB Spain",
    proxyPPG: 85.0,
    hbDNA: 0,
    lbDNA: 2,
    maxWidth: 18,
    hammerEdge: 8,
    buffer: 1.5,
    grind: false,
  },
  RUSSIA: {
    name: "Defensive Grind (Russia)",
    proxyPPG: 78.5,
    hbDNA: -3,
    lbDNA: 0,
    maxWidth: 16,
    hammerEdge: 15,
    buffer: 1.5,
    grind: true,
  },
  GERMANY: {
    name: "Efficiency/Transition BBL",
    proxyPPG: 80.0,
    hbDNA: 0,
    lbDNA: 2,
    maxWidth: 17,
    hammerEdge: 15,
    buffer: 1.5,
    grind: false,
  },
  ISRAEL: {
    name: "Defensive Grind (Israel)",
    proxyPPG: 78.5,
    hbDNA: -3,
    lbDNA: 0,
    maxWidth: 16,
    hammerEdge: 15,
    buffer: 1.5,
    grind: true,
  },
  PBA: {
    name: "Philippine High-Pace",
    proxyPPG: 95.0,
    hbDNA: 0,
    lbDNA: 0,
    maxWidth: 20,
    hammerEdge: 8,
    buffer: 2.0,
    grind: false,
  },
  NBL: {
    name: "Australian NBL",
    proxyPPG: 88.0,
    hbDNA: 0,
    lbDNA: 0,
    maxWidth: 18,
    hammerEdge: 10,
    buffer: 2.0,
    grind: false,
  },
  NCAA: {
    name: "College NCAA",
    proxyPPG: 74.0,
    hbDNA: 0,
    lbDNA: 0,
    maxWidth: 16,
    hammerEdge: 10,
    buffer: 1.5,
    grind: false,
  },
  DEFAULT: {
    name: "Generic Proxy League",
    proxyPPG: 78.5,
    hbDNA: -2,
    lbDNA: 0,
    maxWidth: 16,
    hammerEdge: 15,
    buffer: 1.5,
    grind: true,
  },
};

export function getLeagueDNA(league: string) {
  const lg = league.toUpperCase();
  if (lg.includes("NBA")) return { ...LEAGUE_DNA_PROFILES.NBA, key: "NBA" };
  if (
    lg.includes("EUROLEAGUE") ||
    lg.includes("EURO LEAGUE") ||
    lg.includes("EUROCUP")
  )
    return { ...LEAGUE_DNA_PROFILES.EUROLEAGUE, key: "EUROLEAGUE" };
  if (lg.includes("ACB") || (lg.includes("SPAIN") && lg.includes("BASKET")))
    return { ...LEAGUE_DNA_PROFILES.ACB, key: "ACB" };
  if (
    lg.includes("RUSSIA") ||
    lg.includes("VTB") ||
    lg.includes("SUPERLIGA") ||
    lg.includes("SUPER LIGA") ||
    lg.includes("PBL") ||
    lg.includes("PARI")
  )
    return { ...LEAGUE_DNA_PROFILES.RUSSIA, key: "RUSSIA" };
  if (lg.includes("GERMAN") || lg.includes("BBL") || lg.includes("BUNDESLIGA"))
    return { ...LEAGUE_DNA_PROFILES.GERMANY, key: "GERMANY" };
  if (
    lg.includes("ISRAEL") ||
    lg.includes("BSL") ||
    lg.includes("WINNER") ||
    lg.includes("LIGAT")
  )
    return { ...LEAGUE_DNA_PROFILES.ISRAEL, key: "ISRAEL" };
  if (lg.includes("PBA") || lg.includes("PHILIPPINES"))
    return { ...LEAGUE_DNA_PROFILES.PBA, key: "PBA" };
  if (lg.includes("NBL") || lg.includes("AUSTRALIA"))
    return { ...LEAGUE_DNA_PROFILES.NBL, key: "NBL" };
  if (lg.includes("NCAA") || lg.includes("COLLEGE"))
    return { ...LEAGUE_DNA_PROFILES.NCAA, key: "NCAA" };
  return { ...LEAGUE_DNA_PROFILES.DEFAULT, key: "DEFAULT" };
}

// ─── Team Database (NBA) ─────────────────────────────────────────────────────
