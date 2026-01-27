# Email/Password Authentication

Complete guide to the email/password authentication system in LiquidOS.

## Overview

LiquidOS includes a comprehensive email/password authentication system with the following features:

- 🔐 Email/password login with JWT tokens
- 🚀 Auto-login for development and production
- 🎨 Beautiful glassmorphic UI
- ⚙️ Settings panel for configuration
- 🔒 Secure bcrypt password hashing
- 🎫 7-day JWT session tokens

## Quick Start

### Default Credentials

For development and testing:
- **Email:** mario.tiedemann@showheroes.com
- **Password:** Heroes0071!

### Auto-Login

Auto-login is **enabled by default** for both development and production environments. The system automatically logs in using the default credentials when you access LiquidOS.

To disable auto-login:
1. Open Settings → Security
2. Scroll to "Email/Password" section
3. Toggle "Auto-login" off

## Architecture

### Backend Components

**Authentication Service** ([authService.ts](file:///Users/mario/projects/LiquidCrypto/server/src/services/authService.ts))
- Password hashing with bcrypt (10 rounds)
- JWT token generation and verification
- User registration and login
- Password change functionality

**API Routes** ([email-auth.ts](file:///Users/mario/projects/LiquidCrypto/server/src/routes/email-auth.ts))
- `POST /api/auth/email/register` - User registration
- `POST /api/auth/email/login` - Login
- `POST /api/auth/email/verify` - Token verification
- `GET /api/auth/email/me` - Get current user
- `POST /api/auth/email/change-password` - Change password

**Database Schema** ([013_email_auth.sql](file:///Users/mario/projects/LiquidCrypto/server/sql/013_email_auth.sql))
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Frontend Components

**Auth Store** ([authStore.ts](file:///Users/mario/projects/LiquidCrypto/src/stores/authStore.ts))
- State management with Zustand
- Persistent storage across sessions
- Email credential management
- JWT token storage

**Auto-Login Hook** ([useAutoLogin.ts](file:///Users/mario/projects/LiquidCrypto/src/hooks/useAutoLogin.ts))
- Automatically triggers on page load
- Waits for store hydration
- Respects enable/disable settings

**Email Login Form** ([EmailLoginForm.tsx](file:///Users/mario/projects/LiquidCrypto/src/components/auth/EmailLoginForm.tsx))
- Email and password inputs
- Show/hide password toggle
- Loading states and error handling
- Glassmorphic design

**Security Settings** ([SecurityPanel.tsx](file:///Users/mario/projects/LiquidCrypto/src/components/settings/SecurityPanel.tsx))
- Email/password enable/disable toggle
- Auto-login configuration
- Display linked email credential
- Session timeout settings

## Usage

### Registering a New User

```typescript
const response = await fetch('/api/auth/email/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePassword123!',
    name: 'John Doe'
  })
});

const data = await response.json();
// { success: true, token: "...", user: {...} }
```

### Manual Login

```typescript
const { loginWithEmail } = useAuthStore();
const success = await loginWithEmail('user@example.com', 'password');
```

### Programmatic Login

```bash
curl -X POST http://localhost:3000/api/auth/email/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mario.tiedemann@showheroes.com",
    "password": "Heroes0071!"
  }'
```

## Security

### Password Requirements

- Minimum 8 characters
- Validated on both client and server
- Hashed with bcrypt (10 rounds)
- Never stored in plaintext

### JWT Tokens

- 7-day expiration (configurable)
- Signed with `JWT_SECRET` environment variable
- Includes user ID and email
- Stored in auth store and localStorage

### Environment Variables

```bash
# Backend (.env)
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
```

## Testing

### Browser Testing

Run automated browser tests:

```bash
# Test auto-login
bun run test:browser

# Test all browser features
bun run test:browser-all
```

### Manual Testing

1. Clear localStorage: `localStorage.clear()`
2. Refresh page
3. Observe auto-login in console
4. Try manual login via form
5. Check Settings → Security panel

### Verification

Check console for auto-login logs:
```
[AutoLogin] Effect triggered. State: {...}
[AutoLogin] Attempting auto-login...
[AutoLogin] ✅ Login successful
```

## Configuration

### Disable Auto-Login

**Via Settings UI:**
1. Navigate to Settings → Security
2. Find "Email/Password" section
3. Toggle "Auto-login" off

**Via Code:**
```typescript
const { setAutoLoginEnabled } = useAuthStore();
setAutoLoginEnabled(false);
```

### Enable/Disable Email Auth

```typescript
const { setEmailEnabled } = useAuthStore();
setEmailEnabled(false); // Disable email authentication
```

## Troubleshooting

### Auto-Login Not Working

1. Check console for `[AutoLogin]` messages
2. Verify `emailEnabled` and `autoLoginEnabled` are true
3. Check network tab for `/api/auth/email/login` request
4. Verify backend server is running

### Login Fails

1. Check credentials are correct
2. Verify user exists in database
3. Check `is_active` flag is true
4. Verify JWT_SECRET is set

### Database Issues

```bash
# Connect to database
docker exec -it liquidcrypto-postgres psql -U liquidcrypto -d liquidcrypto

# Check users table
SELECT email, name, is_active FROM users;

# Verify password hash
SELECT password_hash FROM users WHERE email = 'mario.tiedemann@showheroes.com';
```

## API Reference

### POST /api/auth/email/register

Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar_url": null,
    "is_active": true,
    "created_at": "2026-01-27T12:00:00.000Z",
    "updated_at": "2026-01-27T12:00:00.000Z"
  }
}
```

### POST /api/auth/email/login

Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### GET /api/auth/email/me

Get current authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar_url": null,
    "is_active": true
  }
}
```

## Files Modified

See [walkthrough.md](file:///Users/mario/.gemini/antigravity/brain/003261f0-ea6b-401a-b0ea-f1b6b552aa2b/walkthrough.md) for complete implementation details.
