import { Router } from 'express';
import { verifyJWT } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { getStats } from '../controllers/dashboardController';

const router = Router();

router.use(verifyJWT);
router.get('/stats', authorize('super_admin', 'hr_manager'), getStats);

export default router;
