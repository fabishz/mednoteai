import { Router } from 'express';
import { register, login } from './controller.js';
import { validate } from '../../middlewares/validate.js';
import { registerSchema, loginSchema } from './validation.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

export default router;
