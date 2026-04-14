const pool = require('../config/database');

const getDashboardStats = async (req, res) => {
  try {
    const [suppliers, users, reviews, inquiries, orders] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM suppliers WHERE is_active=true'),
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM reviews'),
      pool.query('SELECT COUNT(*) FROM inquiries'),
      pool.query('SELECT COUNT(*) FROM orders'),
    ]);
    res.json({
      success: true,
      data: {
        total_suppliers: parseInt(suppliers.rows[0].count),
        total_users: parseInt(users.rows[0].count),
        total_reviews: parseInt(reviews.rows[0].count),
        total_inquiries: parseInt(inquiries.rows[0].count),
        total_orders: parseInt(orders.rows[0].count),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAllSuppliers = async (req, res) => {
  try {
    const { page = 1, limit = 20, verified, premium, active } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    if (verified === 'true') conditions.push('is_verified=true');
    if (premium === 'true') conditions.push('is_premium=true');
    if (active === 'false') conditions.push('is_active=false');
    
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(`SELECT * FROM suppliers ${where} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    const count = await pool.query(`SELECT COUNT(*) FROM suppliers ${where}`);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(count.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const toggleSupplierVerified = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE suppliers SET is_verified = NOT is_verified WHERE id = $1', [id]);
    res.json({ success: true, message: 'Supplier verification status toggled' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const toggleSupplierPremium = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE suppliers SET is_premium = NOT is_premium WHERE id = $1', [id]);
    res.json({ success: true, message: 'Supplier premium status toggled' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const toggleSupplierActive = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE suppliers SET is_active = NOT is_active WHERE id = $1', [id]);
    res.json({ success: true, message: 'Supplier active status toggled' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const assignPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan_id } = req.body;
    await pool.query('UPDATE suppliers SET plan_id = $1, updated_at = NOW() WHERE id = $2', [plan_id, id]);
    res.json({ success: true, message: 'Plan assigned successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const result = await pool.query('SELECT id, name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
    const count = await pool.query('SELECT COUNT(*) FROM users');
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(count.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const toggleUserActive = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE users SET is_active = NOT is_active WHERE id = $1', [id]);
    res.json({ success: true, message: 'User active status toggled' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const result = await pool.query(`
      SELECT r.*, u.name as reviewer_name, s.business_name
      FROM reviews r
      JOIN users u ON u.id = r.user_id
      JOIN suppliers s ON s.id = r.supplier_id
      ORDER BY r.created_at DESC LIMIT $1 OFFSET $2
    `, [limit, offset]);
    const count = await pool.query('SELECT COUNT(*) FROM reviews');
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(count.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM reviews WHERE id = $1', [id]);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAllInquiries = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    const where = status ? 'WHERE status = $3' : '';
    const params = status ? [limit, offset, status] : [limit, offset];
    
    const result = await pool.query(`
      SELECT i.*, p.name as product_name, s.business_name
      FROM inquiries i
      LEFT JOIN products p ON p.id = i.product_id
      JOIN suppliers s ON s.id = i.supplier_id
      ${where}
      ORDER BY i.created_at DESC LIMIT $1 OFFSET $2
    `, params);
    const count = await pool.query(`SELECT COUNT(*) FROM inquiries ${where}`, status ? [status] : []);
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(count.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const result = await pool.query(`
      SELECT o.*, s.business_name
      FROM orders o
      JOIN suppliers s ON s.id = o.supplier_id
      ORDER BY o.created_at DESC LIMIT $1 OFFSET $2
    `, [limit, offset]);
    const count = await pool.query('SELECT COUNT(*) FROM orders');
    
    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(count.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, icon, parent_id } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const result = await pool.query(
      'INSERT INTO categories (name, slug, description, icon, parent_id) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, slug, description, icon, parent_id || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, is_active } = req.body;
    const updates = [];
    const params = [];
    let idx = 1;
    
    if (name) { updates.push(`name = $${idx}`); params.push(name); idx++; }
    if (description) { updates.push(`description = $${idx}`); params.push(description); idx++; }
    if (icon) { updates.push(`icon = $${idx}`); params.push(icon); idx++; }
    if (is_active !== undefined) { updates.push(`is_active = $${idx}`); params.push(is_active); idx++; }
    
    if (updates.length) {
      await pool.query(`UPDATE categories SET ${updates.join(', ')} WHERE id = $${idx}`, [...params, id]);
    }
    
    res.json({ success: true, message: 'Category updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPlans = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM plans WHERE is_active = true ORDER BY id');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, is_active } = req.body;
    const updates = [];
    const params = [];
    let idx = 1;
    
    if (name) { updates.push(`name = $${idx}`); params.push(name); idx++; }
    if (description) { updates.push(`description = $${idx}`); params.push(description); idx++; }
    if (price !== undefined) { updates.push(`price = $${idx}`); params.push(price); idx++; }
    if (is_active !== undefined) { updates.push(`is_active = $${idx}`); params.push(is_active); idx++; }
    
    if (updates.length) {
      await pool.query(`UPDATE plans SET ${updates.join(', ')} WHERE id = $${idx}`, [...params, id]);
    }
    
    res.json({ success: true, message: 'Plan updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  getAllSuppliers, toggleSupplierVerified, toggleSupplierPremium, toggleSupplierActive, assignPlan,
  getAllUsers, toggleUserActive,
  getAllReviews, deleteReview,
  getAllInquiries, getAllOrders,
  createCategory, updateCategory,
  getPlans, updatePlan,
};
