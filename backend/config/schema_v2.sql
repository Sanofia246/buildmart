-- BuildMart v2 Schema — SaaS + Pricing + Orders + Image Uploads
-- Run: psql -U postgres -d buildmart -f schema_v2.sql

-- Pricing plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,           -- free, pro, enterprise
  slug VARCHAR(50) UNIQUE NOT NULL,
  price_monthly DECIMAL(10,2) DEFAULT 0,
  price_yearly DECIMAL(10,2) DEFAULT 0,
  max_products INTEGER DEFAULT 5,
  max_images_per_product INTEGER DEFAULT 2,
  featured_listing BOOLEAN DEFAULT FALSE,
  priority_ranking INTEGER DEFAULT 0,  -- higher = better placement
  analytics_dashboard BOOLEAN DEFAULT FALSE,
  unlimited_leads BOOLEAN DEFAULT FALSE,
  verified_badge BOOLEAN DEFAULT FALSE,
  response_support VARCHAR(50) DEFAULT 'email',
  color VARCHAR(20) DEFAULT 'gray',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vendor subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES pricing_plans(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','expired','cancelled','trial')),
  billing_cycle VARCHAR(10) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','yearly')),
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  payment_reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Product images (separate table for multi-image support)
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  buyer_id UUID REFERENCES users(id),
  buyer_name VARCHAR(255) NOT NULL,
  buyer_email VARCHAR(255) NOT NULL,
  buyer_phone VARCHAR(20) NOT NULL,
  buyer_address TEXT,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  total_amount DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  delivery_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(12,2) NOT NULL,
  unit VARCHAR(50),
  unit_price DECIMAL(12,2),
  total_price DECIMAL(12,2),
  notes TEXT
);

-- Admin notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id),
  plan_id UUID REFERENCES pricing_plans(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(5) DEFAULT 'INR',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','success','failed','refunded')),
  payment_method VARCHAR(50),
  razorpay_order_id VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alter products table to support more fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_available BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Alter suppliers to link plan
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES pricing_plans(id);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0;

-- Seed pricing plans
INSERT INTO pricing_plans (name, slug, price_monthly, price_yearly, max_products, max_images_per_product, featured_listing, priority_ranking, analytics_dashboard, unlimited_leads, verified_badge, response_support, color, sort_order) VALUES
  ('Free', 'free', 0, 0, 5, 2, false, 0, false, false, false, 'Email only', 'gray', 1),
  ('Pro', 'pro', 999, 9990, 50, 5, true, 10, false, false, true, 'Email + Phone', 'blue', 2),
  ('Enterprise', 'enterprise', 2999, 29990, 999999, 10, true, 20, true, true, true, '24/7 Dedicated', 'orange', 3)
ON CONFLICT (slug) DO UPDATE SET price_monthly = EXCLUDED.price_monthly, price_yearly = EXCLUDED.price_yearly;

-- Update existing suppliers to free plan
UPDATE suppliers SET plan_id = (SELECT id FROM pricing_plans WHERE slug = 'free') WHERE plan_id IS NULL;

COMMIT;
