const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

// REGISTER
const register = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length > 0)
      return res.status(400).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1,$2,$3) RETURNING id, name, email',
      [name, email, password_hash]
    );
    const user = result.rows[0];
    res.status(201).json({ user, token: generateToken(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (result.rows.length === 0)
      return res.status(400).json({ error: 'Invalid email or password' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(400).json({ error: 'Invalid email or password' });

    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token: generateToken(user)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET PROFILE
const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, avatar_url, created_at FROM users WHERE id=$1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// SEARCH USERS
const searchUsers = async (req, res) => {
  const { q } = req.query;
  try {
    const result = await pool.query(
      'SELECT id, name, email FROM users WHERE (name ILIKE $1 OR email ILIKE $1) AND id != $2 LIMIT 10',
      [`%${q}%`, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, getProfile, searchUsers };