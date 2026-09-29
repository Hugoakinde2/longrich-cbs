const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAdmin } = require('../auth');

router.get('/', async (req, res) => {
  const r = await pool.query('select * from commerciaux order by ventes desc');
  res.json(r.rows);
});

router.post('/', requireAdmin, async (req, res) => {
  const c = req.body;
  await pool.query(
    `insert into commerciaux (id, nom, zone, tel, ventes, recouvre, objectif, adherents)
     values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [c.id, c.nom, c.zone, c.tel, c.ventes || 0, c.recouvre || 0, c.objectif || 0, c.adherents || 0]
  );
  res.json({ ok: true });
});

router.put('/:id', requireAdmin, async (req, res) => {
  const c = req.body;
  await pool.query(
    `update commerciaux set nom=$2, zone=$3, tel=$4, ventes=$5, recouvre=$6, objectif=$7, adherents=$8 where id=$1`,
    [req.params.id, c.nom, c.zone, c.tel, c.ventes || 0, c.recouvre || 0, c.objectif || 0, c.adherents || 0]
  );
  res.json({ ok: true });
});

router.delete('/:id', requireAdmin, async (req, res) => {
  await pool.query('delete from commerciaux where id=$1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
