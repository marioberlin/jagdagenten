/**
 * Email/Password Authentication API Routes
 * 
 * Separate from OAuth routes for cleaner organization.
 */

import { Elysia, t } from 'elysia';
import {
    registerUser,
    loginUser,
    getUserById,
    verifyToken,
    changePassword,
} from '../services/authService';

export const emailAuthRoutes = new Elysia({ prefix: '/api/auth/email' })
    /**
     * POST /api/auth/email/register
     * Register a new user
     */
    .post(
        '/register',
        async ({ body, set }) => {
            const { email, password, name } = body;

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                set.status = 400;
                return {
                    success: false,
                    error: 'Invalid email format',
                };
            }

            // Validate password strength
            if (password.length < 8) {
                set.status = 400;
                return {
                    success: false,
                    error: 'Password must be at least 8 characters',
                };
            }

            const result = await registerUser(email, password, name);

            if (!result.success) {
                set.status = 400;
                return result;
            }

            return result;
        },
        {
            body: t.Object({
                email: t.String(),
                password: t.String(),
                name: t.Optional(t.String()),
            }),
        }
    )

    /**
     * POST /api/auth/email/login
     * Login with email and password
     */
    .post(
        '/login',
        async ({ body, set }) => {
            const { email, password } = body;

            const result = await loginUser(email, password);

            if (!result.success) {
                set.status = 401;
                return result;
            }

            return result;
        },
        {
            body: t.Object({
                email: t.String(),
                password: t.String(),
            }),
        }
    )

    /**
     * POST /api/auth/email/verify
     * Verify JWT token
     */
    .post(
        '/verify',
        async ({ body, set }) => {
            const { token } = body;

            const payload = verifyToken(token);

            if (!payload) {
                set.status = 401;
                return {
                    success: false,
                    error: 'Invalid or expired token',
                };
            }

            // Get user data
            const user = await getUserById(payload.userId);

            if (!user) {
                set.status = 401;
                return {
                    success: false,
                    error: 'User not found',
                };
            }

            return {
                success: true,
                user,
            };
        },
        {
            body: t.Object({
                token: t.String(),
            }),
        }
    )

    /**
     * GET /api/auth/email/me
     * Get current user from token
     */
    .get('/me', async ({ headers, set }) => {
        const authHeader = headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            set.status = 401;
            return {
                success: false,
                error: 'No authentication token provided',
            };
        }

        const token = authHeader.substring(7);
        const payload = verifyToken(token);

        if (!payload) {
            set.status = 401;
            return {
                success: false,
                error: 'Invalid or expired token',
            };
        }

        const user = await getUserById(payload.userId);

        if (!user) {
            set.status = 401;
            return {
                success: false,
                error: 'User not found',
            };
        }

        return {
            success: true,
            user,
        };
    })

    /**
     * POST /api/auth/email/change-password
     * Change password for authenticated user
     */
    .post(
        '/change-password',
        async ({ headers, body, set }) => {
            const authHeader = headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                set.status = 401;
                return {
                    success: false,
                    error: 'No authentication token provided',
                };
            }

            const token = authHeader.substring(7);
            const payload = verifyToken(token);

            if (!payload) {
                set.status = 401;
                return {
                    success: false,
                    error: 'Invalid or expired token',
                };
            }

            const { currentPassword, newPassword } = body;

            // Validate new password
            if (newPassword.length < 8) {
                set.status = 400;
                return {
                    success: false,
                    error: 'New password must be at least 8 characters',
                };
            }

            const result = await changePassword(
                payload.userId,
                currentPassword,
                newPassword
            );

            if (!result.success) {
                set.status = 400;
            }

            return result;
        },
        {
            body: t.Object({
                currentPassword: t.String(),
                newPassword: t.String(),
            }),
        }
    );
