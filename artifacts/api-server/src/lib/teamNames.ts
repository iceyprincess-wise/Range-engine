// D-2026-11-18-53: ONE shared team-name normaliser for every route
// that matches a user-typed team name against a stored/provider name
// (basket.ts safeMatch, results.ts pick(), prematch.ts searchTeam,
// freefeed.ts NAME_ALIASES lookups). Before this, each file had its
// own substring/equality match and none of them equated
// "LA Clippers" with the stored "Los Angeles Clippers": /v1/sync
// and /v1/resolve 404'd on a live game, and /v1/result missed a
// banked one. The expansion precedents live here in one place:
// freefeed's sideTokens la -> los angeles token expansion, and its
// NAME_ALIASES table (moved here verbatim).

// Proven provider name variants (ESPN short name vs the warehouse's
// BasketAPI name). An alias is only a lookup hint: the game still
// banks solely when the aliased name exists in the warehouse map.
export const NAME_ALIASES: Record<string, string> = {
  "la clippers": "los angeles clippers",
};

// Plain normalisation: trim, lowercase, collapse whitespace.
export const normTeamName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

// Canonical form for matching: a leading "la" token expands to
// "los angeles" (freefeed sideTokens precedent), then the alias
// table applies. Idempotent on already-normalised input.
export const expandTeamAlias = (s: string): string => {
  const normed = normTeamName(s);
  const expanded = normed.replace(/^la\s+/, "los angeles ");
  return NAME_ALIASES[expanded] ?? NAME_ALIASES[normed] ?? expanded;
};
