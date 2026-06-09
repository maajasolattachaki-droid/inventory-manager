import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import stockRouter from "./stock";
import dashboardRouter from "./dashboard";
import alertsRouter from "./alerts";
import ordersRouter from "./orders";
import customersRouter from "./customers";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(stockRouter);
router.use(dashboardRouter);
router.use(alertsRouter);
router.use(ordersRouter);
router.use(customersRouter);

export default router;
