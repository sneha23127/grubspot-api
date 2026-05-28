-- GrubSpot Database Setup Script
-- Run this once to create all tables

-- 1. Users table (students, mess owners, and admins)
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(150) NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  phone           VARCHAR(20),
  role            VARCHAR(20) NOT NULL DEFAULT 'student'
                    CHECK (role IN ('student', 'mess_owner', 'admin')),
  mess_name       VARCHAR(150),
  address         TEXT,
  password        TEXT NOT NULL,
  details         JSONB DEFAULT '{}'::jsonb,
  menu_data       JSONB DEFAULT '{}'::jsonb,
  status          VARCHAR(20) NOT NULL DEFAULT 'Active'
                    CHECK (status IN ('Active', 'Blocked', 'active', 'blocked')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Messes table (specifically for mess owner details)
CREATE TABLE IF NOT EXISTS messes (
  id              SERIAL PRIMARY KEY,
  owner_id        INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  mess_name       VARCHAR(150) NOT NULL,
  address         TEXT,
  cuisine_type    VARCHAR(100),
  meal_preference VARCHAR(100),
  pricing         JSONB DEFAULT '{}'::jsonb,
  timings         JSONB DEFAULT '{}'::jsonb,
  home_delivery   BOOLEAN DEFAULT FALSE,
  status          VARCHAR(30) NOT NULL DEFAULT 'Active'
                    CHECK (status IN ('Active', 'Blocked', 'active', 'blocked')),
  latitude        NUMERIC(9, 6),
  longitude       NUMERIC(9, 6),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tickets / Support table
CREATE TABLE IF NOT EXISTS tickets (
  id          SERIAL PRIMARY KEY,
  ticket_id   VARCHAR(20) UNIQUE NOT NULL,
  user_name   VARCHAR(255),
  mess_name   VARCHAR(150),
  category    VARCHAR(100) DEFAULT 'General',
  subject     VARCHAR(255) NOT NULL,
  description TEXT,
  status      VARCHAR(30) NOT NULL DEFAULT 'Open'
                CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
  priority    VARCHAR(20) DEFAULT 'Medium',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER REFERENCES users(id) ON DELETE CASCADE,
  user_name         VARCHAR(255),
  user_phone        VARCHAR(50),
  user_email        VARCHAR(255),
  mess_name         VARCHAR(255),
  plan_duration     VARCHAR(100),
  meals             VARCHAR(255),
  delivery_type     VARCHAR(100),
  total_amount      NUMERIC(10, 2),
  payment_method    VARCHAR(50),
  expiry_date       TIMESTAMPTZ,
  status            VARCHAR(30) DEFAULT 'ACTIVE'
                      CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED', 'active', 'paused', 'cancelled', 'expired')),
  pause_start_date  DATE,
  pause_end_date    DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Payments table
CREATE TABLE IF NOT EXISTS payments (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER REFERENCES users(id) ON DELETE CASCADE,
  mess_name           VARCHAR(150),
  amount              NUMERIC(10, 2),
  currency            VARCHAR(10) DEFAULT 'INR',
  razorpay_order_id   VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  razorpay_signature  VARCHAR(255),
  status              VARCHAR(50) DEFAULT 'created'
                        CHECK (status IN ('created', 'success', 'failed')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_name   VARCHAR(255),
  mess_name   VARCHAR(255),
  rating      INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Create default admin account
-- Password below is: password  (bcrypt hash)
INSERT INTO users (name, email, phone, role, address, password, status)
VALUES (
  'Admin',
  'admin@grubspot.com',
  '+91 9999999999',
  'admin',
  'Bengaluru',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Active'
)
ON CONFLICT (email) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_messes_owner_id ON messes(owner_id);
CREATE INDEX IF NOT EXISTS idx_messes_mess_name ON messes(mess_name);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_id ON tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_mess_name ON tickets(mess_name);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_mess_name ON subscriptions(mess_name);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_mess_name ON reviews(mess_name);
