const pool = require('../config/database');

// ── CATEGORIES ──────────────────────────────────────────────
const getCategories = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, COUNT(DISTINCT sc.supplier_id) as supplier_count
      FROM categories c
      LEFT JOIN supplier_categories sc ON sc.category_id = c.id
      WHERE c.is_active = true AND c.parent_id IS NULL
      GROUP BY c.id ORDER BY c.name
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── PRODUCTS ────────────────────────────────────────────────
const getSupplierProducts = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const result = await pool.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.supplier_id = $1 AND p.is_available = true ORDER BY p.created_at DESC',
      [supplierId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createProduct = async (req, res) => {
  try {
    const sup = await pool.query('SELECT id FROM suppliers WHERE user_id = $1', [req.user.id]);
    if (!sup.rows[0]) return res.status(404).json({ success: false, message: 'Supplier profile not found' });

    const { name, description, category_id, price_min, price_max, price_unit, min_order_quantity, min_order_unit, specifications } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const result = await pool.query(`
      INSERT INTO products (supplier_id, category_id, name, slug, description, price_min, price_max, price_unit, min_order_quantity, min_order_unit, specifications)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [sup.rows[0].id, category_id, name, slug, description, price_min, price_max, price_unit, min_order_quantity, min_order_unit, specifications ? JSON.stringify(specifications) : null]);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sup = await pool.query('SELECT id FROM suppliers WHERE user_id = $1', [req.user.id]);
    if (!sup.rows[0]) return res.status(403).json({ success: false, message: 'Access denied' });

    const fields = ['name', 'description', 'price_min', 'price_max', 'price_unit', 'min_order_quantity', 'is_available'];
    const updates = []; const params = []; let idx = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) { updates.push(`${f} = $${idx}`); params.push(req.body[f]); idx++; }
    }
    if (!updates.length) return res.json({ success: true, message: 'Nothing to update' });
    updates.push('updated_at = NOW()');
    await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = $${idx} AND supplier_id = $${idx + 1}`, [...params, id, sup.rows[0].id]);
    res.json({ success: true, message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const sup = await pool.query('SELECT id FROM suppliers WHERE user_id = $1', [req.user.id]);
    await pool.query('DELETE FROM products WHERE id = $1 AND supplier_id = $2', [id, sup.rows[0].id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getMyProducts = async (req, res) => {
  try {
    const sup = await pool.query('SELECT id FROM suppliers WHERE user_id = $1', [req.user.id]);
    if (!sup.rows[0]) return res.json({ success: true, data: [] });
    const result = await pool.query('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.supplier_id = $1 ORDER BY p.created_at DESC', [sup.rows[0].id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── REVIEWS ─────────────────────────────────────────────────
const createReview = async (req, res) => {
  try {
    const { supplier_id, rating, title, comment } = req.body;
    if (!supplier_id || !rating) return res.status(400).json({ success: false, message: 'Missing required fields' });
    const result = await pool.query(
      'INSERT INTO reviews (supplier_id, user_id, rating, title, comment) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (supplier_id, user_id) DO UPDATE SET rating=$3, title=$4, comment=$5, updated_at=NOW() RETURNING *',
      [supplier_id, req.user.id, rating, title, comment]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSupplierReviews = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const result = await pool.query(`
      SELECT r.*, u.name as reviewer_name, u.avatar_url
      FROM reviews r JOIN users u ON u.id = r.user_id
      WHERE r.supplier_id = $1
      ORDER BY r.created_at DESC LIMIT $2 OFFSET $3
    `, [supplierId, limit, offset]);
    const count = await pool.query('SELECT COUNT(*) FROM reviews WHERE supplier_id = $1', [supplierId]);
    res.json({ success: true, data: result.rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── INQUIRIES ───────────────────────────────────────────────
const createInquiry = async (req, res) => {
  try {
    const { supplier_id, product_id, buyer_name, buyer_email, buyer_phone, buyer_company, message, quantity, unit, requirement_type } = req.body;
    if (!supplier_id || !buyer_name || !buyer_email || !buyer_phone || !message)
      return res.status(400).json({ success: false, message: 'Missing required fields' });

    const result = await pool.query(`
      INSERT INTO inquiries (supplier_id, buyer_id, product_id, buyer_name, buyer_email, buyer_phone, buyer_company, message, quantity, unit, requirement_type)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *
    `, [supplier_id, req.user?.id || null, product_id || null, buyer_name, buyer_email, buyer_phone, buyer_company, message, quantity, unit, requirement_type || 'one-time']);

    res.status(201).json({ success: true, message: 'Inquiry sent successfully', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getMyInquiries = async (req, res) => {
  try {
    const sup = await pool.query('SELECT id FROM suppliers WHERE user_id = $1', [req.user.id]);
    if (!sup.rows[0]) return res.json({ success: true, data: [] });
    const result = await pool.query(`
      SELECT i.*, p.name as product_name
      FROM inquiries i LEFT JOIN products p ON p.id = i.product_id
      WHERE i.supplier_id = $1 ORDER BY i.created_at DESC
    `, [sup.rows[0].id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const sup = await pool.query('SELECT id FROM suppliers WHERE user_id = $1', [req.user.id]);
    await pool.query('UPDATE inquiries SET status = $1, updated_at = NOW() WHERE id = $2 AND supplier_id = $3', [status, id, sup.rows[0].id]);
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── SAVED SUPPLIERS ─────────────────────────────────────────
const saveSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    await pool.query('INSERT INTO saved_suppliers (user_id, supplier_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user.id, supplierId]);
    res.json({ success: true, message: 'Supplier saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const unsaveSupplier = async (req, res) => {
  try {
    const { supplierId } = req.params;
    await pool.query('DELETE FROM saved_suppliers WHERE user_id = $1 AND supplier_id = $2', [req.user.id, supplierId]);
    res.json({ success: true, message: 'Supplier removed from saved' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSavedSuppliers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.business_name, s.slug, s.city, s.district, s.logo_url, s.average_rating, s.total_reviews, s.is_verified, ss.created_at as saved_at
      FROM saved_suppliers ss JOIN suppliers s ON s.id = ss.supplier_id
      WHERE ss.user_id = $1 ORDER BY ss.created_at DESC
    `, [req.user.id]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── SEARCH ──────────────────────────────────────────────────
const globalSearch = async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, data: { suppliers: [], categories: [] } });

    const [suppliers, categories] = await Promise.all([
      pool.query(`SELECT id, business_name, slug, city, logo_url FROM suppliers WHERE is_active=true AND (business_name ILIKE $1 OR city ILIKE $1) ORDER BY is_premium DESC, average_rating DESC LIMIT $2`, [`%${q}%`, limit]),
      pool.query(`SELECT id, name, slug, icon FROM categories WHERE is_active=true AND name ILIKE $1 LIMIT $2`, [`%${q}%`, limit]),
    ]);

    res.json({ success: true, data: { suppliers: suppliers.rows, categories: categories.rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── CITIES ──────────────────────────────────────────────────
const getCities = async (req, res) => {
  try {
    const result = await pool.query(`SELECT DISTINCT city, district, COUNT(*) as count FROM suppliers WHERE is_active=true AND city IS NOT NULL GROUP BY city, district ORDER BY count DESC LIMIT 30`);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getCategories,
  getSupplierProducts, createProduct, updateProduct, deleteProduct, getMyProducts,
  createReview, getSupplierReviews,
  createInquiry, getMyInquiries, updateInquiryStatus,
  saveSupplier, unsaveSupplier, getSavedSuppliers,
  globalSearch, getCities
};
