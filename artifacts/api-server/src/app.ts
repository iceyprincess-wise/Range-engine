import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { rateLimit } from "./middlewares/rateLimit";

const app: Express = express();

// Collapse a leading double slash (//api/...) to a single slash before
// routing. A client whose API base URL ends in "/" builds URLs like
// `${API_BASE}/api/...` = "//api/...", which Express does not match to
// the /api router and 404s; this makes one misconfigured base URL unable
// to 404 the whole API surface.
app.use((req, _res, next) => {
  if (req.url.startsWith("//")) req.url = req.url.replace(/^\/{2,}/, "/");
  next();
});

// Behind Render (or any proxy) the client IP arrives in
// X-Forwarded-For; trust the first proxy so the rate limiter keys on
// the real client instead of lumping everyone behind one IP.
app.set("trust proxy", 1);
app.use(rateLimit);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
