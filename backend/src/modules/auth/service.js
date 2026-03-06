import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma.js';
import { env } from '../../config/env.js';

export async function registerUser({ name, email, password, clinicName }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw Object.assign(new Error('Email already in use'), { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, clinicName }
  });

  const token = jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });

  return { token, user: { id: user.id, name: user.name, email: user.email, clinicName: user.clinicName } };
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  const token = jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });

  return { token, user: { id: user.id, name: user.name, email: user.email, clinicName: user.clinicName } };
}
