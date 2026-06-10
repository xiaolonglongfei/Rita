import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import instructorsRouter from "./instructors";
import sessionsRouter from "./sessions";
import reviewsRouter from "./reviews";
import rankingsRouter from "./rankings";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(instructorsRouter);
router.use(sessionsRouter);
router.use(reviewsRouter);
router.use(rankingsRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);
router.use(adminRouter);

export default router;
