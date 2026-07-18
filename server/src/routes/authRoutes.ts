import { Router } from 'express';
import { login, logout, me } from '../controllers/authController';
import { verifyJWT } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginRules } from '../validators/employeeValidator';

const router = Router();

router.post('/login', validate(loginRules), login);
router.post('/logout', logout);
router.get('/me', verifyJWT, me);

export default router;
