const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

async function hashPass(plain) {
  return bcrypt.hash(plain, 10);
}
async function checkPass(plain, hash) {
  return bcrypt.compare(plain, hash);
}
function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}
function verifyToken(token) {
  try { return jwt.verify(token, SECRET); } catch (e) { return null; }
}

// Middleware : lit le jeton "Authorization: Bearer xxx" et pose req.user / req.isAdmin
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  const data = token ? verifyToken(token) : null;
  req.user = data;
  req.isAdmin = !!(data && data.admin);
  next();
}

// Middleware : bloque si pas admin
function requireAdmin(req, res, next) {
  if (!req.isAdmin) return res.status(403).json({ error: 'Réservé à l\'administrateur' });
  next();
}

module.exports = { hashPass, checkPass, signToken, verifyToken, auth, requireAdmin };
