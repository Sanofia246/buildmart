const pool = require('../config/database');

const getMyPlan = async (req, res) => {
  try {
    const sup = await pool.query('SELECT plan_id FROM suppliers WHERE user_id = $1', [req.user.userId]);
    if (!sup.rows[0]) return res.status(404).json({ success: false, message: 'Supplier not found' });
    
    if (!sup.rows[0].plan_id) return res.json({ success: true, data: null });
    
    const plan = await pool.query('SELECT * FROM plans WHERE id = $1', [sup.rows[0].plan_id]);
    res.json({ success: true, data: plan.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const upgradePlan = async (req, res) => {
  try {
    const { plan_id } = req.body;
    const sup = await pool.query('SELECT id FROM suppliers WHERE user_id = $1', [req.user.userId]);
    if (!sup.rows[0]) return res.status(404).json({ success: false, message: 'Supplier not found' });
    
    await pool.query('UPDATE suppliers SET plan_id = $1, updated_at = NOW() WHERE id = $2', [plan_id, sup.rows[0].id]);
    res.json({ success: true, message: 'Plan upgraded successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const uploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    
    const sup = await pool.query('SELECT id FROM suppliers WHERE user_id = $1', [req.user.userId]);
    if (!sup.rows[0]) return res.status(404).json({ success: false, message: 'Supplier not found' });
    
    // In a real app, you'd upload to S3/cloud storage and get a URL
    // For now, return a placeholder
    const logoUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    await pool.query('UPDATE suppliers SET logo_url = $1, updated_at = NOW() WHERE id = $2', [logoUrl, sup.rows[0].id]);
    res.json({ success: true, message: 'Logo uploaded', data: { logo_url: logoUrl } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const uploadBanner = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    
    const sup = await pool.query('SELECT id FROM suppliers WHERE user_id = $1', [req.user.userId]);
    if (!sup.rows[0]) return res.status(404).json({ success: false, message: 'Supplier not found' });
    
    const bannerUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    await pool.query('UPDATE suppliers SET banner_url = $1, updated_at = NOW() WHERE id = $2', [bannerUrl, sup.rows[0].id]);
    res.json({ success: true, message: 'Banner uploaded', data: { banner_url: bannerUrl } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getProductImages = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await pool.query('SELECT * FROM product_images WHERE product_id = $1 ORDER BY created_at DESC', [productId]);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const uploadProductImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: 'No files uploaded' });
    
    const { productId } = req.params;
    const images = [];
    
    for (const file of req.files) {
      const imageUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const result = await pool.query(
        'INSERT INTO product_images (product_id, image_url) VALUES ($1, $2) RETURNING *',
        [productId, imageUrl]
      );
      images.push(result.rows[0]);
    }
    
    res.status(201).json({ success: true, message: 'Images uploaded', data: images });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const deleteProductImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    await pool.query('DELETE FROM product_images WHERE id = $1', [imageId]);
    res.json({ success: true, message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getVendorOrders = async (req, res) => {
  try {
    const sup = await pool.query('SELECT id FROM suppliers WHERE user_id = $1', [req.user.userId]);
    if (!sup.rows[0]) return res.json({ success: true, data: [] });
    
    const result = await pool.query(`
      SELECT o.*, p.name as product_name
      FROM orders o
      LEFT JOIN products p ON p.id = o.product_id
      WHERE o.supplier_id = $1
      ORDER BY o.created_at DESC
    `, [sup.rows[0].id]);
    
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createOrder = async (req, res) => {
  try {
    const { supplier_id, product_id, quantity, unit, buyer_name, buyer_email, buyer_phone, message } = req.body;
    if (!supplier_id || !quantity) return res.status(400).json({ success: false, message: 'Missing required fields' });
    
    const result = await pool.query(`
      INSERT INTO orders (supplier_id, product_id, buyer_id, quantity, unit, buyer_name, buyer_email, buyer_phone, message)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `, [supplier_id, product_id || null, req.user?.userId || null, quantity, unit, buyer_name, buyer_email, buyer_phone, message]);
    
    res.status(201).json({ success: true, message: 'Order created', data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    await pool.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', [status, id]);
    res.json({ success: true, message: 'Order status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getMyPlan, upgradePlan,
  uploadLogo, uploadBanner,
  getProductImages, uploadProductImages, deleteProductImage,
  getVendorOrders, createOrder, updateOrderStatus,
};
