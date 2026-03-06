import { z } from 'zod';
import { ASSIGNABLE_ROLE_VALUES } from '../constants/roles.js';

export const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        clinicName: z.string().min(2, 'Clinic name must be at least 2 characters')
    })
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required')
    })
});

export const refreshSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required')
    })
});

export const createUserByAdminSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters'),
        email: z.string().email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        clinicName: z.string().min(2, 'Clinic name must be at least 2 characters'),
        role: z.enum(ASSIGNABLE_ROLE_VALUES)
    })
});

export const updateUserRoleSchema = z.object({
    params: z.object({
        id: z.string().uuid('Invalid user ID')
    }),
    body: z.object({
        role: z.enum(ASSIGNABLE_ROLE_VALUES)
    })
});
