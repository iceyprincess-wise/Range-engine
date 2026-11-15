// D-2026-11-15-08 — tournament label disambiguation (Round 24).
// The server payload carries one tournament per uniqueTournament id
// with { id, name, country, uniqueName }, where uniqueName is the
// provider league name (tournament.uniqueTournament.name). Two rows
// can still share a (name, country) label — live proof: ids 39394
// and 39451, both { name: "Regular Season", country: "Greece Amateur" }.
// A row in such a colliding group gets its league name appended;
// when the provider gives no league name, the id is the fallback,
// so two distinct tournaments can never render identical labels.
// Rows outside a colliding group are unchanged (extra is null).
// uniqueName is optional: disk/banked payloads saved before Round 24
// do not carry it, and the server sends "" when the provider omits it.
export interface GameTournament {
  id: number;
  name: string;
  country: string;
  uniqueName?: string;
}

export function tourLabelExtra(
  t: GameTournament,
  tours: GameTournament[],
): string | null {
  let same = 0;
  for (const o of tours) if (o.name === t.name && o.country === t.country) same++;
  if (same < 2) return null;
  if (t.uniqueName && t.uniqueName !== t.name) return t.uniqueName;
  return `#${t.id}`;
}
