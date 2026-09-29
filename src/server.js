require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { auth } = require('./auth');

const app = express();
app.use(cors());
app.use(express.json({ limit: '8mb' })); // les photos passent en base64, donc limite large
app.use(auth); // pose req.user / req.isAdmin sur chaque requête

app.get('/', (req, res) => res.json({ ok: true, service: 'cbs-be-big-api' }));
app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api/admin', require('./routes/admin'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/commerciaux', require('./routes/commerciaux'));
app.use('/api/tontine', require('./routes/tontine'));
app.use('/api/notifs', require('./routes/notifs'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('API en écoute sur le port ' + PORT));
