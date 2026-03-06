import { registerUser, loginUser } from './service.js';

export async function register(req, res, next) {
  try {
    const { name, email, password, clinicName } = req.validated.body;
    const data = await registerUser({ name, email, password, clinicName });
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.validated.body;
    const data = await loginUser({ email, password });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
