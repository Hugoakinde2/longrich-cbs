const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAdmin } = require('../auth');

/* ---------- membres ---------- */
router.get('/members', async (req, res) => {
  const r = await pool.query('select * from tontine_members order by ordre');
  res.json(r.rows);
});

router.post('/members', requireAdmin, async (req, res) => {
  const m = req.body;
  await pool.query(
    `insert into tontine_members (ordre, nom, prenoms, idp, tel, ville, statut, paye, won, email)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [m.ordre, m.nom, m.prenoms || '', m.idp || '', m.tel || '', m.ville || '', m.statut || 'actif',
     !!m.paye, m.won || null, m.email || null]
  );
  res.json({ ok: true });
});

router.put('/members/:ordre', requireAdmin, async (req, res) => {
  const m = req.body;
  await pool.query(
    `update tontine_members set nom=$2, prenoms=$3, idp=$4, tel=$5, ville=$6, statut=$7, paye=$8, won=$9, email=$10
     where ordre=$1`,
    [req.params.ordre, m.nom, m.prenoms || '', m.idp || '', m.tel || '', m.ville || '', m.statut || 'actif',
     !!m.paye, m.won || null, m.email || null]
  );
  res.json({ ok: true });
});

router.put('/members/:ordre/paye', requireAdmin, async (req, res) => {
  await pool.query('update tontine_members set paye = not paye where ordre=$1', [req.params.ordre]);
  res.json({ ok: true });
});

router.put('/members/all-paye', requireAdmin, async (req, res) => {
  await pool.query("update tontine_members set paye=true where statut='actif'");
  res.json({ ok: true });
});

router.delete('/members/:ordre', requireAdmin, async (req, res) => {
  await pool.query('delete from tontine_members where ordre=$1', [req.params.ordre]);
  res.json({ ok: true });
});

/* ---------- tirages ---------- */
router.get('/draws', async (req, res) => {
  const r = await pool.query('select * from tontine_draws order by numero desc');
  res.json(r.rows);
});

router.post('/draws', requireAdmin, async (req, res) => {
  const d = req.body; // {numero, date, ids:[], noms:[], gain}
  await pool.query(
    `insert into tontine_draws (numero, date, ids, noms, gain) values ($1,$2,$3,$4,$5)
     on conflict (numero) do update set date=$2, ids=$3, noms=$4, gain=$5`,
    [d.numero, d.date || new Date().toISOString(), d.ids, d.noms, d.gain]
  );
  // marque les gagnants et avance le numéro de tirage
  for (const ordre of (d.ids || [])) {
    await pool.query('update tontine_members set won=$2 where ordre=$1', [ordre, d.date || new Date().toISOString()]);
  }
  await pool.query(
    `insert into tontine_state (id, numero) values (true, $1)
     on conflict (id) do update set numero=$1`,
    [d.numero + 1]
  );
  res.json({ ok: true });
});

/* ---------- versements ---------- */
router.get('/versements', async (req, res) => {
  const r = await pool.query('select * from tontine_versements order by date desc');
  res.json(r.rows);
});

router.post('/versements', requireAdmin, async (req, res) => {
  const v = req.body;
  await pool.query(
    `insert into tontine_versements (id, date, ordre, idp, nom, montant, mode, tirage)
     values ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [v.id, v.date || new Date().toISOString(), v.ordre, v.idp, v.nom, v.montant, v.mode, v.tirage]
  );
  res.json({ ok: true });
});

/* ---------- demandes d'adhésion ---------- */
router.get('/demandes', requireAdmin, async (req, res) => {
  const r = await pool.query("select * from tontine_demandes order by date desc");
  res.json(r.rows);
});

router.post('/demandes', async (req, res) => {
  const d = req.body;
  await pool.query(
    `insert into tontine_demandes (id, date, nom, tel, ville, idp, email, statut)
     values ($1,$2,$3,$4,$5,$6,$7,'En attente')`,
    [d.id, new Date().toISOString(), d.nom, d.tel, d.ville, d.idp || '', d.email || '']
  );
  res.json({ ok: true });
});

router.put('/demandes/:id', requireAdmin, async (req, res) => {
  const { accepter } = req.body; // true = valider, false = refuser
  const statut = accepter ? 'Validée' : 'Refusée';
  const r = await pool.query('update tontine_demandes set statut=$2 where id=$1 returning *', [req.params.id, statut]);
  if (accepter && r.rows.length) {
    const d = r.rows[0];
    const max = await pool.query('select coalesce(max(ordre),0) as m from tontine_members');
    const ordre = max.rows[0].m + 1;
    await pool.query(
      `insert into tontine_members (ordre, nom, idp, tel, ville, statut, paye, email)
       values ($1,$2,$3,$4,$5,'actif',false,$6)`,
      [ordre, d.nom, d.idp, d.tel, d.ville, d.email]
    );
  }
  res.json({ ok: true });
});

/* ---------- état (prochain tirage, numéro courant) ---------- */
router.get('/state', async (req, res) => {
  const r = await pool.query('select prochain, numero from tontine_state where id=true');
  res.json(r.rows[0] || { prochain: null, numero: 1 });
});

router.put('/state', requireAdmin, async (req, res) => {
  const { prochain, numero } = req.body;
  await pool.query(
    `insert into tontine_state (id, prochain, numero) values (true, $1, $2)
     on conflict (id) do update set prochain=$1, numero=$2`,
    [prochain, numero]
  );
  res.json({ ok: true });
});

module.exports = router;
