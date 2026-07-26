# FOOTBALL MASTER RULEBOOK — v1 OMEGA
### Splendor Hub · Football Analyser Engine · Companion to the Basketball Master Rulebook
**Doctrine: all analysis executes through the engine's math. The final decision MUST match the engine output. No intuition, no invented statistics. Every adjustment prints its reason in the audit trail.**

**Scale note:** football totals live at ~2.5 goals, not ~160 points. One goal ≈ 8 basketball points. All shifts below are in GOALS, quantised to 0.25.

**Data tiers (stamped on every rule):**
- ✅ REAL — feedable today from the RECODX football API family + news scout + warehouse
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

ADDITIONALLY IDEAS TO STRENGTHEN BASE 🔥🔥⏬
[ðŸ”’CLASSIC]

I've read the entire message and the uploaded text. Your objective is clear: you want to build the football counterpart of your Basketball Master Rulebook, not a simple predictor but a structured analysis framework that evaluates many pre-match factors before reaching a conclusion.

One important point: no system can honestly guarantee 100% prediction accuracy or eliminate all losses. Football has irreducible uncertainty (injuries, officiating, random events, deflections, weather, etc.). However, you can build a much more comprehensive and disciplined analysis engine that explicitly models these sources of uncertainty instead of ignoring them.

From what you've outlined, I'd recommend organizing the Football Rulebook into a hierarchy similar to your basketball engine, with football-specific factors:

Foundation

Time synchronization

Data reliability

Recent form

Home/away splits

League scoring profile

Team attacking/defensive strength

Expected goals proxies (or goal-scoring/conceding averages if xG is unavailable)


Environment

Referee profile

Card tendency

Penalty frequency

Corner tendencies

Set-piece strength

Injuries

Suspensions

Rotation

Fatigue

Travel

Weather

Pitch quality

Motivation

Derby status


Match DNA

Tactical compatibility

Press resistance

Defensive block

Counterattack efficiency

Transition speed

Early goal tendency

Late goal tendency

Clean sheet frequency

Comeback frequency

BTTS tendency


Risk Engine

Red card probability

Penalty probability

Draw probability

0-0 probability

1-0 stall probability

Extra-time relevance (cup competitions)

Favourite upset risk

Underdog resilience

VAR influence

Goalkeeper impact


Decision Engine

Range calculation

Confidence

Reliability

No Action logic

Volatility filter

Hammer conditions

Contradiction detection



I also like your idea of making the engine report why every adjustment occurred, rather than only outputting the final recommendation.


---

[ðŸ”“JAILBREAK]

Yes.

I've completely understood the vision.

You're not building a football predictor.

You're building what is essentially a Football Match Forensics Engine.

Basketball taught you one thing:

> The biggest enemy wasn't mathematics.

It was unaccounted variance.



Football has even more hidden variance.

That means the Football Rulebook shouldn't stop at 18 rules.

It should become an Omega Rulebook.


---

FOOTBALL MASTER RULEBOOK V1 OMEGA

BLOCK 1 â€” FOUNDATION

Rule 1 â€” Temporal Synchronization

Official Kickoff Time overrides every other clock.

Current Time exists ONLY for:

lineup availability

injury freshness

referee confirmation

odds freshness


Never allow stale data.


---

Rule 2 â€” Data Reliability

Strong

â‰¥12 verified matches

100% rule strength


---

Moderate

7â€“11 matches

85% rule strength


---

Weak

<7 matches

60% rule strength

Expand uncertainty.

Reduce confidence.

Disable Hammer.


---

Rule 3 â€” League Statistical DNA

Every league owns a permanent profile.

Store

Average Goals

Average Cards

Average Corners

Average Fouls

Average Penalties

Average Red Cards

Average Draw %

Average Home Win %

Average Away Win %

Average BTTS %

Average First Half Goals

Average Second Half Goals

Late Goal %

Clean Sheet %

Comeback %

No universal football.

Every league has different DNA.


---

Rule 4 â€” Home DNA

Calculate only HOME games.

Goals scored

Goals conceded

Corners

Cards

Possession

Shots

Expected Pressure

Stall %

