import { Router, type IRouter } from "express";
import healthRouter from "./health";
import basketRouter from "./basket";
import prematchRouter from "./prematch";

const router: IRouter = Router();

router.use(healthRouter);
router.use(basketRouter);
router.use(prematchRouter);

export default router;
