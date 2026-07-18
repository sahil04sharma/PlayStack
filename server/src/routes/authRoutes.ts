import { Router } from 'express';
import { login, logout, me } from '../controllers/authController';
import { verifyJWT } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', verifyJWT, me);

export default router;