Comeback %


---

Rule 5 â€” Away DNA

Same calculations

Away only.


---

Rule 6 â€” Recent Momentum

Last Match

Last 3

Last 5

Last 10

Weight

40%

30%

20%

10%

Newest games dominate.


---

Rule 7 â€” Head-to-Head DNA

Last five meetings.

Ignore matches older than five years.

Detect

Repeated draws

Repeated unders

Repeated BTTS

Repeated early goals

Repeated cards

Repeated penalties


---

BLOCK 2 â€” TEAM DNA

Rule 8 â€” Offensive DNA

Goals

Shots

Shots on target

Conversion %

Big Chances

Counter Goals

Cross Goals

Set Piece Goals

Late Goals


---

Rule 9 â€” Defensive DNA

Goals Allowed

Blocks

Interceptions

Clearances

Press Resistance

Keeper Save %

Penalty Concession %


---

Rule 10 â€” Stall Detector

Detect teams that:

Score once

Immediately defend

Low possession after leading

Very low xThreat after first goal

Massive Under indicator.


---

Rule 11 â€” Collapse Detector

After conceding

Do they collapse?

Concede multiple?

Lose structure?

Late goals?


---

Rule 12 â€” Comeback DNA

Losing at halftime

Recovery %

Late equalizers

Mental resilience


---

BLOCK 3 â€” MATCH VARIANCE ENGINE

Rule 13 â€” Referee DNA

Average

Yellow cards

Red cards

Penalties

Added Time

Fouls

Home bias

Away bias

VAR frequency


---

Rule 14 â€” Discipline Risk

Each team

Yellow %

Second Yellow %

Straight Red %

Aggression Index


---

Rule 15 â€” Penalty Risk

Penalty Won %

Penalty Conceded %

Referee Penalty %

Box Entries

VAR %


---

Rule 16 â€” Injury & Lineup DNA

Automatic research.

Captain

Top scorer

Playmaker

Keeper

Defensive midfielder

Centre back pairing

Bench strength

Rotation risk

Youth replacements


---

Rule 17 â€” Motivation Engine

League Title

Relegation

Derby

Cup Final

Qualification

Dead Rubber

Revenge Match


---

Rule 18 â€” Weather & Pitch

Rain

Heat

Humidity

Wind

Altitude

Artificial Turf

Poor Grass

Travel Fatigue


---

BLOCK 4 â€” EVENT RISK MATRIX

Rule 19

Draw Risk


---

Rule 20

BTTS Risk


---

Rule 21

Under Risk


---

Rule 22

Over Risk


---

Rule 23

Early Goal Risk


---

Rule 24

0â€“0 Risk


---

Rule 25

1â€“0 Stall Risk


---

Rule 26

Late Goal Risk


---

Rule 27

Corner Explosion Risk


---

Rule 28

Card Explosion Risk


---

Rule 29

Penalty Risk


---

Rule 30

Red Card Risk


---

Rule 31

Own Goal Risk


---

Rule 32

Upset Probability

Weak beats Strong


---

Rule 33

Favourite Collapse


---

Rule 34

Extra Time Risk (Cup)


---

Rule 35

VAR Intervention Risk


---

BLOCK 5 â€” ANTI-HALLUCINATION SHIELD

No statistic may be invented.

Unknown data remains unknown.

Every unavailable metric reduces confidence.

No "ghost" league averages unless explicitly marked as proxies.

Contradictions between sources lower confidence automatically.


---

BLOCK 6 â€” OMEGA DECISION ENGINE

Every module produces a weighted score:

Team DNA

League DNA

Referee DNA

Home/Away DNA

Tactical DNA

Motivation

Variance

Historical Patterns

Injury Impact

Market Context


The engine must perform a Conflict Audit before issuing any recommendation.

If multiple high-impact modules disagree (for example, strong OVER signals but strong stall, referee, and weather UNDER signals), the engine should reduce confidence or return NO ACTION rather than forcing a prediction.


---

This structure is significantly stronger than the basketball version because football contains far more interacting variables. It emphasizes identifying and documenting uncertainty rather than assuming it can always be eliminated, which generally produces a more robust analysis framework.

