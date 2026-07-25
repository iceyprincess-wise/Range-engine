export function generateLineOptions(
  lowBound: number,
  highBound: number,
  increment = 0.5,
): number[] {
  const options: number[] = [];
  if (Number.isNaN(lowBound) || Number.isNaN(highBound)) {
    return options;
  }

  if (highBound < lowBound) {
    [lowBound, highBound] = [highBound, lowBound];
  }

  const step = increment === 1 ? 1 : 0.5;
  let current = lowBound;
  while (current <= highBound + 1e-9) {
    options.push(parseFloat(current.toFixed(1)));
    current = Math.round((current + step) * 100) / 100;
  }
  return options;
}

export function parseNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function normalizePercent(value: unknown): number {
  const n = parseNumber(value, 0);
  if (n > 0 && n <= 1) return parseFloat((n * 100).toFixed(2));
  return Math.min(100, Math.max(0, parseFloat(n.toFixed(2))));
}

export function parseNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => parseNumber(item, 0));
}

export function formatDataValue(value: unknown, decimals = 1, fallback = "--"): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n.toFixed(decimals);
}

export function formatPercentValue(value: unknown, decimals = 1, fallback = "--"): string {
  const formatted = formatDataValue(value, decimals, fallback);
  return formatted === fallback ? fallback : `${formatted}%`;
}

export function safeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

export function weightedAverage(values: number[]): number {
  if (!values.length) return 0;
  const n = values.length;
  let weightSum = 0;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const weight = (i + 1) / n;
    total += values[i] * weight;
    weightSum += weight;
  }
  return parseFloat((total / weightSum).toFixed(2));
}

export function getLineupFromPayload(value: unknown): { pos: string; name: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 5)
    .map((item: any, idx) => ({
      pos: item?.pos || ["PG", "SG", "SF", "PF", "C"][idx] || "?",
      name: item?.name || item?.player || `Player ${idx + 1}`,
    }));
}

export function formatInjuryNotes(value: unknown, defaultNote: string) {
  if (typeof value === "string" && value.trim()) return value;
  return defaultNote;
}

// ─── League DNA Profiles (Anti-Template, Anti-Generic) ────────────────────────
