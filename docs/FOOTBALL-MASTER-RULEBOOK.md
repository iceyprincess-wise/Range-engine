# FOOTBALL MASTER RULEBOOK — v1 OMEGA
### Splendor Hub · Football Analyser Engine · Companion to the Basketball Master Rulebook
**Doctrine: all analysis executes through the engine's math. The final decision MUST match the engine output. No intuition, no invented statistics. Every adjustment prints its reason in the audit trail.**

**Scale note:** football totals live at ~2.5 goals, not ~160 points. One goal ≈ 8 basketball points. All shifts below are in GOALS, quantised to 0.25.

**Data tiers (stamped on every rule):**
- ⚠️ PARTIAL — claimed feedable today from the RECODX football API family + news scout + warehouse, but no code in this repo can feed it (no `lib/range-engine/src/football/`, no RECODX/scout usage anywhere) — treat as PARTIAL until a real source is wired
- ⚠️ PARTIAL — sometimes available; rule fires only when data exists, otherwise prints a decline
- ❌ NOT FREE — v2 aspiration; permanent decline-state until a real source exists. NEVER simulated.

---

## BLOCK 1 — FOUNDATION

**Rule 1 — Temporal Synchronization** ✅
Official kickoff time (venue-adjusted) overrides every clock. Current time exists only for freshness gates: lineups valid ≤ 60 min old, injury news ≤ 24 h, odds reference ≤ 30 min. Stale input → rule that consumes it declines.

**Rule 2 — Data Reliability** ✅
- Strong: ≥ 12 verified matches → 100% rule strength.
- Moderate: 7–11 → all Block 2–4 shifts × 0.85.
- Weak: < 7 → shifts × 0.6, Hammer disabled, watch-line cushion +0.5 goals, confidence capped Low.
- Warehouse anchor (basketball lesson): ≥ 10 real stored matches for a team lifts any proxy cap; its own measured numbers anchor the range.

**Rule 3 — League Statistical DNA** ✅ (baselines PROXY until warehouse-measured)
Every league owns a profile: baseline goals/game, width cap, hook buffer, BTTS%, late-goal%, draw%. Seed values (labeled PROXY, replaced by per-league backtest measurement as the football warehouse grows):
| League tier | Baseline GPG | Width cap | Buffer |
|---|---|---|---|
| Bundesliga / Eredivisie | 3.1 | 2.0 | 0.35 |
| EPL / Serie A / Ligue 1 | 2.8 | 1.75 | 0.35 |
| La Liga / Championship | 2.5 | 1.75 | 0.35 |
| African / lower tiers / obscure | 2.2 | 1.5 | 0.40 |
| Unknown league (Generic Proxy) | 2.4 CAP | 1.5 | 0.40 |
No universal football. NBA ≠ NCAA applies double here.

**Rule 4 — Home DNA / Rule 5 — Away DNA** ✅
Never merge venue splits. Base total = (home team's HOME goals for+against avg + away team's AWAY avg) ÷ 2. **Base range = base ± 0.75**, then league width cap governs.

**Rule 6 — Recent Momentum** ✅ (weights subject to backtest calibration)
Last match 40% · last 3 30% · last 5 20% · last 10 10% — weighted GOAL TOTALS, not W/L. Flag: goals are rare events; these weights are v1 doctrine and the football backtest recalibrates them from evidence.

**Rule 7 — Head-to-Head DNA** ✅
Last 5 meetings, ignore > 5 years. Derby/rivalry flag → HB −0.25, UNDER lean. Repeated unders (≥ 4/5 below 2.5) → HB −0.25 additional. Repeated BTTS (≥ 4/5) → feeds Rule 30 cross-check.

---

## BLOCK 2 — TEAM DNA

**Rule 8 — Offensive DNA** ✅ core / ⚠️ forensic layers
Core (warehouse): goals/game by venue, 1st-half vs 2nd-half goal split, blank-match frequency.
**Attack Stability Index:** scores in ≥ 90% of matches = Elite · 75–89 Strong · 55–74 Average · < 55 Weak. Weak stability → HB −0.25 and attacking confidence −1 tier.
Forensic layers (goal-origin %, shot quality, penalty dependency > 30% → confidence −1, finishing-vs-xG regression): ⚠️ fire only when match-statistics accumulate in warehouse; otherwise decline printed.

