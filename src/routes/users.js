const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { hashPass, checkPass, signToken, requireAdmin } = require('../auth');

// POST /api/users/register — créer un compte client
router.post('/register', async (req, res) => {
  const { email, nom, tel, pass } = req.body || {};
  if (!email || !pass) return res.status(400).json({ error: 'Email et mot de passe requis' });
  const exists = await pool.query('select email from users where email=$1', [email]);
  if (exists.rows.length) return res.status(409).json({ error: 'Ce compte existe déjà' });
  const hash = await hashPass(pass);
  await pool.query('insert into users (email, nom, tel, pass_hash) values ($1,$2,$3,$4)', [email, nom, tel, hash]);
  const token = signToken({ email });
  res.json({ token, user: { email, nom, tel } });
});

// POST /api/users/login
router.post('/login', async (req, res) => {
  const { email, pass } = req.body || {};
  const r = await pool.query('select * from users where email=$1', [email]);
  if (!r.rows.length) return res.status(401).json({ error: 'Compte introuvable' });
  const ok = await checkPass(pass, r.rows[0].pass_hash);
  if (!ok) return res.status(401).json({ error: 'Mot de passe incorrect' });
  const token = signToken({ email });
  res.json({ token, user: { email, nom: r.rows[0].nom, tel: r.rows[0].tel } });
});

// GET /api/users — liste (admin, pour l'espace "Clients")
router.get('/', requireAdmin, async (req, res) => {
  const r = await pool.query('select email, nom, tel, cree from users order by cree desc');
  res.json(r.rows);
});

module.exports = router;
