import http from 'http';
import { parse } from 'url';

function json(res, obj) {
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const u = parse(req.url, true);
  if (u.pathname === '/api/v1/sync') {
    const homeTeam = u.query.homeTeam || 'Home United';
    const awayTeam = u.query.awayTeam || 'Away City';
    const form5 = () => Array.from({ length: 5 }, () => (Math.random() > 0.5 ? 'W' : 'L'));
    const payload = {
      homeForm50: Array.from({ length: 50 }, (_, i) => 150 + Math.round(Math.sin(i) * 6 + Math.random() * 6)),
      awayForm50: Array.from({ length: 50 }, (_, i) => 148 + Math.round(Math.cos(i) * 6 + Math.random() * 6)),
      h2h50: Array.from({ length: 50 }, (_, i) => 300 - Math.round(Math.abs(Math.sin(i) * 20)) ),
      homeRecentForm: form5(),
      awayRecentForm: form5(),
      homeFt: 75,
      awayFt: 72,
      homePt3: 36,
      awayPt3: 34,
      homeFgPct: 46,
      awayFgPct: 44,
      homeOffPpg: 112.4,
      awayOffPpg: 108.9,
      homeDefPpg: 105.2,
      awayDefPpg: 107.8,
      homeArenaPPG: 112,
      awayRoadPPG: 110,
      h2hAvgTotal: 222.5,
      collapsePct: Math.round(Math.random()*40),
      homeInjuries: '✓ No confirmed injuries — full squad available',
      awayInjuries: '✓ No confirmed injuries — full squad available',
      homeLineup: [
        { pos: 'PG', name: `${homeTeam} PG` },
        { pos: 'SG', name: `${homeTeam} SG` },
        { pos: 'SF', name: `${homeTeam} SF` },
        { pos: 'PF', name: `${homeTeam} PF` },
        { pos: 'C',  name: `${homeTeam} C` },
      ],
      awayLineup: [
        { pos: 'PG', name: `${awayTeam} PG` },
        { pos: 'SG', name: `${awayTeam} SG` },
        { pos: 'SF', name: `${awayTeam} SF` },
        { pos: 'PF', name: `${awayTeam} PF` },
        { pos: 'C',  name: `${awayTeam} C` },
      ],
      homeFoulRate: 21.3,
      awayFoulRate: 19.7,
      homeFtAttempts: 22,
      awayFtAttempts: 19,
      homeFoulRate50: Array.from({ length: 50 }, () => 20 + Math.random()*6),
      awayFoulRate50: Array.from({ length: 50 }, () => 18 + Math.random()*6),
      homeFtAttempts50: Array.from({ length: 50 }, () => 18 + Math.random()*6),
      awayFtAttempts50: Array.from({ length: 50 }, () => 16 + Math.random()*6),
      leagueFoulAverage: 34,
      refereeStrictness: 6,
      sourcesScanned: 124,
      researchMs: 1234,
      // live stats shape
      homeScore: 48,
      awayScore: 54,
      clockMin: 6,
      quarter: 3,
      ftPct: 76.5,
      pt3Pct: 35.2,
      fgPct: 44.1,
      possession: 'Home',
    };
    return json(res, payload);
  }
  if (u.pathname === '/api/v1/resolve') return json(res, { ok: true });
  res.writeHead(404); res.end('Not found');
});

server.listen(5000, () => console.log('Mock API listening on http://localhost:5000'));