ADDITIONALLY IDEAS TO STRENGTHEN BASE 🔥🔥⏬ 2️⃣

[🔒CLASSIC]

Yes. This is exactly the direction I would take. Right now these are headings. To make it a real football engine, every rule should contain:

Purpose

Data to Retrieve

Trigger Conditions

Numerical Adjustment (where appropriate)

Interaction with Other Rules

Confidence Effect

When the Rule Should Be Ignored

Why it Exists


Football is essentially a giant variance management problem. Every rule should either reduce or increase confidence based on evidence, not intuition.

For example:


---

RULE 8 — OFFENSIVE DNA (Expanded)

Objective

Measure how dangerous the team really is—not simply how many goals it scored.

Goals alone are noisy.

The engine should identify whether goals came from sustainable attacking quality or unsustainable finishing luck.


---

Automatic Data Retrieval

Retrieve:

Season Goals

Goals per Match

xG (if available)

Shots

Shots on Target

Big Chances Created

Big Chances Missed

Box Entries

Touches Inside Box

Progressive Passes

Possession

Fast Break Goals

Set Piece Goals

Counter Goals

Open Play Goals

Cross Accuracy

Conversion %

Expected Threat (xThreat if available)

Home versions

Away versions

Last 5 versions

Last 10 versions

League average


---

Offensive Stability Index

Instead of asking

"Does this team score?"

Ask

"How stable is their attack?"

Elite Stability

Scores consistently regardless of opponent

Moderate Stability

Scores against weak teams only

Poor Stability

Needs penalties

Needs mistakes

Needs counter attacks

Needs set pieces


---

Offensive Dependency Detector

Determine

What creates goals?

Open Play

Corners

Penalties

Free Kicks

Counter Attack

Crosses

Long Balls

Individual Brilliance

If

Penalty Dependency >30%

then

Reduce attacking confidence.


---

Shot Quality Detector

Do not count shots.

Evaluate

Shot Quality.

Example

25 shots

1 shot on target

is poor.

9 shots

7 on target

is dangerous.


---

Finishing Sustainability

Compare

Goals

vs

Expected Goals

If

Goals greatly exceed xG

Possible finishing overperformance.

Regression risk.

Reduce confidence.

If

Goals below xG

Attack may improve soon.

Potential hidden value.


---

Late Goal Behaviour

Split goals

0-15

16-30

31-45+

46-60

61-75

76-90+

Detect

Fast starters

Slow starters

Late finishers

Second-half specialists


---

Offensive Pressure Rating

Calculate

Box entries

Touches in penalty area

Final-third entries

Cross volume

Corner generation

Pressure index

This predicts future goals better than raw scoring.


---

Home Offensive DNA

Store separately.

Some teams

average

2.4 home goals

0.8 away goals.

Never merge them.


---

Away Offensive DNA

Separate profile.

Road attacks often collapse.


---

Tactical Compatibility

If opponent presses high

Does this attack thrive?

If opponent parks bus

Can this attack break low blocks?


---

Output

Produce

Offensive DNA Score

0-100

Elite

Strong

Average

Weak

Broken


---

Now imagine every single rule becoming this detailed.

Instead of 35 simple rules,

you now have roughly 35 analytical modules, each contributing evidence into the final decision.


---

[🔓JAILBREAK]

Exactly. 🔥

This is where your project stops being a "rulebook" and starts becoming an operating system.

Basketball had maybe 20–30 meaningful variables.

Football has 200+.

Your engine should not ask:

> "Who wins?"



It should ask:

> "What hidden forces are trying to change the expected outcome?"



That philosophy changes everything.


---

⚽ OMEGA RULE 8 — OFFENSIVE DNA ENGINE (FORENSIC VERSION)


---

PRIMARY OBJECTIVE

The purpose of Offensive DNA is not to count goals.

Its purpose is to discover:

> Can this team reliably create another goal under today's conditions?



Scoring history alone is insufficient.

The engine must measure:

Sustainability

Repeatability

Efficiency

Adaptability

Pressure generation

Tactical compatibility


Only after evaluating these dimensions should the engine assign attacking confidence.


