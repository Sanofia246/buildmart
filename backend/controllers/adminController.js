const pool = require('../config/database');

// ── DASHBOARD STATS ─────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const [users, suppliers, inquiries, reviews, orders, revenue] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN created_at > NOW()-INTERVAL\'7 days\' THEN 1 END) as new_week FROM users'),
      pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN is_verified THEN 1 END) as verified, COUNT(CASE WHEN is_premium THEN 1 END) as premium FROM suppliers WHERE is_active=true'),
      pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN status=\'pending\' THEN 1 END) as pending FROM inquiries'),
      pool.query('SELECT COUNT(*) as total, COALESCE(AVG(rating),0) as avg_rating FROM reviews'),
      pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN status=\'delivered\' THEN 1 END) as delivered FROM orders').catch(() => ({ rows: [{ total: 0, delivered: 0 }] })),
      pool.query('SELECT COALESCE(SUM(amount_paid),0) as total FROM subscriptions WHERE status=\'active\'').catch(() => ({ rows: [{ total: 0 }] })),
    ]);

    const recentSuppliers = await pool.query(`
      SELECT s.id, s.business_name, s.city, s.is_verified, s.created_at, u.email, u.name as owner_name,
        pp.name as plan_name
      FROM suppliers s JOIN users u ON u.id=s.user_id
      LEFT JOIN pricing_plans pp ON pp.id=s.plan_id
      WHERE s.is_active=true ORDER BY s.created_at DESC LIMIT 5
    `);

    const recentInquiries = await pool.query(`
      SELECT i.*, s.business_name FROM inquiries i JOIN suppliers s ON s.id=i.supplier_id
      ORDER BY i.created_at DESC LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        stats: {
          users: { total: parseInt(users.rows[0].total), new_week: parseInt(users.rows[0].new_week) },
          suppliers: { total: parseInt(suppliers.rows[0].total), verified: parseInt(suppliers.rows[0].verified), premium: parseInt(suppliers.rows[0].premium) },
          inquiries: { total: parseInt(inquiries.rows[0].total), pending: parseInt(inquiries.rows[0].pending) },
          reviews: { total: parseInt(reviews.rows[0].total), avg_rating: parseFloat(reviews.rows[0].avg_rating).toFixed(1) },
          revenue: parseFloat(revenue.rows[0].total).toFixed(2),
        },
        recentSuppliers: recentSuppliers.rows,
        recentInquiries: recentInquiries.rows,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── ALL SUPPLIERS ───────────────────────────────────────────
const getAllSuppliers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, verified, plan } = req.query;
    const offset = (page - 1) * limit;
    let conditions = ['s.is_active = true'];
    let params = [];
    let idx = 1;

    if (search) { conditions.push(`(s.business_name ILIKE $${idx} OR u.email ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (verified === 'true') conditions.push('s.is_verified = true');
    if (verified === 'false') conditions.push('s.is_verified = false');
    if (plan) { conditions.push(`pp.slug = $${idx}`); params.push(plan); idx++; }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const result = await pool.query(`
      SELECT s.id, s.business_name, s.slug, s.city, s.district, s.is_verified, s.is_premium,
        s.average_rating, s.total_reviews, s.created_at, s.plan_expires_at,
        u.name as owner_name, u.email, u.phone,
        pp.name as plan_name, pp.slug as plan_slug
      FROM suppliers s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN pricing_plans pp ON pp.id = s.plan_id
      ${where}
      ORDER BY s.created_at DESC
      LIMIT $${idx} OFFSET $${idx+1}
    `, [...params, parseInt(limit), parseInt(offset)]);

    const count = await pool.query(`SELECT COUNT(DISTINCT s.id) FROM suppliers s JOIN users u ON u.id=s.user_id LEFT JOIN pricing_plans pp ON pp.id=s.plan_id ${where}`, params);

    res.json({ success: true, data: result.rows, pagination: { total: parseInt(count.rows[0].count), page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count.rows[0].count / limit) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── VERIFY / TOGGLE SUPPLIER ────────────────────────────────
const toggleSupplierVerified = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('UPDATE suppliers SET is_verified = NOT is_verified, updated_at=NOW() WHERE id=$1 RETURNING is_verified, business_name', [id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: `${result.rows[0].business_name} ${result.rows[0].is_verified ? 'verified' : 'unverified'}`, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const toggleSupplierPremium = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('UPDATE suppliers SET is_premium = NOT is_premium, updated_at=NOW() WHERE id=$1 RETURNING is_premium, business_name', [id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const toggleSupplierActive = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('UPDATE suppliers SET is_active = NOT is_active, updated_at=NOW() WHERE id=$1 RETURNING is_active, business_name', [id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Assign plan to supplier
const assignPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan_slug, months = 1 } = req.body;
    const plan = await pool.query('SELECT * FROM pricing_plans WHERE slug=$1', [plan_slug]);
    if (!plan.rows[0]) return res.status(404).json({ success: false, message: 'Plan not found' });
    const p = plan.rows[0];
    const expires = new Date(); expires.setMonth(expires.getMonth() + parseInt(months));
    await pool.query(
      'UPDATE suppliers SET plan_id=$1, plan_expires_at=$2, is_premium=$3, updated_at=NOW() WHERE id=$4',
      [p.id, expires, p.slug !== 'free', id]
    );
    res.json({ success: true, message: `Plan ${p.name} assigned successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── ALL USERS ───────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let idx = 1;

    if (search) { conditions.push(`(name ILIKE $${idx} OR email ILIKE $${idx})`); params.push(`%${search}%`); idx++; }
    if (role) { conditions.push(`role = $${idx}`); params.push(role); idx++; }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(`SELECT id, name, email, phone, role, is_verified, is_active, created_at FROM users ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx+1}`, [...params, parseInt(limit), parseInt(offset)]);
    const count = await pool.query(`SELECT COUNT(*) FROM users ${where}`, params);

    res.json({ success: true, data: result.rows, pagination: { total: parseInt(count.rows[0].count), page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count.rows[0].count / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('UPDATE users SET is_active=NOT is_active WHERE id=$1 RETURNING is_active, name', [id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── REVIEWS MANAGEMENT ──────────────────────────────────────
const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const result = await pool.query(`
      SELECT r.*, u.name as reviewer_name, s.business_name
      FROM reviews r JOIN users u ON u.id=r.user_id JOIN suppliers s ON s.id=r.supplier_id
      ORDER BY r.created_at DESC LIMIT $1 OFFSET $2
    `, [limit, offset]);
    const count = await pool.query('SELECT COUNT(*) FROM reviews');
    res.json({ success: true, data: result.rows, pagination: { total: parseInt(count.rows[0].count) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteReview = async (req, res) => {
  try {
    await pool.query('DELETE FROM reviews WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── INQUIRIES MANAGEMENT ────────────────────────────────────
const getAllInquiries = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    let where = status ? `WHERE i.status=$1` : '';
    let params = status ? [status] : [];
    const result = await pool.query(`
      SELECT i.*, s.business_name FROM inquiries i JOIN suppliers s ON s.id=i.supplier_id
      ${where} ORDER BY i.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}
    `, [...params, limit, offset]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── CATEGORIES MANAGEMENT ───────────────────────────────────
const createCategory = async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const result = await pool.query('INSERT INTO categories (name, slug, icon, description) VALUES ($1,$2,$3,$4) RETURNING *', [name, slug, icon, description]);
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name, icon, description, is_active } = req.body;
    await pool.query('UPDATE categories SET name=COALESCE($1,name), icon=COALESCE($2,icon), description=COALESCE($3,description), is_active=COALESCE($4,is_active) WHERE id=$5', [name, icon, description, is_active, req.params.id]);
    res.json({ success: true, message: 'Category updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── PRICING PLANS MANAGEMENT ────────────────────────────────
const getPlans = async (req, res) => {
  try {
    const result = await pool.query('SELECT *, (SELECT COUNT(*) FROM suppliers WHERE plan_id=pricing_plans.id) as subscriber_count FROM pricing_plans ORDER BY sort_order');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updatePlan = async (req, res) => {
  try {
    const { price_monthly, price_yearly, max_products, max_images_per_product, featured_listing, analytics_dashboard, unlimited_leads, verified_badge } = req.body;
    await pool.query(
      'UPDATE pricing_plans SET price_monthly=$1, price_yearly=$2, max_products=$3, max_images_per_product=$4, featured_listing=$5, analytics_dashboard=$6, unlimited_leads=$7, verified_badge=$8 WHERE id=$9',
      [price_monthly, price_yearly, max_products, max_images_per_product, featured_listing, analytics_dashboard, unlimited_leads, verified_badge, req.params.id]
    );
    res.json({ success: true, message: 'Plan updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── ORDERS (Admin view) ────────────────────────────────────
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    let where = status ? `WHERE o.status=$1` : '';
    let params = status ? [status] : [];
    const result = await pool.query(`
      SELECT o.*, s.business_name FROM orders o LEFT JOIN suppliers s ON s.id=o.supplier_id
      ${where} ORDER BY o.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}
    `, [...params, limit, offset]).catch(() => ({ rows: [] }));
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats, getAllSuppliers, toggleSupplierVerified, toggleSupplierPremium,
  toggleSupplierActive, assignPlan, getAllUsers, toggleUserActive,
  getAllReviews, deleteReview, getAllInquiries,
  createCategory, updateCategory, getPlans, updatePlan, getAllOrders,
};
