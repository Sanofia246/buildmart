-- BuildMart Database Schema
-- Run this file to set up the database: psql -U postgres -d buildmart -f schema.sql

CREATE DATABASE buildmart;
\c buildmart;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'buyer' CHECK (role IN ('buyer', 'supplier', 'admin')),
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  icon VARCHAR(100),
  description TEXT,
  parent_id UUID REFERENCES categories(id),
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  gst_number VARCHAR(20),
  pan_number VARCHAR(20),
  established_year INTEGER,
  logo_url TEXT,
  banner_url TEXT,
  website_url TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city VARCHAR(100),
  district VARCHAR(100),
  state VARCHAR(100) DEFAULT 'Tamil Nadu',
  pincode VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  total_reviews INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0,
  response_rate INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Supplier categories (many-to-many)
CREATE TABLE IF NOT EXISTS supplier_categories (
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (supplier_id, category_id)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255),
  description TEXT,
  specifications JSONB,
  price_min DECIMAL(12, 2),
  price_max DECIMAL(12, 2),
  price_unit VARCHAR(50),
  min_order_quantity INTEGER DEFAULT 1,
  min_order_unit VARCHAR(50),
  images JSONB DEFAULT '[]',
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(255),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0,
  images JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(supplier_id, user_id)
);

-- Inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES users(id),
  product_id UUID REFERENCES products(id),
  buyer_name VARCHAR(255) NOT NULL,
  buyer_email VARCHAR(255) NOT NULL,
  buyer_phone VARCHAR(20) NOT NULL,
  buyer_company VARCHAR(255),
  message TEXT NOT NULL,
  quantity VARCHAR(100),
  unit VARCHAR(50),
  requirement_type VARCHAR(50) DEFAULT 'one-time' CHECK (requirement_type IN ('one-time', 'recurring', 'bulk')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'responded', 'closed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Saved/Wishlist suppliers
CREATE TABLE IF NOT EXISTS saved_suppliers (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, supplier_id)
);

-- Supplier certifications
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  issuing_body VARCHAR(255),
  certificate_number VARCHAR(100),
  valid_until DATE,
  document_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Advertisements / Banners
CREATE TABLE IF NOT EXISTS advertisements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id),
  title VARCHAR(255),
  image_url TEXT NOT NULL,
  link_url TEXT,
  position VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit log for views
CREATE TABLE IF NOT EXISTS supplier_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
  viewer_ip VARCHAR(45),
  viewed_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_suppliers_city ON suppliers(city);
CREATE INDEX idx_suppliers_district ON suppliers(district);
CREATE INDEX idx_suppliers_rating ON suppliers(average_rating DESC);
CREATE INDEX idx_suppliers_verified ON suppliers(is_verified);
CREATE INDEX idx_suppliers_premium ON suppliers(is_premium);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_reviews_supplier ON reviews(supplier_id);
CREATE INDEX idx_inquiries_supplier ON inquiries(supplier_id);
CREATE INDEX idx_inquiries_buyer ON inquiries(buyer_id);

-- Function to update supplier rating
CREATE OR REPLACE FUNCTION update_supplier_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE suppliers SET
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE supplier_id = NEW.supplier_id),
    average_rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE supplier_id = NEW.supplier_id),
    updated_at = NOW()
  WHERE id = NEW.supplier_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_supplier_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_supplier_rating();

-- Seed categories
INSERT INTO categories (name, slug, icon, description) VALUES
  ('Cement & Concrete', 'cement-concrete', '🏗️', 'Portland cement, fly ash, ready mix concrete, mortar'),
  ('Steel & Iron', 'steel-iron', '⚙️', 'TMT bars, MS pipes, steel plates, angle iron, channels'),
  ('Bricks & Blocks', 'bricks-blocks', '🧱', 'Red bricks, hollow blocks, AAC blocks, fly ash bricks'),
  ('Sand & Aggregates', 'sand-aggregates', '⛏️', 'River sand, M-sand, coarse aggregate, gravel, quarry dust'),
  ('Roofing Materials', 'roofing-materials', '🏠', 'Roofing sheets, tiles, waterproofing, insulation'),
  ('Tiles & Flooring', 'tiles-flooring', '🪨', 'Ceramic tiles, vitrified tiles, granite, marble, flooring'),
  ('Pipes & Plumbing', 'pipes-plumbing', '🔧', 'PVC pipes, CPVC, GI pipes, fittings, valves'),
  ('Electrical Materials', 'electrical-materials', '⚡', 'Wires, cables, switches, conduits, panels'),
  ('Wood & Timber', 'wood-timber', '🪵', 'Teak, plywood, MDF, particle board, doors'),
  ('Paints & Chemicals', 'paints-chemicals', '🎨', 'Interior paints, exterior paints, waterproofing chemicals'),
  ('Glass & Aluminium', 'glass-aluminium', '🪟', 'Float glass, toughened glass, aluminium sections, UPVC'),
  ('Hardware & Fasteners', 'hardware-fasteners', '🔩', 'Nuts, bolts, screws, anchors, construction tools')
ON CONFLICT (slug) DO NOTHING;

-- Seed admin user (password: Admin@123)
INSERT INTO users (name, email, phone, password_hash, role, is_verified) VALUES
  ('BuildMart Admin', 'admin@buildmart.in', '9999999999', '$2a$10$rQnm8XEoXJ7q.u6ZiH5mXOQz9wJYu2.zYpx5Gj5c.xK3G5L9Nm6Gy', 'admin', true)
ON CONFLICT (email) DO NOTHING;

COMMIT;
