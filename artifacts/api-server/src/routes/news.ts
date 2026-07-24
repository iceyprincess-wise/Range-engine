import { Router, type Request, type Response } from "express";

const router = Router();
const cache = new Map<string, { expiresAt: number; value: any }>();
const TTL = 30 * 60 * 1000; // news stays fresh 30 min

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
   .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/<[^>]+>/g, "").trim();

router.get("/v1/news", async (req: Request, res: Response) => {
  const { team } = req.query as Record<string, string>;
  if (!team) return res.status(400).json({ error: "team is required" });

  const key = team.toLowerCase();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return res.json(hit.value);

  try {
    const q = encodeURIComponent(team + " basketball injury OR lineup OR out");
    const url = "https" + "://news.google.com/rss/search?q=" + q + "&hl=en-US&gl=US&ceid=US:en";
    const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
    if (!response.ok) throw new Error("news fetch failed: " + response.status);
    const xml = await response.text();

    const items: { title: string; source: string; published: string }[] = [];
    const blocks = xml.split("<item>").slice(1, 8);
    for (const b of blocks) {
      const title = decode((b.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "");
      const source = decode((b.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || "");
      const published = decode((b.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || "");
      if (title) items.push({ title, source, published });
    }

    const payload = { provenance: "news-rss", team, fetchedAt: new Date().toISOString(), items };
    cache.set(key, { expiresAt: Date.now() + TTL, value: payload });
    res.json(payload);
  } catch (error) {
    console.error("/api/v1/news error:", error);
    res.status(502).json({ error: "news fetch failed", items: [] });
  }
});

export default router;
