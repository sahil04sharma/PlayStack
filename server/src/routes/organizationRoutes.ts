import { Router } from 'express';
import { verifyJWT } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { getOrgTree } from '../controllers/organizationController';

const router = Router();

router.use(verifyJWT);
router.get('/tree', authorize('super_admin', 'hr_manager', 'employee'), getOrgTree);

export default router;