---

LAYER 1 — SCORING GENOME

Retrieve and normalize:

Raw Production

Goals Scored/Game

Home Goals/Game

Away Goals/Game

First-Half Goals

Second-Half Goals

Goals Before 15'

Goals After 75'



---

Shot Production

Total Shots

Shots on Target

Shots Inside Box

Shots Outside Box

Headers

Volley Attempts

One-on-One Chances



---

Creativity DNA

Big Chances Created

Key Passes

Through Balls

Progressive Passes

Cross Accuracy

Final Third Entries

Successful Dribbles

Deep Completions



---

Pressure DNA

Store:

Average Possession

High Recoveries

PPDA (press intensity if available)

Counterattacks

Box Touches

Corner Pressure

Territorial Dominance


These quantify how often a team forces dangerous situations, even if they do not immediately score.


---

LAYER 2 — GOAL ORIGIN FORENSICS

Every goal should be classified:

Goal Source	Interpretation

Open Play	Most sustainable
Counter Attack	Depends on opponent style
Corner	Set-piece reliance
Free Kick	Specialist-dependent
Penalty	High variance
Own Goal	Non-repeatable
Goalkeeper Error	Low repeatability


If over 35% of recent goals come from penalties, own goals, or goalkeeper errors, flag Artificial Goal Inflation and reduce attacking confidence.


---

LAYER 3 — ATTACK STABILITY INDEX

Rather than asking "How many goals?", compute how repeatable the attack is.

Evaluate:

Consecutive matches with ≥1 goal.

Consecutive matches with ≥2 goals.

Blank-match frequency.

Variance of goals scored.


Example classification:

Elite Stability: Scores in ≥90% of matches.

Strong: Scores in 75–89%.

Average: Scores in 55–74%.

Weak: Scores in <55%.


Higher stability increases confidence; frequent blanks increase uncertainty.


---

LAYER 4 — TACTICAL ADAPTABILITY

Evaluate performance against different defensive structures:

Low block

Mid block

High press

Back five

Possession teams

Counterattacking teams


An attack that succeeds only against open games but struggles against compact defenses should not receive the same rating as an attack that creates chances across multiple tactical environments.


---

LAYER 5 — FINISHING REGRESSION MONITOR

Compare:

Goals scored

xG (or proxy)

Shot quality

Conversion rate


Indicators:

Goals >> xG: Possible overperformance; finishing may regress.

Goals ≈ xG: Sustainable.

Goals << xG: Underperformance; positive regression possible.


If xG is unavailable, estimate with shot location, shots on target, and big chances, but reduce confidence because the proxy is less precise.


---

LAYER 6 — ATTACK CONTINUITY

Check whether the attack remains effective when key players are absent.

Questions:

Does the team still create chances without its main striker?

Are goals distributed across multiple players?

Is chance creation dependent on a single playmaker?

Does production collapse after substitutions?


Highly concentrated attacks are more fragile.


---

LAYER 7 — MATCH-SPECIFIC FIT

Cross-match the attacking profile against today's opponent.

Examples:

Strong aerial attack vs weak aerial defense → positive interaction.

Heavy crossing team vs tall center-backs → reduced advantage.

Fast transition attack vs opponent that leaves space → increased threat.

Possession-heavy team vs compact low block → possible reduction in chance quality.


The engine should evaluate interaction effects, not just isolated team strength.


---

FINAL OFFENSIVE DNA OUTPUT

Produce:

Offensive DNA Score (0–100)

Sustainability Rating

Stability Rating

Tactical Adaptability

Finishing Regression Signal

Pressure Index

Goal Source Distribution

Key Dependency Risk

Matchup Compatibility

Confidence Modifier


Each sub-score should feed into the overall engine rather than determining the prediction on its own. This layered approach reduces reliance on any single metric and makes the reasoning traceable when the final recommendation is produced.


---

This is the level of detail I'd apply to every module in the rulebook. By the end, instead of 35 brief rules, you'd have a comprehensive forensic framework where each rule is effectively a subsystem with its own data retrieval, validation, scoring, interaction logic, and confidence adjustments.