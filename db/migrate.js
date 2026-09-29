// Remplit la base Neon avec les données de db/backup.json (catalogue, photos,
// équipe commerciale, membres tontine, versements). À exécuter UNE SEULE FOIS,
// après avoir créé les tables avec schema.sql.
//
// Utilisation :
//   1) npm install
//   2) créer un fichier .env (copier .env.example) avec ta vraie DATABASE_URL
//   3) npm run migrate

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const file = process.argv[2] || path.join(__dirname, 'backup.json');
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log('Lecture de', file);

  console.log('→ produits (' + d.products.length + ')');
  for (const p of d.products) {
    await pool.query(
      `insert into products (id, ref, nom, cat, description, pv, part, prix, ancien, actif, stock, ventes, note, avis, tags, tone, has_img)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       on conflict (id) do update set ref=$2, nom=$3, cat=$4, description=$5, pv=$6, part=$7, prix=$8, ancien=$9,
         actif=$10, stock=$11, ventes=$12, note=$13, avis=$14, tags=$15, tone=$16, has_img=$17`,
      [p.id, p.ref, p.nom, p.cat, p.desc || '', p.pv || 0, p.part || 0, p.prix || 0, p.ancien || 0,
       p.actif !== false, p.stock || 0, p.ventes || 0, p.note || 0, p.avis || 0, p.tags || [], p.tone || 0,
       !!(d.photos && d.photos[p.id])]
    );
  }

  const photoIds = Object.keys(d.photos || {});
  console.log('→ photos (' + photoIds.length + ')');
  for (const id of photoIds) {
    await pool.query(
      `insert into product_photos (product_id, data) values ($1,$2)
       on conflict (product_id) do update set data=$2`,
      [id, d.photos[id]]
    );
  }

  console.log('→ équipe commerciale (' + d.commerciaux.length + ')');
  for (const c of d.commerciaux) {
    await pool.query(
      `insert into commerciaux (id, nom, zone, tel, ventes, recouvre, objectif, adherents)
       values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict (id) do update set
         nom=$2, zone=$3, tel=$4, ventes=$5, recouvre=$6, objectif=$7, adherents=$8`,
      [c.id, c.nom, c.zone, c.tel, c.ventes || 0, c.recouvre || 0, c.objectif || 0, c.adherents || 0]
    );
  }

  console.log('→ membres tontine (' + d.members.length + ')');
  for (const m of d.members) {
    await pool.query(
      `insert into tontine_members (ordre, nom, prenoms, idp, tel, ville, statut, paye, won, email)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) on conflict (ordre) do update set
         nom=$2, prenoms=$3, idp=$4, tel=$5, ville=$6, statut=$7, paye=$8, won=$9, email=$10`,
      [m.ordre, m.nom, m.prenoms || '', m.idp || '', m.tel || '', m.ville || '', m.statut || 'actif',
       !!m.paye, m.won || null, m.email || null]
    );
  }

  console.log('→ versements (' + d.versements.length + ')');
  for (const v of d.versements) {
    await pool.query(
      `insert into tontine_versements (id, date, ordre, idp, nom, montant, mode, tirage)
       values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict (id) do nothing`,
      [v.id, v.date, v.ordre, v.idp, v.nom, v.montant, v.mode, v.tirage]
    );
  }

  const drawKeys = Object.keys(d.draws || {});
  console.log('→ tirages (' + drawKeys.length + ')');
  for (const k of drawKeys) {
    const t = d.draws[k];
    await pool.query(
      `insert into tontine_draws (numero, date, ids, noms, gain) values ($1,$2,$3,$4,$5)
       on conflict (numero) do update set date=$2, ids=$3, noms=$4, gain=$5`,
      [t.numero, t.date, t.ids, t.noms, t.gain]
    );
  }

  console.log('→ demandes (' + (d.demandes || []).length + ')');
  for (const dd of (d.demandes || [])) {
    await pool.query(
      `insert into tontine_demandes (id, date, nom, tel, ville, idp, email, statut)
       values ($1,$2,$3,$4,$5,$6,$7,$8) on conflict (id) do nothing`,
      [dd.id, dd.date, dd.nom, dd.tel, dd.ville, dd.idp || '', dd.email || '', dd.statut || 'En attente']
    );
  }

  console.log('→ notifications (' + (d.notifs || []).length + ')');
  for (const n of (d.notifs || [])) {
    await pool.query(
      `insert into notifs (id, date, txt) values ($1,$2,$3) on conflict (id) do nothing`,
      [n.id || (n.date + '-' + Math.random().toString(36).slice(2)), n.date, n.txt]
    );
  }

  console.log('\nMigration terminée avec succès.');
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
