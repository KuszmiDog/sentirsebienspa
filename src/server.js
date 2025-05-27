const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // para servir los HTML estáticos

app.get('/api/servicios', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM servicios');
    res.json(rows); // ¡esto debe devolver un JSON!
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener servicios' });
  }
});


app.get('/', (req, res) => {
  res.send('¡Bienvenido al backend del Spa "Sentirse Bien"! 🌿');
});

// Escuchar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

