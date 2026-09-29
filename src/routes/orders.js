const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAdmin } = require('../auth');

async function withLines(order) {
  const r = await pool.query('select id, product_id, nom, prix, qte from order_lines where order_id=$1', [order.id]);
  return {
    id: order.id, date: order.date,
    client: { nom: order.client_nom, tel: order.client_tel, ville: order.client_ville, quartier: order.client_quartier, email: order.client_email },
    lignes: r.rows.map(l => ({ id: l.product_id, nom: l.nom, prix: l.prix, qte: l.qte })),
    livraison: order.livraison, total: order.total, paiement: order.paiement, statut: order.statut
  };
}

// GET /api/orders — liste (admin) ; un client authentifié pourra plus tard filtrer sur son email
router.get('/', requireAdmin, async (req, res) => {
  const r = await pool.query('select * from orders order by date desc');
  res.json(await Promise.all(r.rows.map(withLines)));
});

// POST /api/orders — passer commande (public, comme aujourd'hui sur le site)
router.post('/', async (req, res) => {
  const o = req.body;
  await pool.query(
    `insert into orders (id, date, client_nom, client_tel, client_ville, client_quartier, client_email, livraison, total, paiement, statut)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [o.id, o.date || new Date().toISOString(), o.client.nom, o.client.tel, o.client.ville, o.client.quartier || '',
     o.client.email || '', o.livraison || 0, o.total || 0, o.paiement, o.statut || 'En attente']
  );
  for (const l of (o.lignes || [])) {
    await pool.query(
      'insert into order_lines (order_id, product_id, nom, prix, qte) values ($1,$2,$3,$4,$5)',
      [o.id, l.id, l.nom, l.prix, l.qte]
    );
    await pool.query('update products set stock = greatest(0, stock - $2) where id=$1', [l.id, l.qte]);
  }
  res.json({ ok: true });
});

// PUT /api/orders/:id/statut (admin)
router.put('/:id/statut', requireAdmin, async (req, res) => {
  await pool.query('update orders set statut=$2 where id=$1', [req.params.id, req.body.statut]);
  res.json({ ok: true });
});

module.exports = router;
