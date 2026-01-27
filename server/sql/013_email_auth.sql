-- Email/Password Authentication System
-- Migration 013: Add users table and email authentication

-- Users table for email/password authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster email lookups
CREATE INDEX idx_users_email ON users (email);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- Insert default dev/production user
-- Password: Heroes0071!
-- Generated with bcrypt, 10 rounds
INSERT INTO
    users (email, password_hash, name)
VALUES (
        'mario.tiedemann@showheroes.com',
        '$2b$10$CV.yvcS./ZMCZyKbXZgE.e42I45egz7hDsmW.lPC0CfXsJWH1O6KS',
        'Mario Tiedemann'
    ) ON CONFLICT (email) DO NOTHING;

-- Comment for documentation
COMMENT ON
TABLE users IS 'Email/password authenticated users for LiquidOS';

COMMENT ON COLUMN users.password_hash IS 'bcrypt hashed password (never store plaintext)';