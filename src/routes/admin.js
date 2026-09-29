const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { hashPass, checkPass, signToken } = require('../auth');

// Récupère le hash du mot de passe admin en base ; si absent, l'initialise
// depuis ADMIN_PASSWORD (variable d'environnement, utilisée une seule fois).
async function getAdminHash() {
  const r = await pool.query("select value from admin_settings where key='adminPassHash'");
  if (r.rows.length) return r.rows[0].value;
  const initial = process.env.ADMIN_PASSWORD || 'longrich2026';
  const hash = await hashPass(initial);
  await pool.query(
    "insert into admin_settings (key, value) values ('adminPassHash', $1) on conflict (key) do nothing",
    [hash]
  );
  return hash;
}

router.post('/login', async (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Mot de passe requis' });
  const hash = await getAdminHash();
  const ok = await checkPass(password, hash);
  if (!ok) return res.status(401).json({ error: 'Mot de passe incorrect' });
  const token = signToken({ admin: true });
  res.json({ token });
});

router.post('/change-password', async (req, res) => {
  if (!req.isAdmin) return res.status(403).json({ error: 'Réservé à l\'administrateur' });
  const { newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: '8 caractères minimum' });
  const hash = await hashPass(newPassword);
  await pool.query(
    "insert into admin_settings (key, value) values ('adminPassHash', $1) on conflict (key) do update set value=$1",
    [hash]
  );
  res.json({ ok: true });
});

module.exports = router;