**Rule 9 — Defensive DNA** ✅ core
Goals allowed by venue; clean-sheet %. Home CS ≥ 50% → HB −0.25. BOTH teams CS ≥ 40% → 0-0/1-0 risk flag HIGH (feeds Rules 24/25). Keeper save %, press resistance: ⚠️ decline until profiled.

**Rule 10 — Stall Detector (the 1-0 protector)** ✅ proxy
Trigger: ≥ 60% of team's wins by exactly one goal AND 2nd-half goals share < 35%. → HB −0.5. Prints: "score-then-park profile — early goal may be the only goal." This is your "one early goal, nothing till FT" risk, measured.

**Rule 11 — Collapse Detector** ✅ proxy
Trigger: concedes 2+ in a single half in ≥ 35% of defeats → facing Strong-stability attack: HB +0.25.

**Rule 12 — Comeback DNA** ✅
HT-deficit recovery ≥ 30% → HB +0.25 (late-goal support). ≤ 10% → UNDER support when this side expected to trail.

---

## BLOCK 3 — MATCH VARIANCE ENGINE

**Rule 13 — Referee DNA** ⚠️
When referee known AND profiled (≥ 8 matches): pens/game ≥ 0.35 → HB +0.25 (penalty ≈ 0.79 goals). Cards/game ≥ 5.5 → HB −0.25 (fragmented rhythm). Unknown/unprofiled → DECLINE printed, no shift.

**Rule 14 — Discipline / Red Card Protocol** ✅ pre-match proxy · ⚠️ live
Pre-match: combined team cards/game ≥ 5.0 OR derby + aggressive profiles → red-card risk HIGH → widen both bounds ±0.25 (variance, not direction). Live red before 60′: widen ±0.5 and re-audit — ten men suppress own scoring but concede more; direction is matchup-dependent, never assumed.

**Rule 15 — Penalty Risk** ⚠️
High box-pressure attack vs pen-conceding defence (both profiled) → HB +0.25. Else decline.

**Rule 16 — Injury & Lineup DNA** ✅ via news scout (automatic — no manual boxes)
Strong-signal phrases (ruled out / will miss / sidelined / surgery) auto-detected, source + date printed:
- Key attacker OUT → LB −0.25, HB −0.5 (vacuum: others shoot more, convert less).
- Goalkeeper OUT → HB +0.25.
- CB pairing broken → HB +0.25.
No reports found → "no injury reports — nothing invented."

**Rule 17 — Motivation Engine** ⚠️ (standings feedable)
Dead rubber (both mid-table, final 3 rounds) → widen ±0.25 (rotation chaos). Relegation six-pointer / cup final / derby → HB −0.25 (tension football). Revenge/title context: flag only, no shift until measurable.

**Rule 18 — Weather & Pitch** ❌
Permanent decline-state: "not assessed — no data source." Never guessed.

---

