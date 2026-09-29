const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAdmin } = require('../auth');

function toApi(row) {
  return {
    id: row.id, ref: row.ref, nom: row.nom, cat: row.cat, desc: row.description,
    pv: Number(row.pv), part: row.part, prix: row.prix, ancien: row.ancien,
    actif: row.actif, stock: row.stock, ventes: row.ventes, note: Number(row.note),
    avis: row.avis, tags: row.tags || [], tone: row.tone, hasImg: row.has_img
  };
}

// GET /api/products — catalogue complet (public)
router.get('/', async (req, res) => {
  const r = await pool.query('select * from products order by ref');
  res.json(r.rows.map(toApi));
});

// GET /api/products/:id/photo — photo d'un produit (public)
router.get('/:id/photo', async (req, res) => {
  const r = await pool.query('select data from product_photos where product_id=$1', [req.params.id]);
  if (!r.rows.length) return res.status(404).json({ error: 'Pas de photo' });
  res.json({ data: r.rows[0].data });
});

// POST /api/products — créer un produit (admin)
router.post('/', requireAdmin, async (req, res) => {
  const p = req.body;
  await pool.query(
    `insert into products (id, ref, nom, cat, description, pv, part, prix, ancien, actif, stock, ventes, note, avis, tags, tone)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
    [p.id, p.ref, p.nom, p.cat, p.desc || '', p.pv || 0, p.part || 0, p.prix || 0, p.ancien || 0,
     p.actif !== false, p.stock || 0, p.ventes || 0, p.note || 0, p.avis || 0, p.tags || [], p.tone || 0]
  );
  res.json({ ok: true });
});

// PUT /api/products/:id — modifier un produit (admin)
router.put('/:id', requireAdmin, async (req, res) => {
  const p = req.body;
  await pool.query(
    `update products set ref=$2, nom=$3, cat=$4, description=$5, pv=$6, part=$7, prix=$8, ancien=$9,
       actif=$10, stock=$11, ventes=$12, note=$13, avis=$14, tags=$15, tone=$16, updated_at=now()
     where id=$1`,
    [req.params.id, p.ref, p.nom, p.cat, p.desc || '', p.pv || 0, p.part || 0, p.prix || 0, p.ancien || 0,
     p.actif !== false, p.stock || 0, p.ventes || 0, p.note || 0, p.avis || 0, p.tags || [], p.tone || 0]
  );
  res.json({ ok: true });
});

// PUT /api/products/:id/photo — envoyer/remplacer une photo (admin), data = base64 data-URI
router.put('/:id/photo', requireAdmin, async (req, res) => {
  const { data } = req.body;
  if (!data) {
    await pool.query('delete from product_photos where product_id=$1', [req.params.id]);
    await pool.query('update products set has_img=false where id=$1', [req.params.id]);
    return res.json({ ok: true });
  }
  await pool.query(
    `insert into product_photos (product_id, data) values ($1,$2)
     on conflict (product_id) do update set data=$2, updated_at=now()`,
    [req.params.id, data]
  );
  await pool.query('update products set has_img=true where id=$1', [req.params.id]);
  res.json({ ok: true });
});

// DELETE /api/products/:id (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  await pool.query('delete from products where id=$1', [req.params.id]);
  res.json({ ok: true });
});

module.exports = router;
