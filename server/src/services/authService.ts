/**
 * Authentication Service
 * 
 * Handles email/password authentication with JWT tokens.
 * Uses bcrypt for password hashing and jsonwebtoken for session management.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db';

// ============================================================================
// Types
// ============================================================================

export interface User {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface LoginResult {
    success: boolean;
    token?: string;
    user?: Omit<User, 'password_hash'>;
    error?: string;
}

export interface RegisterResult {
    success: boolean;
    user?: Omit<User, 'password_hash'>;
    error?: string;
}

export interface JWTPayload {
    userId: string;
    email: string;
    iat?: number;
    exp?: number;
}

// ============================================================================
// Configuration
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'liquid-crypto-dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

// ============================================================================
// Password Utilities
// ============================================================================

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare a password with a hash
 */
export async function comparePassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// ============================================================================
// JWT Utilities
// ============================================================================

/**
 * Generate a JWT token for a user
 */
export function generateToken(userId: string, email: string): string {
    const payload: JWTPayload = {
        userId,
        email,
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch (error) {
        console.error('JWT verification failed:', error);
        return null;
    }
}

// ============================================================================
// User Authentication
// ============================================================================

/**
 * Register a new user
 */
export async function registerUser(
    email: string,
    password: string,
    name?: string
): Promise<RegisterResult> {
    try {
        // Check if user already exists
        const existing = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existing.rows.length > 0) {
            return {
                success: false,
                error: 'User with this email already exists',
            };
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Insert user
        const result = await pool.query(
            `INSERT INTO users (email, password_hash, name)
       VALUES ($1, $2, $3)
       RETURNING id, email, name, avatar_url, is_active, created_at, updated_at`,
            [email, passwordHash, name || null]
        );

        const user = result.rows[0];

        return {
            success: true,
            user,
        };
    } catch (error) {
        console.error('Registration error:', error);
        return {
            success: false,
            error: 'Failed to register user',
        };
    }
}

/**
 * Login a user with email and password
 */
export async function loginUser(
    email: string,
    password: string
): Promise<LoginResult> {
    try {
        // Find user by email
        const result = await pool.query(
            `SELECT id, email, password_hash, name, avatar_url, is_active, created_at, updated_at
       FROM users
       WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return {
                success: false,
                error: 'Invalid email or password',
            };
        }

        const user = result.rows[0];

        // Check if user is active
        if (!user.is_active) {
            return {
                success: false,
                error: 'Account is disabled',
            };
        }

        // Verify password
        const isValidPassword = await comparePassword(password, user.password_hash);

        if (!isValidPassword) {
            return {
                success: false,
                error: 'Invalid email or password',
            };
        }

        // Generate JWT token
        const token = generateToken(user.id, user.email);

        // Remove password_hash from returned user
        const { password_hash, ...userWithoutPassword } = user;

        return {
            success: true,
            token,
            user: userWithoutPassword,
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            error: 'Failed to login',
        };
    }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
    try {
        const result = await pool.query(
            `SELECT id, email, name, avatar_url, is_active, created_at, updated_at
       FROM users
       WHERE id = $1`,
            [userId]
        );

        return result.rows[0] || null;
    } catch (error) {
        console.error('Get user error:', error);
        return null;
    }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    try {
        const result = await pool.query(
            `SELECT id, email, name, avatar_url, is_active, created_at, updated_at
       FROM users
       WHERE email = $1`,
            [email]
        );

        return result.rows[0] || null;
    } catch (error) {
        console.error('Get user by email error:', error);
        return null;
    }
}

/**
 * Update user profile
 */
export async function updateUser(
    userId: string,
    updates: {
        name?: string;
        avatar_url?: string;
    }
): Promise<User | null> {
    try {
        const fields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (updates.name !== undefined) {
            fields.push(`name = $${paramIndex++}`);
            values.push(updates.name);
        }

        if (updates.avatar_url !== undefined) {
            fields.push(`avatar_url = $${paramIndex++}`);
            values.push(updates.avatar_url);
        }

        if (fields.length === 0) {
            return getUserById(userId);
        }

        values.push(userId);

        const result = await pool.query(
            `UPDATE users
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, email, name, avatar_url, is_active, created_at, updated_at`,
            values
        );

        return result.rows[0] || null;
    } catch (error) {
        console.error('Update user error:', error);
        return null;
    }
}

/**
 * Change user password
 */
export async function changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get current password hash
        const result = await pool.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            return { success: false, error: 'User not found' };
        }

        const { password_hash } = result.rows[0];

        // Verify current password
        const isValid = await comparePassword(currentPassword, password_hash);

        if (!isValid) {
            return { success: false, error: 'Current password is incorrect' };
        }

        // Hash new password
        const newPasswordHash = await hashPassword(newPassword);

        // Update password
        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [newPasswordHash, userId]
        );

        return { success: true };
    } catch (error) {
        console.error('Change password error:', error);
        return { success: false, error: 'Failed to change password' };
    }
}
