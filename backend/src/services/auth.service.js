import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { AuditAction, AuditEntityType } from '../constants/audit.js';
import { env } from '../config/env.js';
import { Roles, LegacyRoles, ASSIGNABLE_ROLE_VALUES, normalizeRole, toStoredRole } from '../constants/roles.js';
import { AuditService } from './audit.service.js';
import { PlanGatingService } from './plan-gating.service.js';
import { PlanFeature } from '../constants/subscriptionPlans.js';

export class AuthService {
    static async register({ name, email, password, clinicName }) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw Object.assign(new Error('Email already in use'), { status: 409, code: 'EMAIL_IN_USE' });
        }

        const userCount = await prisma.user.count();
        const role = userCount === 0 ? LegacyRoles.ADMIN : Roles.DOCTOR;
        const hashed = await bcrypt.hash(password, 12);
        const clinic = await prisma.clinic.upsert({
            where: { name: clinicName },
            update: {},
            create: { name: clinicName }
        });

        const planContext = await PlanGatingService.getClinicPlanContext(clinic.id);
        const planDecision = PlanGatingService.evaluateFeatureGate(
            PlanFeature.DOCTOR_LIMIT,
            planContext,
            { body: { role } }
        );
        if (!planDecision.allowed) {
            throw Object.assign(new Error(planDecision.message), {
                status: 403,
                code: 'PLAN_FEATURE_RESTRICTED'
            });
        }

        const user = await prisma.user.create({
            data: { name, email, password: hashed, clinicName, role, clinicId: clinic.id }
        });

        const tokens = this.generateTokens(user);

        const subscription = await PlanGatingService.getClinicPlanContext(user.clinicId);

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: 3600, // 1 hour in seconds
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                clinicId: user.clinicId,
                clinicName: user.clinicName,
                role: normalizeRole(user.role),
                subscription
            }
        };
    }

    static async login({ email, password }) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            await AuditService.logEvent({
                action: AuditAction.LOGIN_FAILURE,
                entityType: AuditEntityType.AUTH,
                metadata: { email: AuditService.safeEmail(email) }
            });
            throw Object.assign(new Error('Invalid email or password'), { status: 401, code: 'INVALID_CREDENTIALS' });
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
            await AuditService.logEvent({
                action: AuditAction.LOGIN_FAILURE,
                entityType: AuditEntityType.AUTH,
                userId: user.id,
                clinicId: user.clinicId,
                metadata: { email: AuditService.safeEmail(email) }
            });
            throw Object.assign(new Error('Invalid email or password'), { status: 401, code: 'INVALID_CREDENTIALS' });
        }

        const tokens = this.generateTokens(user);
        await AuditService.logEvent({
            action: AuditAction.LOGIN_SUCCESS,
            entityType: AuditEntityType.AUTH,
            userId: user.id,
            clinicId: user.clinicId,
            metadata: { email: AuditService.safeEmail(email) }
        });

        const subscription = await PlanGatingService.getClinicPlanContext(user.clinicId);

        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: 3600, // 1 hour in seconds
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                clinicId: user.clinicId,
                clinicName: user.clinicName,
                role: normalizeRole(user.role),
                subscription
            }
        };
    }

    static generateTokens(user) {
        const role = normalizeRole(user.role);
        const accessToken = jwt.sign(
            { sub: user.id, email: user.email, role, clinicId: user.clinicId, type: 'access' },
            env.jwtSecret,
            { expiresIn: '1h', algorithm: 'HS256' }
        );

        const refreshToken = jwt.sign(
            { sub: user.id, email: user.email, role, clinicId: user.clinicId, type: 'refresh' },
            env.jwtSecret,
            { expiresIn: '7d', algorithm: 'HS256' }
        );

        return { accessToken, refreshToken };
    }

    static async refreshToken(refreshToken) {
        try {
            const payload = jwt.verify(refreshToken, env.jwtSecret);
            
            if (payload.type !== 'refresh') {
                throw Object.assign(new Error('Invalid token type'), { status: 401, code: 'INVALID_TOKEN' });
            }

            // Fetch user to ensure they still exist
            const user = await prisma.user.findUnique({
                where: { id: payload.sub }
            });

            if (!user) {
                throw Object.assign(new Error('User not found'), { status: 401, code: 'USER_NOT_FOUND' });
            }

            // Generate new access token
            const newAccessToken = jwt.sign(
                { sub: user.id, email: user.email, role: normalizeRole(user.role), clinicId: user.clinicId, type: 'access' },
                env.jwtSecret,
                { expiresIn: '1h', algorithm: 'HS256' }
            );

            return {
                accessToken: newAccessToken,
                expiresIn: 3600 // 1 hour in seconds
            };
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw Object.assign(new Error('Refresh token expired'), { status: 401, code: 'TOKEN_EXPIRED' });
            }
            throw Object.assign(new Error('Invalid refresh token'), { status: 401, code: 'INVALID_TOKEN' });
        }
    }

    static async getProfile(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                clinicId: true,
                clinicName: true,
                role: true,
                createdAt: true
            }
        });

        if (!user) {
            throw Object.assign(new Error('User not found'), { status: 404, code: 'USER_NOT_FOUND' });
        }

        const planContext = await PlanGatingService.getClinicPlanContext(user.clinicId);

        return {
            ...user,
            role: normalizeRole(user.role),
            subscription: planContext
        };
    }

    static async createUserByAdmin({ actorId, name, email, password, clinicName, role }) {
        if (!ASSIGNABLE_ROLE_VALUES.includes(role)) {
            throw Object.assign(new Error('Invalid role'), { status: 400, code: 'INVALID_ROLE' });
        }

        const admin = await prisma.user.findUnique({
            where: { id: actorId },
            select: { id: true, role: true, clinicId: true, clinicName: true }
        });

        const actorRole = normalizeRole(admin?.role);
        if (!admin || (actorRole !== Roles.CLINIC_ADMIN && actorRole !== Roles.SUPER_ADMIN)) {
            throw Object.assign(new Error('Admin privileges required'), { status: 403, code: 'FORBIDDEN' });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw Object.assign(new Error('Email already in use'), { status: 409, code: 'EMAIL_IN_USE' });
        }

        const targetClinicId = actorRole === Roles.SUPER_ADMIN
            ? (clinicName
                ? (await prisma.clinic.upsert({
                    where: { name: clinicName },
                    update: {},
                    create: { name: clinicName }
                })).id
                : admin.clinicId)
            : admin.clinicId;
        const targetClinicName = actorRole === Roles.SUPER_ADMIN
            ? (clinicName || admin.clinicName)
            : admin.clinicName;
        const persistedRole = toStoredRole(role);
        const hashed = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { name, email, password: hashed, clinicName: targetClinicName, clinicId: targetClinicId, role: persistedRole }
        });

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            clinicId: user.clinicId,
            clinicName: user.clinicName,
            role: normalizeRole(user.role),
            createdAt: user.createdAt
        };
    }
}
