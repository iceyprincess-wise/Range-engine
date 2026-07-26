import { Router, type IRouter } from "express";
import healthRouter from "./health";
import basketRouter from "./basket";
import prematchRouter from "./prematch";
import newsRouter from "./news";
import gamesRouter from "./games";
import backtestRouter from "./backtest";
import resultsRouter from "./results";
import leagueDnaRouter from "./league-dna";

const router: IRouter = Router();

router.use(healthRouter);
router.use(basketRouter);
router.use(prematchRouter);
router.use(newsRouter);
router.use(gamesRouter);
router.use(backtestRouter);
router.use(resultsRouter);
router.use(leagueDnaRouter);

export default router;
