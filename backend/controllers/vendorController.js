const pool = require('../config/database');
const { getFileUrl } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// ── PRODUCT IMAGE UPLOAD ────────────────────────────────────
const uploadProductImages = async (req, res) => {
  try {
    const { productId } = req.params;
    const sup = await pool.query('SELECT id FROM suppliers WHERE user_id=$1', [req.user.id]);
    if (!sup.rows[0]) return res.status(403).json({ success: false, message: 'Access denied' });

    // Check product belongs to supplier
    const prod = await pool.query('SELECT id FROM products WHERE id=$1 AND supplier_id=$2', [productId, sup.rows[0].id]);
    if (!prod.rows[0]) return res.status(404).json({ success: false, message: 'Product not found' });

    // Check plan limits
    const planCheck = await pool.query(`
      SELECT pp.max_images_per_product FROM suppliers s JOIN pricing_plans pp ON pp.id=s.plan_id WHERE s.id=$1
    `, [sup.rows[0].id]);
    const maxImages = planCheck.rows[0]?.max_images_per_product || 2;
    const existing = await pool.query('SELECT COUNT(*) FROM product_images WHERE product_id=$1', [productId]);
    if (parseInt(existing.rows[0].count) + req.files.length > maxImages) {
      return res.status(400).json({ success: false, message: `Your plan allows max ${maxImages} images per product. Upgrade to add more.` });
    }

    const urls = [];
    for (const file of req.files) {
      const url = `/uploads/products/${file.filename}`;
      await pool.query('INSERT INTO product_images (product_id, url, sort_order) VALUES ($1,$2,$3)', [productId, url, parseInt(existing.rows[0].count) + urls.length]);
      urls.push(url);
    }

    // Update product images JSON field
    const allImages = await pool.query('SELECT url FROM product_images WHERE product_id=$1 ORDER BY sort_order', [productId]);
    await pool.query('UPDATE products SET images=$1, updated_at=NOW() WHERE id=$2', [JSON.stringify(allImages.rows.map(r => r.url)), productId]);

    res.json({ success: true, message: `${urls.length} image(s) uploaded`, data: urls });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

const deleteProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const sup = await pool.query('SELECT id FROM suppliers WHERE user_id=$1', [req.user.id]);
    const img = await pool.query('SELECT pi.*, p.supplier_id FROM product_images pi JOIN products p ON p.id=pi.product_id WHERE pi.id=$1', [imageId]);
    if (!img.rows[0] || img.rows[0].supplier_id !== sup.rows[0]?.id) return res.status(403).json({ success: false, message: 'Access denied' });

    // Delete file
    const filePath = path.join(__dirname, '..', img.rows[0].url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await pool.query('DELETE FROM product_images WHERE id=$1', [imageId]);
    res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
};

// ── LOGO / BANNER UPLOAD ────────────────────────────────────
const uploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const url = `/uploads/logos/${req.file.filename}`;
    const sup = await pool.query('UPDATE suppliers SET logo_url=$1, updated_at=NOW() WHERE user_id=$2 RETURNING logo_url', [url, req.user.id]);
    res.json({ success: true, data: { url: sup.rows[0]?.logo_url } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

const uploadBanner = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const url = `/uploads/banners/${req.file.filename}`;
    await pool.query('UPDATE suppliers SET banner_url=$1, updated_at=NOW() WHERE user_id=$2', [url, req.user.id]);
    res.json({ success: true, data: { url } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
};

// ── ORDERS ──────────────────────────────────────────────────
const getVendorOrders = async (req, res) => {
  try {
    const sup = await pool.query('SELECT id FROM suppliers WHERE user_id=$1', [req.user.id]);
    if (!sup.rows[0]) return res.json({ success: true, data: [] });

    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE o.supplier_id=$1';
    let params = [sup.rows[0].id];
    if (status) { where += ' AND o.status=$2'; params.push(status); }

    const result = await pool.query(`
      SELECT o.*, 
        json_agg(json_build_object('id', oi.id, 'product_name', oi.product_name, 'quantity', oi.quantity, 'unit', oi.unit, 'unit_price', oi.unit_price, 'total_price', oi.total_price)) as items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      ${where}
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT $${params.length+1} OFFSET $${params.length+2}
    `, [...params, limit, offset]);

    const count = await pool.query(`SELECT COUNT(*) FROM orders ${where}`, params.slice(0, params.length - (status ? 0 : 0)));
    res.json({ success: true, data: result.rows, pagination: { total: parseInt(count.rows[0].count) } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createOrder = async (req, res) => {
  try {
    const { supplier_id, buyer_name, buyer_email, buyer_phone, buyer_address, items, notes, delivery_date } = req.body;
    if (!items?.length) return res.status(400).json({ success: false, message: 'Order must have at least one item' });

    const orderNumber = 'BM' + Date.now().toString().slice(-8);
    const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.unit_price || 0) * parseFloat(item.quantity || 0)), 0);

    const order = await pool.query(`
      INSERT INTO orders (order_number, supplier_id, buyer_id, buyer_name, buyer_email, buyer_phone, buyer_address, total_amount, notes, delivery_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [orderNumber, supplier_id, req.user?.id || null, buyer_name, buyer_email, buyer_phone, buyer_address, totalAmount, notes, delivery_date || null]);

    for (const item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit, unit_price, total_price) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [order.rows[0].id, item.product_id || null, item.product_name, item.quantity, item.unit, item.unit_price, parseFloat(item.unit_price || 0) * parseFloat(item.quantity || 0)]
      );
    }

    res.status(201).json({ success: true, message: 'Order created', data: order.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const sup = await pool.query('SELECT id FROM suppliers WHERE user_id=$1', [req.user.id]);
    await pool.query('UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 AND supplier_id=$3', [status, id, sup.rows[0]?.id]);
    res.json({ success: true, message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ── SUBSCRIPTION / PLAN ─────────────────────────────────────
const getMyPlan = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.plan_id, s.plan_expires_at, s.is_premium, pp.*
      FROM suppliers s LEFT JOIN pricing_plans pp ON pp.id=s.plan_id
      WHERE s.user_id=$1
    `, [req.user.id]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const upgradePlan = async (req, res) => {
  try {
    const { plan_slug, billing_cycle = 'monthly', payment_reference } = req.body;
    const plan = await pool.query('SELECT * FROM pricing_plans WHERE slug=$1', [plan_slug]);
    if (!plan.rows[0]) return res.status(404).json({ success: false, message: 'Plan not found' });
    const p = plan.rows[0];

    const sup = await pool.query('SELECT id FROM suppliers WHERE user_id=$1', [req.user.id]);
    if (!sup.rows[0]) return res.status(404).json({ success: false, message: 'Supplier profile not found' });

    const months = billing_cycle === 'yearly' ? 12 : 1;
    const amount = billing_cycle === 'yearly' ? p.price_yearly : p.price_monthly;
    const expires = new Date(); expires.setMonth(expires.getMonth() + months);

    await pool.query(
      'UPDATE suppliers SET plan_id=$1, plan_expires_at=$2, is_premium=$3, updated_at=NOW() WHERE id=$4',
      [p.id, expires, p.slug !== 'free', sup.rows[0].id]
    );

    await pool.query(
      'INSERT INTO subscriptions (supplier_id, plan_id, billing_cycle, expires_at, amount_paid, payment_reference) VALUES ($1,$2,$3,$4,$5,$6)',
      [sup.rows[0].id, p.id, billing_cycle, expires, amount, payment_reference || 'manual']
    );

    await pool.query(
      'INSERT INTO payment_transactions (supplier_id, plan_id, amount, status, payment_method) VALUES ($1,$2,$3,\'success\',\'online\')',
      [sup.rows[0].id, p.id, amount]
    );

    res.json({ success: true, message: `Upgraded to ${p.name} plan successfully!`, data: { plan: p.name, expires_at: expires } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getProductImages = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM product_images WHERE product_id=$1 ORDER BY sort_order', [req.params.productId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  uploadProductImages, deleteProductImage, uploadLogo, uploadBanner,
  getVendorOrders, createOrder, updateOrderStatus,
  getMyPlan, upgradePlan, getProductImages,
};
