import { Router } from 'express';
import { verifyJWT } from '../middleware/auth';
import { getStats } from '../controllers/dashboardController';

const router = Router();

router.use(verifyJWT);
router.get('/stats', getStats);

export default router;
