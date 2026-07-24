import { Router, type IRouter } from "express";
import healthRouter from "./health";
import basketRouter from "./basket";
import prematchRouter from "./prematch";
import newsRouter from "./news";

const router: IRouter = Router();

router.use(healthRouter);
router.use(basketRouter);
router.use(prematchRouter);
router.use(newsRouter);

export default router;