## BLOCK 4 — EVENT RISK MATRIX (Rules 19–35, consolidated)
These compute as RISK OUTPUTS (LOW/MODERATE/HIGH with printed frequencies and sample sizes), feeding the Conflict Audit — not as 17 independent range shifts. Stacking 17 shifts on a 2.5-goal base would drown the signal (the basketball stacking-cap lesson). Minimum sample: 8 matches, else the risk declines.
- **R19 Draw Risk** — combined draw% of both sides + league draw%.
- **R20 BTTS Risk** — both teams' scored+conceded frequencies.
- **R21/22 Under/Over pressure** — net of Blocks 1–3, printed as leaning forces.
- **R23 Early-Goal Risk** — goals-before-15′ share.
- **R24 0-0 Risk** — blank frequencies × defensive DNA.
- **R25 1-0 Stall Risk** — Rule 10 output × R24.
- **R26 Late-Goal Risk** — goals-after-75′ share (trailing teams push; huge share of goals land 75′+).
- **R27/28 Corner & Card explosion** — ⚠️ from accumulated match stats.
- **R29/30 Penalty & Red-card** — mirrors Rules 13–15.
- **R31 Own-Goal** — noise; logged, never shifted.
- **R32 Upset / Weak-beats-Strong** — odds gap ≥ 4:1 + underdog at home + derby or six-pointer → upset flag; favourite-dependent assumptions get confidence −1. No range shift — upsets change WINNER risk, totals only via R33.
- **R33 Favourite Collapse** — favourite conceding-first frequency ≥ 40% → HB +0.25 (chasing games open up).
- **R34 Extra-Time Relevance** — cup two-legs/finals: market settles at 90′ — engine computes 90′ ONLY, prints the reminder. ET/pens NEVER inflate the range (basketball Rule 18's OT-neutrality twin).
- **R35 VAR Influence** — ❌ decline until a real per-league VAR profile exists.

---

## BLOCK 5 — ANTI-HALLUCINATION SHIELD (non-negotiable)
1. No statistic may be invented. Unknown remains unknown, printed as unknown.
2. Every unavailable metric reduces confidence; it never defaults to LOW/SAFE/1-day-rest or any silent value.
3. Proxies carry the PROXY label until warehouse-measured; caps lift at ≥ 10 real matches.
4. Source contradictions lower confidence automatically.
5. Every rule prints in the full-chain audit — triggered, checked, or declined. No silent rules (basketball Update 5A doctrine).

---

## BLOCK 6 — OMEGA DECISION ENGINE

**Rule 36 — Market Position:** ladder 0.5 / 1.5 / 2.5 / 3.5 / 4.5 (half-lines only, Sportybet-native; Asian quarters 2.25/2.75 deferred to v2). Line vs range exactly as basketball Rule 12.
**Rule 37 — Hook Shield:** buffer = league buffer (0.35–0.40 goals). A projection of 2.6 vs a 2.5 line is a coin flip — blocked.
**Rule 38 — Volatility Kill:** width > league cap → NO ACTION on the given line (watch-line still issued). 90′ settlement explicit in every verdict.
**Rule 39 — Hammer Play:** edge ≥ 0.75 goals (Strong) / ≥ 1.25 (Moderate-Weak, the Proxy Reality doctrine). Stall Risk HIGH overrides Hammer — no Hammer into a park-the-bus profile.
**Rule 40 — BTTS Cross-Check:** OVER verdict + BTTS-No profile (or reverse) → contradiction printed, confidence −1.
**Rule 41 — Conflict Audit:** ≥ 2 high-impact modules opposing the verdict → confidence −1 AND watch-line with reliability cushion (0 / 0.5 / 0.75 goals by tier). NEVER a forced blank: NO ACTION is reserved for Rule 42 and hook-blocks only — every analysis hands back an actionable number or a truthfully-priced watch-line (the anti-No-Action-bias doctrine).
**Rule 42 — Fixed/Sold-Out Tells (the one permitted NO ACTION zone):** line moves ≥ 0.75 against public news direction · obscure league + abnormal liquidity · odds collapse without any reported cause. Two or more tells → NO ACTION, reason printed.
**Rule 43 — Auto-Reconfirm:** every verdict silently recomputed cold (fresh timestamp, heavy-adjustment limits); variance between runs → red flag before staking.
**Rule 44 — Accuracy over Action:** confidence is earned by data coverage, printed with its inputs. The Archive settles every verdict and the backtest recalibrates magnitudes per league. The shield rules exist because variance is irreducible — the engine's edge is measuring it, naming it, and pricing it.

---
*v1 Omega — drafted for direct implementation in `lib/range-engine/src/football/`. Every bracketless number above is binding until the football backtest, grading real settled matches, earns the right to change it.

---

*Appendix note (Round 35, D-2026-11-19-107): the pasted LLM chat log that followed line 135 (~1,378 lines, including `[🔓JAILBREAK]` sections) was removed — it was not a spec. The normative v1 OMEGA spec above is unchanged.*
