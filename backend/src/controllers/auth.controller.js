import { AuthService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { UserRoleService } from '../services/user-role.service.js';
import {
    clearAuthCookies,
    getRefreshTokenFromCookies,
    setAccessCookie,
    setAuthCookies
} from '../utils/authCookies.js';

export const register = asyncHandler(async (req, res) => {
    const { name, email, password, clinicName } = req.validated.body;
    const data = await AuthService.register({ name, email, password, clinicName });
    setAuthCookies(res, data.accessToken, data.refreshToken);
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data
    });
});

export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.validated.body;
    const data = await AuthService.login({ email, password });
    setAuthCookies(res, data.accessToken, data.refreshToken);
    res.json({
        success: true,
        message: 'Login successful',
        data
    });
});

export const me = asyncHandler(async (req, res) => {
    const user = await AuthService.getProfile(req.user.id);
    res.json({
        success: true,
        message: 'Authenticated user profile',
        data: user
    });
});

export const refresh = asyncHandler(async (req, res) => {
    const tokenFromCookie = getRefreshTokenFromCookies(req);
    const refreshToken = req.validated.body.refreshToken || tokenFromCookie;
    if (!refreshToken) {
        throw Object.assign(new Error('Refresh token is required'), {
            status: 400,
            code: 'VALIDATION_ERROR'
        });
    }
    const data = await AuthService.refreshToken(refreshToken);
    if (tokenFromCookie) {
        setAccessCookie(res, data.accessToken);
    }
    res.json({
        success: true,
        message: 'Token refreshed successfully',
        data
    });
});

export const logout = asyncHandler(async (req, res) => {
    clearAuthCookies(res);
    res.json({
        success: true,
        message: 'Logout successful',
        data: {}
    });
});

export const createUser = asyncHandler(async (req, res) => {
    const { name, email, password, clinicName, role } = req.validated.body;
    const user = await AuthService.createUserByAdmin({
        actorId: req.user.id,
        name,
        email,
        password,
        clinicName,
        role
    });

    res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
    });
});

export const updateUserRole = asyncHandler(async (req, res) => {
    const updatedUser = await UserRoleService.updateUserRole({
        actorUser: req.user,
        targetUserId: req.validated.params.id,
        newRole: req.validated.body.role
    });

    res.json({
        success: true,
        message: 'User role updated successfully',
        data: updatedUser
    });
});
