-- GrubSpot Database Setup Script
-- Run this once to create all tables

-- Users table (students, mess owners, and admins)
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  phone           VARCHAR(20),
  role            VARCHAR(20) NOT NULL DEFAULT 'student'
                    CHECK (role IN ('student', 'mess_owner', 'admin')),
  mess_name       VARCHAR(150),
  address         TEXT,
  password_hash   TEXT NOT NULL,
  details         JSONB DEFAULT '{}'::jsonb,
  menu_data       JSONB DEFAULT '{}'::jsonb,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets / Feedback table
CREATE TABLE IF NOT EXISTS tickets (
  id          SERIAL PRIMARY KEY,
  ticket_id   VARCHAR(20) UNIQUE NOT NULL,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  mess_name   VARCHAR(150),
  subject     VARCHAR(255) NOT NULL,
  description TEXT,
  status      VARCHAR(30) NOT NULL DEFAULT 'Open'
                CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  mess_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  plan_name   VARCHAR(100),
  plan_type   VARCHAR(30),
  price       NUMERIC(10, 2),
  status      VARCHAR(30) DEFAULT 'active'
                CHECK (status IN ('active', 'paused', 'cancelled')),
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ
);

-- Create an admin account (change password as needed)
-- Password below is: admin@123  (bcrypt hash)
INSERT INTO users (name, email, phone, role, address, password_hash)
VALUES (
  'Admin',
  'admin@grubspot.com',
  '+91 9999999999',
  'admin',
  'Bengaluru',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'  -- password: "password"
)
ON CONFLICT (email) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_mess_name ON tickets(mess_name);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
