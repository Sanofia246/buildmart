const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const register = async (req, res) => {
  try {
    const { name, email, phone, password, role = 'buyer' } = req.body;
    if (!name || !email || !phone || !password)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    const existing = await pool.query('SELECT id FROM users WHERE email = $1 OR phone = $2', [email, phone]);
    if (existing.rows.length)
      return res.status(409).json({ success: false, message: 'Email or phone already registered' });

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, role',
      [name, email, phone, hash, role]
    );
    const user = result.rows[0];
    const token = generateToken(user.id);
    res.status(201).json({ success: true, message: 'Registration successful', data: { user, token } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const result = await pool.query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = generateToken(user.id);
    const { password_hash, ...userSafe } = user;
    res.json({ success: true, message: 'Login successful', data: { user: userSafe, token } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.phone, u.role, u.avatar_url, u.is_verified, u.created_at,
        s.id as supplier_id, s.business_name, s.slug as supplier_slug, s.is_verified as supplier_verified, s.is_premium
       FROM users u LEFT JOIN suppliers s ON s.user_id = u.id WHERE u.id = $1`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!(await bcrypt.compare(currentPassword, result.rows[0].password_hash)))
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { register, login, getMe, changePassword };
