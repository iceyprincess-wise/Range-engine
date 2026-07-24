import { Router, type IRouter } from "express";
import healthRouter from "./health";
import basketRouter from "./basket";
import prematchRouter from "./prematch";
import newsRouter from "./news";
import gamesRouter from "./games";

const router: IRouter = Router();

router.use(healthRouter);
router.use(basketRouter);
router.use(prematchRouter);
router.use(newsRouter);
router.use(gamesRouter);

export default router;
