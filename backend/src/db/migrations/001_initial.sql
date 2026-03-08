-- SureLink WiFi Manager — initial schema
-- Run with: psql $DATABASE_URL -f src/db/migrations/001_initial.sql

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'attendant',
  permissions VARCHAR(50) NOT NULL DEFAULT 'entry',  -- 'entry' | 'all'
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  week INTEGER,
  attendant_id INTEGER REFERENCES users(id),
  total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0,
  revenue_sources JSONB DEFAULT '{}',
  notes TEXT,
  downtime BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  sale_id INTEGER REFERENCES sales(id),
  description VARCHAR(500),
  category VARCHAR(100),
  subcategory VARCHAR(100),
  amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vouchers (
  id SERIAL PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  package_id INTEGER,
  package_name VARCHAR(255),
  price DECIMAL(12,2),
  duration_minutes INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'unused',  -- unused | sold
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  value DECIMAL(12,2),
  source VARCHAR(255),
  status VARCHAR(50),
  date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_log (
  id SERIAL PRIMARY KEY,
  action VARCHAR(255) NOT NULL,
  details JSONB,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date);
CREATE INDEX IF NOT EXISTS idx_sales_attendant ON sales(attendant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_sale ON expenses(sale_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_status ON vouchers(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
