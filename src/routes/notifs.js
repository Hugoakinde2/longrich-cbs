const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAdmin } = require('../auth');

router.get('/', async (req, res) => {
  const r = await pool.query('select * from notifs order by date desc limit 50');
  res.json(r.rows);
});

router.post('/', requireAdmin, async (req, res) => {
  const { id, txt } = req.body;
  await pool.query('insert into notifs (id, date, txt) values ($1,$2,$3)', [id, new Date().toISOString(), txt]);
  res.json({ ok: true });
});

module.exports = router;
