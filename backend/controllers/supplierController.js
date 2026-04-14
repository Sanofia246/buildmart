const pool = require('../config/database');

const getSuppliers = async (req, res) => {
  try {
    const {
      page = 1, limit = 12, category, city, district, search,
      sort = 'rating', verified, premium, minRating
    } = req.query;
    const offset = (page - 1) * limit;
    let conditions = ['s.is_active = true'];
    let params = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`(s.business_name ILIKE $${paramIdx} OR s.description ILIKE $${paramIdx} OR s.city ILIKE $${paramIdx})`);
      params.push(`%${search}%`); paramIdx++;
    }
    if (city) { conditions.push(`s.city ILIKE $${paramIdx}`); params.push(`%${city}%`); paramIdx++; }
    if (district) { conditions.push(`s.district ILIKE $${paramIdx}`); params.push(`%${district}%`); paramIdx++; }
    if (verified === 'true') { conditions.push(`s.is_verified = true`); }
    if (premium === 'true') { conditions.push(`s.is_premium = true`); }
    if (minRating) { conditions.push(`s.average_rating >= $${paramIdx}`); params.push(parseFloat(minRating)); paramIdx++; }

    let categoryJoin = '';
    if (category) {
      categoryJoin = `JOIN supplier_categories sc ON sc.supplier_id = s.id JOIN categories c ON c.id = sc.category_id AND c.slug = $${paramIdx}`;
      params.push(category); paramIdx++;
    }

    const sortMap = {
      rating: 's.average_rating DESC, s.total_reviews DESC',
      reviews: 's.total_reviews DESC',
      newest: 's.created_at DESC',
      name: 's.business_name ASC',
    };
    const orderBy = sortMap[sort] || sortMap.rating;

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
      SELECT s.id, s.business_name, s.slug, s.description, s.city, s.district, s.state,
        s.logo_url, s.banner_url, s.is_verified, s.is_premium, s.average_rating, s.total_reviews,    
        s.response_rate, s.established_year,
        ARRAY_AGG(DISTINCT c2.name) FILTER (WHERE c2.name IS NOT NULL) as categories,
        ARRAY_AGG(DISTINCT c2.slug) FILTER (WHERE c2.slug IS NOT NULL) as category_slugs
      FROM suppliers s
      ${categoryJoin}
      LEFT JOIN supplier_categories sc2 ON sc2.supplier_id = s.id
      LEFT JOIN categories c2 ON c2.id = sc2.category_id
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.is_premium DESC, ${orderBy}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    params.push(parseInt(limit), parseInt(offset));

    const countQuery = `SELECT COUNT(DISTINCT s.id) FROM suppliers s ${categoryJoin} ${whereClause}`;
    const [result, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(countQuery, params.slice(0, paramIdx - 1))
    ]);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSupplierBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(`
      SELECT s.*, u.email, u.phone,
        ARRAY_AGG(DISTINCT jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug)) as categories
      FROM suppliers s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN supplier_categories sc ON sc.supplier_id = s.id
      LEFT JOIN categories c ON c.id = sc.category_id
      WHERE s.slug = $1 AND s.is_active = true
      GROUP BY s.id, u.email, u.phone
    `, [slug]);

    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Supplier not found' });

    // Track view
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    pool.query('INSERT INTO supplier_views (supplier_id, viewer_ip) VALUES ($1, $2)', [result.rows[0].id, ip]).catch(() => {});

    const products = await pool.query(
      'SELECT * FROM products WHERE supplier_id = $1 AND is_available = true ORDER BY created_at DESC LIMIT 20',
      [result.rows[0].id]
    );
    const reviews = await pool.query(`
      SELECT r.*, u.name as reviewer_name, u.avatar_url
      FROM reviews r JOIN users u ON u.id = r.user_id
      WHERE r.supplier_id = $1 ORDER BY r.created_at DESC LIMIT 10
    `, [result.rows[0].id]);
    const certs = await pool.query('SELECT * FROM certifications WHERE supplier_id = $1', [result.rows[0].id]);

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        products: products.rows,
        reviews: reviews.rows,
        certifications: certs.rows
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const createSupplierProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const existing = await pool.query('SELECT id FROM suppliers WHERE user_id = $1', [userId]);      
    if (existing.rows.length) return res.status(409).json({ success: false, message: 'Supplier profile already exists' });

    const {
      business_name, description, gst_number, established_year,
      address_line1, address_line2, city, district, pincode, categories = []
    } = req.body;

    const slug = business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    const result = await pool.query(`
      INSERT INTO suppliers (user_id, business_name, slug, description, gst_number, established_year,
        address_line1, address_line2, city, district, pincode, state)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Tamil Nadu')
      RETURNING *
    `, [userId, business_name, slug, description, gst_number, established_year, address_line1, address_line2, city, district, pincode]);

    const supplier = result.rows[0];
    if (categories.length) {
      const vals = categories.map((_, i) => `($1, $${i + 2})`).join(',');
      await pool.query(`INSERT INTO supplier_categories (supplier_id, category_id) VALUES ${vals} ON CONFLICT DO NOTHING`,
        [supplier.id, ...categories]);
    }
    await pool.query("UPDATE users SET role = 'supplier' WHERE id = $1", [userId]);
    res.status(201).json({ success: true, message: 'Supplier profile created', data: supplier });    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const updateSupplierProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const sup = await pool.query('SELECT id FROM suppliers WHERE user_id = $1', [userId]);
    if (!sup.rows[0]) return res.status(404).json({ success: false, message: 'Supplier profile not found' });
    const supplierId = sup.rows[0].id;

    const fields = ['business_name', 'description', 'gst_number', 'pan_number', 'established_year',  
      'address_line1', 'address_line2', 'city', 'district', 'pincode', 'website_url'];
    const updates = [];
    const params = [];
    let idx = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) { updates.push(`${f} = $${idx}`); params.push(req.body[f]); idx++; }
    }
    if (updates.length) {
      updates.push(`updated_at = NOW()`);
      await pool.query(`UPDATE suppliers SET ${updates.join(', ')} WHERE id = $${idx}`, [...params, supplierId]);
    }

    if (req.body.categories) {
      await pool.query('DELETE FROM supplier_categories WHERE supplier_id = $1', [supplierId]);      
      if (req.body.categories.length) {
        const vals = req.body.categories.map((_, i) => `($1, $${i + 2})`).join(',');
        await pool.query(`INSERT INTO supplier_categories (supplier_id, category_id) VALUES ${vals} ON CONFLICT DO NOTHING`,
          [supplierId, ...req.body.categories]);
      }
    }
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getFeaturedSuppliers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.business_name, s.slug, s.city, s.district, s.logo_url, s.banner_url,
        s.is_verified, s.is_premium, s.average_rating, s.total_reviews,
        ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as categories
      FROM suppliers s
      LEFT JOIN supplier_categories sc ON sc.supplier_id = s.id
      LEFT JOIN categories c ON c.id = sc.category_id
      WHERE s.is_active = true AND s.is_premium = true
      GROUP BY s.id
      ORDER BY s.average_rating DESC, s.total_reviews DESC
      LIMIT 8
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getMySupplierProfile = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*, ARRAY_AGG(DISTINCT jsonb_build_object('id', c.id, 'name', c.name, 'slug', c.slug)) as categories
      FROM suppliers s
      LEFT JOIN supplier_categories sc ON sc.supplier_id = s.id
      LEFT JOIN categories c ON c.id = sc.category_id
      WHERE s.user_id = $1
      GROUP BY s.id
    `, [req.user.userId]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'No supplier profile found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getSupplierStats = async (req, res) => {
  try {
    const sup = await pool.query('SELECT id FROM suppliers WHERE user_id = $1', [req.user.userId]);      
    if (!sup.rows[0]) return res.status(404).json({ success: false, message: 'Not found' });
    const sid = sup.rows[0].id;
    const [inquiries, reviews, views, products] = await Promise.all([
      pool.query('SELECT COUNT(*) as total, COUNT(CASE WHEN status=\'pending\' THEN 1 END) as pending FROM inquiries WHERE supplier_id=$1', [sid]),
      pool.query('SELECT COUNT(*) as total, COALESCE(AVG(rating),0) as avg FROM reviews WHERE supplier_id=$1', [sid]),
      pool.query('SELECT COUNT(*) FROM supplier_views WHERE supplier_id=$1 AND viewed_at > NOW() - INTERVAL \'30 days\'', [sid]),
      pool.query('SELECT COUNT(*) FROM products WHERE supplier_id=$1 AND is_available=true', [sid]), 
    ]);
    res.json({
      success: true,
      data: {
        inquiries: { total: parseInt(inquiries.rows[0].total), pending: parseInt(inquiries.rows[0].pending) },
        reviews: { total: parseInt(reviews.rows[0].total), average: parseFloat(reviews.rows[0].avg).toFixed(1) },
        views_30d: parseInt(views.rows[0].count),
        products: parseInt(products.rows[0].count),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getSuppliers, getSupplierBySlug, createSupplierProfile, updateSupplierProfile,
  getFeaturedSuppliers, getMySupplierProfile, getSupplierStats
};
